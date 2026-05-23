import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';

import {
  Toolbar,
  Equipment,
  EquipmentSelector,
  AttributesBar,
  WallDrawingLayer,
  WallOverlay
} from '../Components/index';

import api from '../services/api';
import { calculateFovPolygon } from '../utils/fov';
import { getImagePoint } from '../utils/points';
import { empty_Walls, segmentsToWallGraph, wallToSegments } from '../utils/wallsConverter';
import useUndoRedo from '../hooks/useUndoRedo';

// Imports for Modals & Document Capture
import ExportModal from '../Components/ExportModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import '../page_styling/designPage.css';

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

const createDevice = ({ x, y, type, name = '', attributes = {}, id = Date.now() }) => ({
  id,
  type,
  x,
  y,
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
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState(null);

  const measureFloorImage = useCallback(() => {
    const image = imageRef.current;
    const wrapper = workspaceRef?.current;
    if (!image || !wrapper || !image.naturalWidth || !image.naturalHeight) return;

    const styles = window.getComputedStyle(wrapper);
    const availableWidth =
      wrapper.clientWidth - parseFloat(styles.paddingLeft || 0) - parseFloat(styles.paddingRight || 0);
    const availableHeight =
      wrapper.clientHeight - parseFloat(styles.paddingTop || 0) - parseFloat(styles.paddingBottom || 0);
    const displayScale = Math.min(
      availableWidth / image.naturalWidth,
      availableHeight / image.naturalHeight,
      1
    );

    const nextSize = {
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      displayWidth: image.naturalWidth * displayScale,
      displayHeight: image.naturalHeight * displayScale,
    };

    setImageSize((prev) => (
      prev &&
      prev.naturalWidth === nextSize.naturalWidth &&
      prev.naturalHeight === nextSize.naturalHeight &&
      Math.round(prev.displayWidth) === Math.round(nextSize.displayWidth) &&
      Math.round(prev.displayHeight) === Math.round(nextSize.displayHeight)
        ? prev
        : nextSize
    ));
  }, [workspaceRef]);

  useEffect(() => {
    setImageSize(null);
  }, [imageSrc]);

  useEffect(() => {
    const wrapper = workspaceRef?.current;
    if (!wrapper) return undefined;

    const observer = new ResizeObserver(measureFloorImage);
    observer.observe(wrapper);
    window.addEventListener('resize', measureFloorImage);
    measureFloorImage();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureFloorImage);
    };
  }, [measureFloorImage, workspaceRef]);

  // UNDO / REDO
  const applyHistorySnapshot = useCallback(({ equipment: eq, wallGraphs: wg }) => {
    setEquipment(eq);
    setWallGraphs(wg);
  }, []);

  const { commit, undo, redo, canUndo, canRedo } = useUndoRedo(
    { equipment, wallGraphs },
    applyHistorySnapshot
  );


  // WALL GRAPH

  const currentWallGraph = floorId ? (wallGraphs[floorId] ?? empty_Walls) : empty_Walls;
  const currentWalls = wallToSegments(currentWallGraph);

  // LOAD FLOOR DATA
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

  // EQUIPMENT SELECTOR HELPERS
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


  // ESC / ENTER CANCEL TOOL
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!activeTool) return;
      if (activeTool === 'wall') return;

      if (event.key === 'Escape' || event.key === 'Enter') {
        setPendingEquipment(null);
        setActiveTool(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  // UPDATE PLACEMENT (with history)
  // `options.commit` (default true) pushes a snapshot onto the undo stack before applying the patch.
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

  // NEW ITEM PLACEMENT (click or drag/drop)
  const handleCanvasInteraction = (event) => {
    event.stopPropagation();
    const droppedTool = event.dataTransfer ? event.dataTransfer.getData('tool') : '';
    const toolToPlace = droppedTool || activeTool;

    if (toolToPlace && toolToPlace !== 'wall') {
      const { x, y } = getImagePoint(event, event.currentTarget, imageSize);
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
      const shouldUpdateType = type === 'device' && subtype;
      updatePlacement(replaceItemId, (item) => ({
        ...(shouldUpdateType ? { type: subtype.toLowerCase() } : {}),
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
  // CHANGE EQUIPMENT MODEL
  // -----------------------------
  const handleChangeModel = (item) => {
    if (!item) return;
    const selectorType = item.type === 'camera' ? 'camera' : 'device';
    openEquipmentSelector({ x: item.x, y: item.y, type: selectorType, replaceItemId: item.id });
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

  const showFov = exportOptions ? exportOptions.showFov !== false : true;
  const showWalls = showFov;

  const branding = exportOptions?.brandingActive && exportOptions?.brandingData;
  const stageStyle = imageSize
    ? { width: `${imageSize.displayWidth}px`, height: `${imageSize.displayHeight}px` }
    : undefined;
  const overlayViewBox = imageSize
    ? `0 0 ${imageSize.naturalWidth} ${imageSize.naturalHeight}`
    : undefined;

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="design-workspace">
      <Toast ref={toastRef} position="top-right" />

      <div className="toolbar-sidebar">
        <Toolbar onSelectTool={armTool} />
      </div>

      <div
        ref={workspaceRef}
        className="image-fullscreen-wrapper"
        onClick={() => {
          setSelectedItemId(null);
          closeEquipmentSelector();
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <div
          className="floorplan-stage"
          style={stageStyle}
          onClick={handleCanvasInteraction}
          onDrop={(event) => {
            event.preventDefault();
            handleCanvasInteraction(event);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Full-screen design layout"
            className="fullscreen-image"
            draggable="false"
            crossOrigin="anonymous"
            onLoad={measureFloorImage}
            style={imageSize ? { width: '100%', height: '100%' } : undefined}
          />

          {branding && (
            <div className="floating-branding">
              {branding.logo && (
                <img src={branding.logo} alt="Logo" className="floating-branding__logo" />
              )}
              <div>
                <h4 className="floating-branding__title">
                  {branding.projectTitle || 'Specification Layout'}
                </h4>
                <p className="floating-branding__company">{branding.companyName}</p>
              </div>
            </div>
          )}

          {showFov && (
            <svg className="fov-overlay" viewBox={overlayViewBox} preserveAspectRatio="none">
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

          {equipment.map((item) => (
            <Equipment
              key={item.id}
              deviceInstance={item}
              imageSize={imageSize}
              onSelect={setSelectedItemId}
              onUpdatePlacement={updatePlacement}
            />
          ))}

          {showWalls && activeTool !== 'wall' && (
            <WallOverlay wallGraph={currentWallGraph} scale={scale} imageSize={imageSize} />
          )}

          {activeTool === 'wall' && (
            <WallDrawingLayer
              wallGraph={currentWallGraph}
              scale={scale}
              imageSize={imageSize}
              onWallGraphChange={handleWallGraphChange}
              onExitWallMode={() => armTool(null)}
            />
          )}
        </div>

        <p className="item-count" data-html2canvas-ignore="true">
          Items Placed: {equipment.length}
        </p>

        <div className="workspace-actions" data-html2canvas-ignore="true">
          <button
            type="button"
            className="design-nav-btn"
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            onClick={(e) => {
              e.stopPropagation();
              undo();
            }}
          >
            <i className="pi pi-undo" />
          </button>
          <button
            type="button"
            className="design-nav-btn"
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            onClick={(e) => {
              e.stopPropagation();
              redo();
            }}
          >
            <i className="pi pi-refresh" />
          </button>
          <button
            type="button"
            className="workspace-save-btn"
            disabled={saving}
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
          >
            <i className={`pi ${saving ? 'pi-spin pi-spinner' : 'pi-save'}`} />
            {saving ? 'Saving...' : 'Save'}
          </button>
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
        onChangeModel={handleChangeModel}
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
    showFov: true, brandingActive: false, brandingData: null,
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

  // Switch to a layer with the given export config, wait for paint, then rasterise.
  const renderLayer = async (idx, settings, scale, delay) => {
    setSelectedLayer(idx);
    setExportWorkspaceConfig({
      showFov: settings.showFov,
      brandingActive: true, brandingData: settings.branding,
    });
    await new Promise((r) => setTimeout(r, delay));
    if (!workspaceRef.current) return null;
    try { return await html2canvas(workspaceRef.current, { useCORS: true, scale }); }
    catch (err) { console.error(err); return null; }
  };

  const handleExecuteExport = async (settings) => {
    setExportModalOpen(false);
    const filename = settings.branding.projectTitle.replace(/\s+/g, '_');
    const layers = settings.selectedLayerIds?.length
      ? floorLayouts.flatMap((l, i) => settings.selectedLayerIds.includes(l.floorID) ? [i] : [])
      : [selectedLayer];
    const original = selectedLayer;

    if (settings.exportType === 'png') {
      for (const i of layers) {
        const canvas = await renderLayer(i, settings, 2, 350);
        if (!canvas) continue;
        Object.assign(document.createElement('a'), {
          download: `${filename}_Layer_${floorLayouts[i]?.layer || i + 1}.png`,
          href: canvas.toDataURL('image/png'),
        }).click();
      }
    } else if (settings.exportType === 'pdf') {
      const orient = settings.orientation === 'portrait' ? 'p' : 'l';
      let pdf = null;
      for (const i of layers) {
        const canvas = await renderLayer(i, settings, 1.5, 400);
        if (!canvas) continue;
        const { width: w, height: h } = canvas;
        if (!pdf) pdf = new jsPDF({ orientation: orient, unit: 'px', format: [w, h] });
        else pdf.addPage([w, h], orient);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      }
      pdf?.save(`${filename}_Report.pdf`);
    }

    setSelectedLayer(original);
    setExportWorkspaceConfig({ showFov: true, brandingActive: false, brandingData: null });
  };

  if (loading) return <p className="design-message">Loading floor layouts...</p>;

  const currentImageSrc = imageSrcFromState
    ? imageSrcFromState
    : floorLayouts.length > 0
    ? `http://localhost:5113/api/floorlayouts/image/${floorLayouts[selectedLayer]?.floorID}`
    : null;

  if (!currentImageSrc) {
    return <p className="design-message">No floor layouts found for this project.</p>;
  }

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
    <div className="design-page-container">
      <div className="design-topbar">
        <button onClick={handleBackButton} className="design-back-btn">&larr; Back to Projects</button>
        <button onClick={handleBomButton} className="design-nav-btn">📦 BOM</button>
        <button onClick={() => navigate('/app/calculator', { state: { projectId } })} className="design-nav-btn">💾 Storage</button>
        <button onClick={() => navigate('/app/ups', { state: { projectId } })} className="design-nav-btn">🔋 UPS</button>

        <button onClick={() => setExportModalOpen(true)} className="design-export-btn">
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
        <div className="design-layer-controls">
          {floorLayouts.map((layout, index) => (
            <button
              key={layout.floorID}
              type="button"
              className={`design-layer-btn${selectedLayer === index ? ' design-layer-btn--active' : ''}`}
              onClick={() => setSelectedLayer(index)}
            >
              Layer {layout.layer}
            </button>
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

export default DesignPage;
