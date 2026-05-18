import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Toolbar, Equipment, EquipmentSelector, AttributesBar, WallDrawingLayer } from '../Components/index';
import api from '../services/api';
import { calculateFovPolygon } from '../utils/fov';
import { getLocalPoint } from '../utils/points';
import { empty_Walls, segmentsToWallGraph, wallToSegments } from '../utils/wallsConverter';

// Imports for Modals & Document Capture
import ExportModal from '../Components/ExportModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const DEFAULT_CAMERA_SETTINGS = {
  name: '',
  focalLength: 2.8,
  height: 3,
  tilt: 0,
  rotation: 0,
  resolution: '1080p',
  irRange: 30,
  notes: '',
  fovOpacity: 0.3,
  fovColor: 'rgba(0, 150, 255, 0.3)',
  attributes: {},
};

const createDevice = (tool, x, y, id = Date.now(), rotation = 0) => ({
  id,
  type: tool,
  x,
  y,
  ...DEFAULT_CAMERA_SETTINGS,
  rotation,
});

function Workspace({ 
  imageSrc, 
  floorId, 
  onUnsavedChanges = () => {}, 
  hasUnsavedChanges = false,
  workspaceRef,
  exportOptions 
}) {
  const [activeTool, setActiveTool] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [wallGraphs, setWallGraphs] = useState({});
  const toastRef = useRef(null);

  const currentWallGraph = floorId ? (wallGraphs[floorId] ?? empty_Walls) : empty_Walls;
  const currentWalls = wallToSegments(currentWallGraph);

  useEffect(() => {
    if (!floorId) return;
    setEquipment([]);

    const fetchPlacements = async () => {
      try {
        const res = await api.get(`/api/camerplacements/${floorId}`);
        const loaded = (res.data ?? []).map((p) => {
          const device = createDevice(p.type || 'camera', p.x, p.y, p.placementID ?? Date.now(), p.rotation ?? 0);
          return {
            ...device,
            name: p.cameraModel ?? '',
            attributes: {
              cameraId: p.cameraId ?? 0,
              cameraModel: p.cameraModel ?? '',
              brand: p.brand ?? '',
              resolution: p.resolution ?? ''
            }
          };
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
        setWallGraphs((prev) => ({ ...prev, [floorId]: segmentsToWallGraph(loadedWalls) }));
      } catch (err) {
        console.error('Failed to load walls', err);
      }
    };

    fetchPlacements();
    fetchWalls();
  }, [floorId]);

  const updatePlacement = (id, patchOrBuilder) => {
    setEquipment((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const patch = typeof patchOrBuilder === 'function' ? patchOrBuilder(item) : patchOrBuilder;
        return { ...item, ...patch };
      })
    );
    onUnsavedChanges(true);
  };

  const handleNewItem = (event) => {
    event.preventDefault();
    const toolToPlace = event.dataTransfer ? event.dataTransfer.getData('tool') : activeTool;
    if (toolToPlace === 'wall') return;
    if (!toolToPlace) {
      setSelectedItemId(null);
      return;
    }
    const { x, y } = getLocalPoint(event, event.currentTarget);
    setPendingPlacement({ x, y, type: toolToPlace });
    setSelectedItemId(null);
    setActiveTool(null);
  };

  const closeSelector = () => setPendingPlacement(null);

  const handleConfirmPlacement = ({ camera, displayName } = {}) => {
    if (!pendingPlacement) return;
    const { x, y, type, replaceItemId } = pendingPlacement;

    if (replaceItemId != null) {
      if (type === 'camera' && camera) {
        updatePlacement(replaceItemId, (item) => ({
          ...item,
          name: camera.modelNumber ?? item.name,
          resolution: camera.resolution ?? item.resolution,
          attributes: {
            ...(item.attributes ?? {}),
            cameraId: camera.id, cameraModel: camera.modelNumber, brand: camera.brand, resolution: camera.resolution, cameraType: camera.type,
          },
        }));
        setSelectedItemId(replaceItemId);
      }
      return;
    }

    const base = createDevice(type, x, y);
    let newObject = displayName ? { ...base, name: displayName } : base;

    if (type === 'camera' && camera) {
      newObject = {
        ...newObject,
        name: camera.modelNumber ?? newObject.name,
        resolution: camera.resolution ?? newObject.resolution,
        attributes: {
          ...(newObject.attributes ?? {}),
          cameraId: camera.id, cameraModel: camera.modelNumber, brand: camera.brand, resolution: camera.resolution, cameraType: camera.type,
        },
      };
    }

    setEquipment((prev) => [...prev, newObject]);
    setSelectedItemId(newObject.id);
    onUnsavedChanges(true);
  };

  const handleDeleteEquipment = (id) => {
    setEquipment((prev) => prev.filter((item) => item.id !== id));
    setSelectedItemId(null);
    onUnsavedChanges(true);
  };

  const handleWallGraphChange = (updater) => {
    if (!floorId || typeof updater !== 'function') return;
    setWallGraphs((prev) => ({ ...prev, [floorId]: updater(prev[floorId] ?? empty_Walls) }));
    onUnsavedChanges(true);
  };

  // Dynamic style calculation for the FLOATING overlay branding box
  const getFloatingBrandingStyle = () => {
    if (!exportOptions?.brandingData) return { display: 'none' };
    const { position, size } = exportOptions.brandingData;

    // Sizing Scales Configuration
    const scale = size === 'small' ? 0.75 : size === 'large' ? 1.25 : 1.0;



    const baseStyle = {
      position: 'absolute',
      zIndex: 1010,
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderLeft: '4px solid #245d91',
      padding: `${12 * scale}px ${18 * scale}px`,
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: `${15 * scale}px`,
      pointerEvents: 'none', // Prevents capturing layout interactions
      transform: `scale(${scale})`,
      transformOrigin: position || 'top-left'
    };

    // Set placement coordinate rules
    if (position === 'top-right') { baseStyle.top = '20px'; baseStyle.right = '20px'; }
    else if (position === 'bottom-left') { baseStyle.bottom = '20px'; baseStyle.left = '20px'; }
    else if (position === 'bottom-right') { baseStyle.bottom = '20px'; baseStyle.right = '20px'; }
    else { baseStyle.top = '20px'; baseStyle.left = '20px'; } // Default fallback top-left

    return baseStyle;
  };
  const sidebarContainerStyle = {
    background: '#212529',
    borderRight: '1px solid #2d3238',
    minWidth: '220px',
    height: '100%',
    color: '#ffffff'
  };
  return (
    <div className="design-workspace" style={{ background: '#1c1f22', width: '100%', height: '100%', display: 'flex' }}>
      <Toast ref={toastRef} position="top-right" />
      <div className="toolbar-sidebar" style={sidebarContainerStyle}>
        <Toolbar onSelectTool={setActiveTool} />
      </div>

      <div 
        ref={workspaceRef} 
        className="image-fullscreen-wrapper"
        onClick={() => { setSelectedItemId(null); closeSelector(); }}
        onDrop={handleNewItem}
        onDragOver={(e) => e.preventDefault()}
        style={{ 
          position: 'relative', 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '20px', 
          boxSizing: 'border-box',
          background: '#1c1f22'
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

        {/* 🚀 NEW FLOATING BRANDING ELEMENT OVERLAY (Zero structure dimension impact) */}
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

        {exportOptions?.showFov && (
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

        {exportOptions?.showEquipment && equipment.map((item) => (
          <Equipment key={item.id} deviceInstance={item} onSelect={setSelectedItemId} onUpdatePlacement={updatePlacement} />
        ))}

        {exportOptions?.showWalls && (
          <WallDrawingLayer activeTool={activeTool} wallGraph={currentWallGraph} onWallGraphChange={handleWallGraphChange} onExitWallMode={() => setActiveTool(null)} />
        )}

        <p className="item-count" data-html2canvas-ignore="true" style={{ position: 'absolute', bottom: '10px', left: '10px', color: '#ffffff', background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', margin: 0 }}>
          Items Placed: {equipment.length}
        </p>
      </div>

      <EquipmentSelector visible={pendingPlacement != null} placementType={pendingPlacement?.type ?? null} onHide={closeSelector} onConfirmSelection={handleConfirmPlacement} />
      <AttributesBar selectedItem={selectedItemId == null ? null : equipment.find((e) => e.id === selectedItemId) ?? null} onClose={() => setSelectedItemId(null)} onUpdateSettings={(id, field, value) => updatePlacement(id, () => ({ [field]: value }))} onDeleteEquipment={handleDeleteEquipment} />
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
        console.error(err);
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
      // Loop over and trigger downloads for each checked target layer as a discrete file
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

  const currentFloorId = floorLayouts.length > 0 ? floorLayouts[selectedLayer]?.floorID : null;

  return (
    <div className="design-page-container" style={{ background: '#1c1f22', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="design-topbar" style={{ background: '#212529', borderBottom: '1px solid #2d3238', padding: '10px 20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={() => navigate('/app/projects')} style={backBtnStyle}>&larr; Back to Projects</button>
        <button onClick={() => navigate('/app/bom', { state: { projectId } })} style={navBtnStyle}>📦 BOM</button>
        <button onClick={() => navigate('/app/calculator', { state: { projectId } })} style={navBtnStyle}>💾 Storage</button>
        <button onClick={() => navigate('/app/ups', { state: { projectId } })} style={navBtnStyle}>🔋 UPS</button>

        <button onClick={() => setExportModalOpen(true)} style={exportBtnStyle}>
          <span>📤</span> Export Plan Layout
        </button>
      </div>

      <Workspace
        imageSrc={currentImageSrc}
        floorId={currentFloorId}
        onUnsavedChanges={setHasUnsavedChanges}
        hasUnsavedChanges={hasUnsavedChanges}
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

      {/* Inject complete metadata structure configurations directly downstream */}
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