import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Toolbar, Equipment, EquipmentSelector, AttributesBar, WallDrawingLayer } from '../Components/index';
import api from '../services/api';
import { calculateFovPolygon } from '../utils/fov';
import { getLocalPoint } from '../utils/points';
import { empty_Walls, wallToSegments } from '../utils/wallsConverter';

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

const createDevice = (tool, x, y, id = Date.now()) => ({
  id,
  type: tool,
  x,
  y,
  ...DEFAULT_CAMERA_SETTINGS,
});

function Workspace({ imageSrc, floorId, onUnsavedChanges = () => {} }) {
  const [activeTool, setActiveTool] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [displaySelector, setDisplaySelector] = useState(false);

  const [equipment, setEquipment] = useState([]);
  const [wallGraphs, setWallGraphs] = useState({});

  const [saving, setSaving] = useState(false);
  const toastRef = useRef(null);

  const currentWallGraph = floorId ? (wallGraphs[floorId] ?? empty_Walls) : empty_Walls;
  const currentWalls = wallToSegments(currentWallGraph);

  useEffect(() => {
    if (!floorId) return;

    const fetchPlacements = async () => {
      try {
        const res = await api.get(`/api/camerplacements/${floorId}`);
        const loaded = (res.data ?? []).map((p) =>
          createDevice(p.type || p.kind || 'camera', p.x, p.y, p.placementID ?? Date.now())
        );
        setEquipment(loaded);
      } catch (err) {
        console.error('Failed to load placements', err);
      }
    };

    fetchPlacements();
  }, [floorId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!activeTool) return;
      if (activeTool === 'wall') return;
      if (event.key === 'Escape' || event.key === 'Enter') {
        setActiveTool(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

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

    const newDevice = createDevice(toolToPlace, x, y);
    setEquipment((prev) => [...prev, newDevice]);
    setSelectedItemId(newDevice.id);
    setActiveTool(null);
    setDisplaySelector(true);
    onUnsavedChanges(true);
  };

  const handleSelectCamera = (camera) => {
    const targetId = selectedItemId ?? equipment[equipment.length - 1]?.id;
    if (!targetId) return;

    updatePlacement(targetId, (item) => ({
      name: camera.modelNumber ?? '',
      resolution: camera.resolution ?? '1080p',
      attributes: {
        ...(item.attributes ?? {}),
        cameraId: camera.id,
        cameraModel: camera.modelNumber,
        brand: camera.brand,
        resolution: camera.resolution,
        cameraType: camera.type,
      },
    }));
  };

  const handleDeleteEquipment = (id) => {
    setEquipment((prev) => prev.filter((item) => item.id !== id));
    setSelectedItemId(null);
    onUnsavedChanges(true);
  };

  const handleWallGraphChange = (updater) => {
    if (!floorId || typeof updater !== 'function') return;
    setWallGraphs((prev) => ({
      ...prev,
      [floorId]: updater(prev[floorId] ?? empty_Walls),
    }));
    onUnsavedChanges(true);
  };

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
        cameraId: item.attributes?.cameraId ?? 0,
        x: item.x,
        y: item.y,
        rotation: item.rotation || 0,
        type: item.type || 'camera',
      }));

      await api.post(`/api/camerplacements/save/${floorId}`, placements);
      toastRef.current?.show({
        severity: 'success',
        detail: 'Placements saved successfully.',
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
      console.error('Failed to save placements', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="design-workspace">
      <Toast ref={toastRef} position="top-right" />
      <div className="toolbar-sidebar">
        <Toolbar onSelectTool={setActiveTool} />
      </div>

      <div
        className="image-fullscreen-wrapper"
        onClick={() => setSelectedItemId(null)}
        onDrop={handleNewItem}
        onDragOver={(e) => e.preventDefault()}
      >
        <img
          src={imageSrc}
          alt="Full-screen design layout"
          className="fullscreen-image"
          draggable="false"
        />
        <svg className="fov-overlay">
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

        {equipment.map((item) => (
          <Equipment
            key={item.id}
            deviceInstance={item}
            onSelect={setSelectedItemId}
            onUpdatePlacement={updatePlacement}
          />
        ))}

        <WallDrawingLayer
          activeTool={activeTool}
          wallGraph={currentWallGraph}
          onWallGraphChange={handleWallGraphChange}
          onExitWallMode={() => setActiveTool(null)}
        />
        <p className="item-count">Items Placed: {equipment.length}</p>

        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1005,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={saving}
            style={{
              padding: '8px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <EquipmentSelector
        visible={displaySelector}
        onHide={() => {
          setDisplaySelector(false);
        }}
        onSelectCamera={handleSelectCamera}
      />

      <AttributesBar
        selectedItemId={selectedItemId}
        equipment={equipment}
        onClose={() => setSelectedItemId(null)}
        onUpdateSettings={(id, field, value) => updatePlacement(id, () => ({ [field]: value }))}
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

  useEffect(() => {
    if (imageSrcFromState) {
      setLoading(false);
      return;
    }

    if (!projectId) {
      navigate('/app/upload');
      return;
    }

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

  if (loading) return <p>Loading floor layouts...</p>;

  const currentImageSrc = imageSrcFromState
    ? imageSrcFromState
    : floorLayouts.length > 0
      ? `http://localhost:5113/api/floorlayouts/image/${floorLayouts[selectedLayer]?.floorID}`
      : null;

  if (!currentImageSrc) return <p>No floor layouts found for this project.</p>;

  const currentFloorId = floorLayouts.length > 0 ? floorLayouts[selectedLayer]?.floorID : null;
  const handleBackButton = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Do you want to leave without saving?');
      if (confirm) navigate('/app/projects');
    } else {
      navigate('/app/projects');
    }
  };

  return (
    <div className="design-page-container">
      <div className="design-topbar">
        <button onClick={handleBackButton} className="back-button">
          &larr; Back to Project List
        </button>
      </div>

      <Workspace
        imageSrc={currentImageSrc}
        floorId={currentFloorId}
        onUnsavedChanges={setHasUnsavedChanges}
      />

      {floorLayouts.length > 1 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '10px 20px',
            borderRadius: '30px',
            zIndex: 1000,
          }}
        >
          {floorLayouts.map((layout, index) => (
            <button
              key={layout.floorID}
              onClick={() => setSelectedLayer(index)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedLayer === index ? '#007bff' : '#fff',
                color: selectedLayer === index ? '#fff' : '#000',
                fontWeight: selectedLayer === index ? 'bold' : 'normal',
              }}
            >
              Layer {layout.layer}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignPage;