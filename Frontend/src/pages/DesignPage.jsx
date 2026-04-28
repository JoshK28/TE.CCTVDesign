import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toolbar, Equipment, EquipmentSelector, AttributesBar, WallDrawingLayer } from '../Components/index';
import api from '../services/api';
import { calculateFovPolygon } from '../utils/fov';

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

const updateItemById = (items, id, patch) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

const updateItemAttributesById = (items, id, attributesPatch) =>
  items.map((item) =>
    item.id === id
      ? { ...item, attributes: { ...(item.attributes ?? {}), ...attributesPatch } }
      : item
  );

const createDevice = (tool, x, y, id = Date.now()) => ({
  id,
  kind: tool,
  type: tool,
  x,
  y,
  ...DEFAULT_CAMERA_SETTINGS,
});

function Workspace({ imageSrc, floorId, onUnsavedChanges = () => {} }) {
  const [activeTool, setActiveTool] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [walls, setWalls] = useState({});
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [displaySelector, setDisplaySelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const currentWalls = floorId ? (walls[floorId] ?? []) : [];


  useEffect(() => {
    if (!floorId) return;

    const fetchPlacements = async () => {
      try {
        const res = await api.get(`/api/camerplacements/${floorId}`);
        const loaded = (res.data ?? []).map((p) =>
          createDevice(p.type || 'camera', p.x, p.y, p.placementID ?? Date.now())
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
      if (event.key === 'Escape' || event.key === 'Enter') {
        setActiveTool(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool]);

  const updatePlacement = (id, patch) => {
    setEquipment((prev) => updateItemById(prev, id, patch));
    onUnsavedChanges(true);
  };

  const updatePlacementAttributes = (id, attributesPatch) => {
    setEquipment((prev) => updateItemAttributesById(prev, id, attributesPatch));
    onUnsavedChanges(true);
  };

  const handleAddWall = (wall) => {
    if (!floorId) return;
    setWalls((prev) => ({
      ...prev,
      [floorId]: [...(prev[floorId] ?? []), wall],
    }));
    onUnsavedChanges(true);
  };

  const selectedItem = equipment.find((item) => item.id === selectedItemId);

  const handleNewItem = (event) => {
    event.preventDefault();

    const toolToPlace = event.dataTransfer ? event.dataTransfer.getData('tool') : activeTool;
    if (toolToPlace === 'wall') return;
    if (!toolToPlace) {
      setSelectedItemId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

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

    updatePlacement(targetId, {
      name: camera.modelNumber ?? '',
      resolution: camera.resolution ?? '1080p',
    });

    updatePlacementAttributes(targetId, {
      cameraId: camera.id,
      cameraModel: camera.modelNumber,
      brand: camera.brand,
      resolution: camera.resolution,
      cameraType: camera.type,
    });
  };

  const handleUpdateSettings = (id, field, value) => {
    updatePlacement(id, { [field]: value });
  };

  const handleSave = async () => {
    if (!floorId) {
      setSaveMessage('No floor layout selected');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const placements = equipment.map((item) => ({
        floorID: floorId,
        cameraId: item.attributes?.cameraId ?? 0,
        x: item.x,
        y: item.y,
        rotation: item.rotation || 0,
        type: item.type || item.kind || 'camera',
      }));

      await api.post(`/api/camerplacements/save/${floorId}`, placements);
      setSaveMessage('Saved successfully!');
      onUnsavedChanges(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      const apiMessage = err?.response?.data;
      const errorText =
        typeof apiMessage === 'string'
          ? apiMessage
          : apiMessage?.message || err?.message || 'Failed to save';
      setSaveMessage(errorText);
      console.error('Failed to save placements', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="design-workspace">
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
            .filter((item) => (item.kind ?? item.type) === 'camera')
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

        <WallDrawingLayer activeTool={activeTool} walls={currentWalls} onAddWall={handleAddWall} />
        <p className="item-count">Items Placed: {equipment.length}</p>

        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '5px',
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
          {saveMessage && (
            <p
              style={{
                backgroundColor: saveMessage.includes('Failed')
                  ? 'rgba(255,0,0,0.7)'
                  : 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '13px',
                margin: 0,
              }}
            >
              {saveMessage}
            </p>
          )}
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
        selectedItemId={selectedItem?.id}
        equipment={equipment}
        onClose={() => setSelectedItemId(null)}
        onUpdateSettings={handleUpdateSettings}
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