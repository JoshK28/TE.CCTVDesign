import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';

import {
  Toolbar,
  Equipment,
  EquipmentSelector,
  AttributesBar,
  WallDrawingLayer
} from '../Components/index';

import api from '../services/api';
import { calculateFovPolygon } from '../utils/fov';
import { getLocalPoint } from '../utils/points';
import { empty_Walls, segmentsToWallGraph, wallToSegments } from '../utils/wallsConverter';
import useUndoRedo from '../hooks/useUndoRedo';

// Imports for Modals & Document Capture
import ExportModal from '../Components/ExportModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const CAMERA_DEFAULTS = {
  focalLength: 2.8,
  height: 3,
  tilt: 0,
  resolution: '1080p',
  irRange: 30,
  notes: '',
  fovOpacity: 0.3,
  fovColor: 'rgba(0, 150, 255, 0.3)',
};

const createCamera = ({ x, y, name = '', attributes = {}, rotation = 0, id = Date.now() }) => ({
  id,
  type: 'camera',
  x,
  y,
  rotation,
  name: name || attributes.cameraModel || attributes.modelName || '',
  ...CAMERA_DEFAULTS,
  resolution: attributes.resolution ?? CAMERA_DEFAULTS.resolution,
  attributes,
});

const createDevice = ({ x, y, type, name = '', attributes = {}, rotation = 0, id = Date.now() }) => ({
  id,
  type,
  x,
  y,
  rotation,
  name: name || attributes.modelName || '',
  attributes,
});

function Workspace({
  imageSrc,
  floorId,
  scale,
  onUnsavedChanges = () => {},
  workspaceRef,
  exportOptions,
}) {
  const [activeTool, setActiveTool] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [pendingEquipment, setPendingEquipment] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [wallGraphs, setWallGraphs] = useState({});
  const [saving, setSaving] = useState(false);

  const toastRef = useRef(null);

  // -----------------------------
  // UNDO / REDO
  // -----------------------------
  const applyHistorySnapshot = useCallback(({ equipment: eq, wallGraphs: wg }) => {
    setEquipment(eq);
    setWallGraphs(wg);
  }, []);

  const { commit, undo, redo, canUndo, canRedo } = useUndoRedo(
    { equipment, wallGraphs },
    applyHistorySnapshot
  );

  // -----------------------------
  // WALL GRAPH
  // -----------------------------
  const currentWallGraph = floorId ? (wallGraphs[floorId] ?? empty_Walls) : empty_Walls;
  const currentWalls = wallToSegments(currentWallGraph);

  // -----------------------------
  // LOAD FLOOR DATA
  // -----------------------------
  useEffect(() => {
    if (!floorId) return;

    setEquipment([]);

    const fetchPlacements = async () => {
      try {
        const res = await api.get(`/api/camerplacements/${floorId}`);
        const loaded = (res.data ?? []).map((p) => {
          const attributes = {
            cameraId: p.cameraId ?? 0,
            cameraModel: p.cameraModel ?? '',
            brand: p.brand ?? '',
            resolution: p.resolution ?? '',
          };
          const args = {
            x: p.x,
            y: p.y,
            id: p.placementID ?? Date.now(),
            rotation: p.rotation ?? 0,
            name: p.cameraModel ?? '',
            attributes,
          };
          const type = p.type || 'camera';
          return type === 'camera' ? createCamera(args) : createDevice({ ...args, type });
        });
        setEquipment(loaded);
      } catch (err) {
        console.error('Failed to load placements', err);
      }
    };

    const fetchWalls = async () => {
      try {
        const res = await api.get(`/api/walls/${floorId}`);
        const loadedWalls = (res.data ?? []).map((w) => ({
          id: w.wallID, x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2,
          length: w.length, realWorldLength: w.realWorldLength, realWorldHeight: w.realWorldHeight
        }));
        setWallGraphs((prev) => ({
          ...prev,
          [floorId]: segmentsToWallGraph(loadedWalls)
        }));
      } catch (err) {
        console.error('Failed to load walls', err);
      }
    };

    fetchPlacements();
    fetchWalls();
  }, [floorId]);

  // -----------------------------
  // EQUIPMENT SELECTOR HELPERS
  // -----------------------------
  const closeEquipmentSelector = () => setPendingEquipment(null);

  const openEquipmentSelector = ({ x, y, type, replaceItemId }) => {
    setPendingEquipment(
      replaceItemId != null ? { x, y, type, replaceItemId } : { x, y, type }
    );
    setSelectedItemId(null);
    setActiveTool(null);
  };

  const armTool = (tool) => {
    closeEquipmentSelector();
    setActiveTool(tool);
  };

  // -----------------------------
  // ESC / ENTER CANCEL TOOL
  // -----------------------------
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!activeTool) return;
      if (activeTool === 'wall') return;

      if (event.key === 'Escape' || event.key === 'Enter') {
        armTool(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  // -----------------------------
  // UPDATE PLACEMENT (with history)
  // -----------------------------
  // `options.commit` (default true) pushes a snapshot onto the undo stack
  // before applying the patch. Streaming callers (e.g. a drag's pointer-move
  // loop, slider drag) should pass `{ commit: false }` after the first
  // update of the interaction so the whole gesture collapses into a single
  // undo entry.
  const updatePlacement = (id, patchOrBuilder, options = {}) => {
    const { commit: shouldCommit = true } = options;
    if (shouldCommit) commit();

    setEquipment((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const patch =
          typeof patchOrBuilder === 'function'
            ? patchOrBuilder(item)
            : patchOrBuilder;
        return { ...item, ...patch };
      })
    );

    onUnsavedChanges(true);
  };

  // -----------------------------
  // NEW ITEM PLACEMENT (click or drag/drop)
  // -----------------------------
  const handleCanvasInteraction = (event) => {
    const droppedTool = event.dataTransfer ? event.dataTransfer.getData('tool') : '';
    const toolToPlace = droppedTool || activeTool;

    if (toolToPlace && toolToPlace !== 'wall') {
      const { x, y } = getLocalPoint(event, event.currentTarget);
      openEquipmentSelector({ x, y, type: toolToPlace });
      return;
    }

    setSelectedItemId(null);
    closeEquipmentSelector();
  };

  const handleConfirmPlacement = ({ subtype, name, attributes = {} } = {}) => {
    if (!pendingEquipment) return;

    commit();

    const { x, y, type, replaceItemId } = pendingEquipment;

    if (replaceItemId != null) {
      updatePlacement(replaceItemId, (item) => ({
        name: name ?? item.name,
        attributes: { ...(item.attributes ?? {}), ...attributes },
      }));
      setSelectedItemId(replaceItemId);
      return;
    }

    const resolvedType = type === 'device' && subtype ? subtype.toLowerCase() : type;
    const factory = resolvedType === 'camera' ? createCamera : createDevice;
    const newObject = factory({ x, y, type: resolvedType, name, attributes });

    setEquipment((prev) => [...prev, newObject]);
    setSelectedItemId(newObject.id);
    onUnsavedChanges(true);
  };

  // -----------------------------
  // CHANGE CAMERA MODEL
  // -----------------------------
  const handleChangeCameraModel = (item) => {
    if (!item || item.type !== 'camera') return;
    openEquipmentSelector({ x: item.x, y: item.y, type: 'camera', replaceItemId: item.id });
  };

  // -----------------------------
  // DELETE EQUIPMENT
  // -----------------------------
  const handleDeleteEquipment = (id) => {
    commit();

    setEquipment((prev) => prev.filter((item) => item.id !== id));
    setSelectedItemId(null);
    onUnsavedChanges(true);
  };

  // -----------------------------
  // WALL GRAPH CHANGE
  // -----------------------------
  const handleWallGraphChange = (updater) => {
    if (!floorId || typeof updater !== 'function') return;

    commit();

    setWallGraphs((prev) => ({
      ...prev,
      [floorId]: updater(prev[floorId] ?? empty_Walls),
    }));

    onUnsavedChanges(true);
  };

  // -----------------------------
  // SAVE
  // -----------------------------
  const handleSave = async () => {
    if (!floorId) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Cannot save',
        detail: 'No floor layout selected',
      });
      return;
    }

    setSaving(true);

    try {
      const placements = equipment.map((item) => ({
        floorID: floorId,
        cameraId: item.attributes?.cameraId ?? null,
        networkingId: item.attributes?.networkingId ?? null,
        accessControlId: item.attributes?.accessControlId ?? null,
        x: item.x,
        y: item.y,
        rotation: item.rotation || 0,
        type: item.type || 'camera',
        cameraModel: item.attributes?.cameraModel ?? '',
        brand: item.attributes?.brand ?? '',
        resolution: item.attributes?.resolution ?? ''
      }));

      await api.post(`/api/camerplacements/save/${floorId}`, placements);

      const wallsToSave = currentWalls.map((wall) => ({
        floorID: floorId,
        x1: wall.x1,
        y1: wall.y1,
        x2: wall.x2,
        y2: wall.y2,
        length:
          wall.length ?? Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1),
        realWorldLength: wall.realWorldLength ?? 0,
        realWorldHeight: wall.realWorldHeight ?? 0,
      }));

      await api.post(`/api/walls/save/${floorId}`, wallsToSave);

      toastRef.current?.show({
        severity: 'success',
        detail: 'Placements and walls saved successfully.',
      });

      onUnsavedChanges(false);
    } catch (err) {
      const apiMessage = err?.response?.data;
      const errorText =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || err?.message || 'Failed to save';

      toastRef.current?.show({
        severity: 'error',
        summary: 'Save failed',
        detail: errorText,
      });

      console.error('Failed to save', err);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // FLOATING BRANDING OVERLAY STYLE
  // -----------------------------
  const getFloatingBrandingStyle = () => {
    if (!exportOptions?.brandingData) return { display: 'none' };
    const { position, size } = exportOptions.brandingData;

    // Sizing Scales Configuration
    const brandingScale = size === 'small' ? 0.75 : size === 'large' ? 1.25 : 1.0;

    const baseStyle = {
      position: 'absolute',
      zIndex: 1010,
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderLeft: '4px solid #245d91',
      padding: `${12 * brandingScale}px ${18 * brandingScale}px`,
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: `${15 * brandingScale}px`,
      pointerEvents: 'none', // Prevents capturing layout interactions
      transform: `scale(${brandingScale})`,
      transformOrigin: position || 'top-left',
    };

    if (position === 'top-right') { baseStyle.top = '20px'; baseStyle.right = '20px'; }
    else if (position === 'bottom-left') { baseStyle.bottom = '20px'; baseStyle.left = '20px'; }
    else if (position === 'bottom-right') { baseStyle.bottom = '20px'; baseStyle.right = '20px'; }
    else { baseStyle.top = '20px'; baseStyle.left = '20px'; }

    return baseStyle;
  };

  const sidebarContainerStyle = {
    background: '#212529',
    borderRight: '1px solid #2d3238',
    minWidth: '220px',
    height: '100%',
    color: '#ffffff',
  };

  // exportOptions may be undefined when not in an export pass — default to showing everything.
  const showFov = exportOptions ? exportOptions.showFov !== false : true;
  const showWalls = exportOptions ? exportOptions.showWalls !== false : true;
  const showEquipment = exportOptions ? exportOptions.showEquipment !== false : true;

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="design-workspace" style={{ background: '#1c1f22', width: '100%', height: '100%', display: 'flex' }}>
      <Toast ref={toastRef} position="top-right" />

      <div className="toolbar-sidebar" style={sidebarContainerStyle}>
        <Toolbar onSelectTool={armTool} />
      </div>

      <div
        ref={workspaceRef}
        className="image-fullscreen-wrapper"
        onClick={handleCanvasInteraction}
        onDrop={(event) => {
          event.preventDefault();
          handleCanvasInteraction(event);
        }}
        onDragOver={(e) => e.preventDefault()}
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          boxSizing: 'border-box',
          background: '#1c1f22',
        }}
      >
        <img
          src={imageSrc}
          alt="Full-screen design layout"
          className="fullscreen-image"
          draggable="false"
          crossOrigin="anonymous"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)', borderRadius: '4px' }}
        />

        {/* FLOATING BRANDING ELEMENT OVERLAY */}
        {exportOptions?.brandingActive && exportOptions?.brandingData && (
          <div style={getFloatingBrandingStyle()}>
            {exportOptions.brandingData.logo && (
              <img src={exportOptions.brandingData.logo} alt="Logo" style={{ maxHeight: '35px', maxWidth: '100px', objectFit: 'contain' }} />
            )}
            <div>
              <h4 style={{ margin: 0, color: '#1c1f22', fontSize: '14px', fontWeight: '700', lineHeight: 1.2 }}>
                {exportOptions.brandingData.projectTitle || 'Specification Layout'}
              </h4>
              <p style={{ margin: '2px 0 0 0', color: '#495057', fontSize: '11px', fontWeight: '500' }}>
                {exportOptions.brandingData.companyName}
              </p>
            </div>
          </div>
        )}

        {showFov && (
          <svg className="fov-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {equipment
              .filter((item) => item.type === 'camera')
              .map((item) => (
                <polygon
                  key={item.id}
                  points={calculateFovPolygon(item, currentWalls)}
                  fill={item.fovColor ?? 'rgba(0, 150, 255, 0.3)'}
                  stroke={item.fovColor ?? 'rgba(0, 150, 255, 0.3)'}
                  strokeWidth="2"
                />
              ))}
          </svg>
        )}

        {showEquipment && equipment.map((item) => (
          <Equipment
            key={item.id}
            deviceInstance={item}
            onSelect={setSelectedItemId}
            onUpdatePlacement={updatePlacement}
          />
        ))}

        {showWalls && (
          <WallDrawingLayer
            activeTool={activeTool}
            wallGraph={currentWallGraph}
            scale={scale}
            onWallGraphChange={handleWallGraphChange}
            onExitWallMode={() => armTool(null)}
          />
        )}

        <p
          className="item-count"
          data-html2canvas-ignore="true"
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            color: '#ffffff',
            background: 'rgba(0,0,0,0.5)',
            padding: '4px 8px',
            borderRadius: '4px',
            margin: 0,
          }}
        >
          Items Placed: {equipment.length}
        </p>

        <div
          data-html2canvas-ignore="true"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1005,
            display: 'flex',
            gap: '8px',
          }}
        >
          <Button
            type="button"
            icon="pi pi-undo"
            severity="secondary"
            disabled={!canUndo}
            tooltip="Undo (Ctrl+Z)"
            tooltipOptions={{ position: 'bottom' }}
            onClick={(e) => {
              e.stopPropagation();
              undo();
            }}
          />
          <Button
            type="button"
            icon="pi pi-refresh"
            severity="secondary"
            disabled={!canRedo}
            tooltip="Redo (Ctrl+Y)"
            tooltipOptions={{ position: 'bottom' }}
            onClick={(e) => {
              e.stopPropagation();
              redo();
            }}
          />
          <Button
            type="button"
            label="Save"
            icon="pi pi-save"
            severity="success"
            loading={saving}
            disabled={saving}
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
          />
        </div>
      </div>

      <EquipmentSelector
        visible={pendingEquipment != null}
        placementType={pendingEquipment?.type ?? null}
        onHide={closeEquipmentSelector}
        onConfirmSelection={handleConfirmPlacement}
      />

      <AttributesBar
        selectedItem={
          selectedItemId == null
            ? null
            : equipment.find((e) => e.id === selectedItemId) ?? null
        }
        onClose={() => setSelectedItemId(null)}
        onUpdateSettings={(id, field, value) =>
          updatePlacement(id, () => ({ [field]: value }))
        }
        onChangeCameraModel={handleChangeCameraModel}
        onDeleteEquipment={handleDeleteEquipment}
      />
    </div>
  );
}

function DesignPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const projectId = location.state?.projectId;
  const imageSrcFromState = location.state?.imageSrc;

  const [floorLayouts, setFloorLayouts] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportWorkspaceConfig, setExportWorkspaceConfig] = useState({
    showFov: true, showWalls: true, showEquipment: true, brandingActive: false, brandingData: null
  });

  const workspaceRef = useRef(null);

  useEffect(() => {
    if (imageSrcFromState) { setLoading(false); return; }
    if (!projectId) { navigate('/app/projects'); return; }

    const fetchFloorLayouts = async () => {
      try {
        const res = await api.get(`/api/floorlayouts/${projectId}`);
        setFloorLayouts(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch floor layouts', err);
        setLoading(false);
      }
    };
    fetchFloorLayouts();
  }, [projectId, imageSrcFromState, navigate]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // ── REFACTORED SELECTION EXPORT DRIVER ENGINE ──
  const handleExecuteExport = async (settings) => {
    setExportModalOpen(false);
    const filename = `${settings.branding.projectTitle.replace(/\s+/g, '_')}`;

    // Determine target layers based on user selection in modal
    const layersToExport = settings.selectedLayerIds && settings.selectedLayerIds.length > 0
      ? floorLayouts.reduce((acc, current, idx) => {
          if (settings.selectedLayerIds.includes(current.floorID)) acc.push(idx);
          return acc;
        }, [])
      : [selectedLayer]; // Fallback to current layout if nothing selected

    const originalLayerIndex = selectedLayer;

    if (settings.exportType === 'png') {
      for (const idx of layersToExport) {
        setSelectedLayer(idx);
        setExportWorkspaceConfig({
          showFov: settings.showFov, showWalls: settings.showWalls, showEquipment: settings.showEquipment,
          brandingActive: true, brandingData: settings.branding
        });

        await sleep(350);

        if (workspaceRef.current) {
          try {
            const canvas = await html2canvas(workspaceRef.current, { useCORS: true, scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${filename}_Layer_${floorLayouts[idx]?.layer || idx + 1}.png`;
            link.href = imgData;
            link.click();
          } catch (err) {
            console.error(err);
          }
        }
      }
      setSelectedLayer(originalLayerIndex);
      resetExportConfig();
      return;
    }

    if (settings.exportType === 'pdf') {
      let pdfInstance = null;

      for (let i = 0; i < layersToExport.length; i++) {
        const targetIdx = layersToExport[i];
        setSelectedLayer(targetIdx);
        setExportWorkspaceConfig({
          showFov: settings.showFov, showWalls: settings.showWalls, showEquipment: settings.showEquipment,
          brandingActive: true, brandingData: settings.branding
        });

        await sleep(400); // Wait safely for images to render correctly

        if (!workspaceRef.current) continue;

        try {
          const canvas = await html2canvas(workspaceRef.current, { useCORS: true, scale: 1.5 });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const pdfOrientation = settings.orientation === 'portrait' ? 'p' : 'l';

          if (i === 0) {
            pdfInstance = new jsPDF({ orientation: pdfOrientation, unit: 'px', format: [imgWidth, imgHeight] });
          } else {
            pdfInstance.addPage([imgWidth, imgHeight], pdfOrientation);
          }
          pdfInstance.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        } catch (err) {
          console.error(err);
        }
      }

      if (pdfInstance) {
        pdfInstance.save(`${filename}_Report.pdf`);
      }

      setSelectedLayer(originalLayerIndex);
      resetExportConfig();
    }
  };

  const resetExportConfig = () => {
    setExportWorkspaceConfig({ showFov: true, showWalls: true, showEquipment: true, brandingActive: false, brandingData: null });
  };

  if (loading) return <p style={{ color: '#ffffff', padding: '20px' }}>Loading floor layouts...</p>;

  const currentImageSrc = imageSrcFromState
    ? imageSrcFromState
    : floorLayouts.length > 0
    ? `http://localhost:5113/api/floorlayouts/image/${floorLayouts[selectedLayer]?.floorID}`
    : null;

  if (!currentImageSrc) return <p style={{ color: '#ffffff', padding: '20px' }}>No floor layouts found for this project.</p>;

  const currentFloorId =
    floorLayouts.length > 0 ? floorLayouts[selectedLayer]?.floorID : null;
  const currentScale =
    floorLayouts.length > 0 ? floorLayouts[selectedLayer]?.scale ?? '' : '';

  const handleBackButton = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Do you want to leave without saving?'
      );
      if (confirmLeave) navigate('/app/projects');
    } else {
      navigate('/app/projects');
    }
  };

  const handleBomButton = () => {
    if (hasUnsavedChanges) {
      const ok = window.confirm('You have unsaved changes. Please save before viewing the Bill of Materials.');
      if (!ok) return;
    }
    navigate('/app/bom', { state: { projectId } });
  };

  return (
    <div className="design-page-container" style={{ background: '#1c1f22', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="design-topbar" style={{ background: '#212529', borderBottom: '1px solid #2d3238', padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={handleBackButton} style={backBtnStyle}>&larr; Back to Projects</button>
        <button onClick={handleBomButton} style={navBtnStyle}>📦 BOM</button>
        <button onClick={() => navigate('/app/calculator', { state: { projectId } })} style={navBtnStyle}>💾 Storage</button>
        <button onClick={() => navigate('/app/ups', { state: { projectId } })} style={navBtnStyle}>🔋 UPS</button>

        <button onClick={() => setExportModalOpen(true)} style={exportBtnStyle}>
          <span>📤</span> Export Plan Layout
        </button>
      </div>

      <Workspace
        imageSrc={currentImageSrc}
        floorId={currentFloorId}
        scale={currentScale}
        onUnsavedChanges={setHasUnsavedChanges}
        workspaceRef={workspaceRef}
        exportOptions={exportWorkspaceConfig}
      />

      {floorLayouts.length > 1 && (
        <div style={footerLayerControlStyle}>
          {floorLayouts.map((layout, index) => (
            <Button
              key={layout.floorID}
              type="button"
              label={`Layer ${layout.layer}`}
              onClick={() => setSelectedLayer(index)}
              style={{
                padding: '6px 16px', borderRadius: '20px',
                backgroundColor: selectedLayer === index ? '#245d91' : '#343a40',
                color: '#ffffff', fontWeight: selectedLayer === index ? 'bold' : 'normal', border: 'none',
              }}
            />
          ))}
        </div>
      )}

      <ExportModal
        visible={exportModalOpen}
        floorLayouts={floorLayouts}
        currentLayerId={currentFloorId}
        onHide={() => setExportModalOpen(false)}
        onConfirmExport={handleExecuteExport}
      />
    </div>
  );
}

const navBtnStyle = { padding: '8px 18px', backgroundColor: '#343a40', color: '#ffffff', border: '1px solid #495057', borderRadius: '4px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '500' };
const backBtnStyle = { padding: '8px 15px', backgroundColor: 'transparent', color: '#ced4da', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' };
const exportBtnStyle = { padding: '8px 20px', backgroundColor: '#245d91', color: '#ffffff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' };
const footerLayerControlStyle = { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', backgroundColor: 'rgba(33, 37, 41, 0.85)', border: '1px solid #2d3238', padding: '10px 20px', borderRadius: '30px', zIndex: 1000 };

export default DesignPage;
