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

const DEFAULT_EQUIPMENT_SETTINGS = {
  name: '',
  rotation: 0,
  attributes: {},
};

const DEFAULT_CAMERA_SETTINGS = {
  ...DEFAULT_EQUIPMENT_SETTINGS,
  name: '',
  focalLength: 2.8,
  height: 3,
  tilt: 0,
  resolution: '1080p',
  irRange: 30,
  notes: '',
  fovOpacity: 0.3,
  fovColor: 'rgba(0, 150, 255, 0.3)',
};

const createDevice = (tool, x, y, id = Date.now(), rotation = 0) => ({
  id,
  type: tool,
  x,
  y,
  ...(tool === 'camera' ? DEFAULT_CAMERA_SETTINGS : DEFAULT_EQUIPMENT_SETTINGS),
  rotation,
});

function Workspace({ imageSrc, floorId, scale, onUnsavedChanges = () => {} }) {
  const [activeTool, setActiveTool] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [wallGraphs, setWallGraphs] = useState({});
  const [saving, setSaving] = useState(false);

  const toastRef = useRef(null);

  // -----------------------------
  // UNDO / REDO STACKS
  // -----------------------------
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  const snapshot = useCallback(() => ({
    equipment: JSON.parse(JSON.stringify(equipment)),
    wallGraphs: JSON.parse(JSON.stringify(wallGraphs)),
  }), [equipment, wallGraphs]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];

    setHistory(history.slice(0, -1));
    setFuture(f => [snapshot(), ...f]);

    setEquipment(prev.equipment);
    setWallGraphs(prev.wallGraphs);
  }, [history, snapshot]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];

    setFuture(future.slice(1));
    setHistory(h => [...h, snapshot()]);

    setEquipment(next.equipment);
    setWallGraphs(next.wallGraphs);
  }, [future, snapshot]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeys = (e) => {
      if (e.ctrlKey && e.key === 'z') undo();
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) redo();
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [undo, redo]);

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
          const device = createDevice(
            p.type || p.kind || 'camera',
            p.x,
            p.y,
            p.placementID ?? Date.now(),
            p.rotation ?? 0
          );
          // restore device attributes from database
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
          id: w.wallID,
          x1: w.x1,
          y1: w.y1,
          x2: w.x2,
          y2: w.y2,
          length: w.length,
          realWorldLength: w.realWorldLength,
          realWorldHeight: w.realWorldHeight
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
  // ESC / ENTER CANCEL TOOL
  // -----------------------------
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

  // -----------------------------
  // UPDATE PLACEMENT (with history)
  // -----------------------------
  const updatePlacement = (id, patchOrBuilder) => {
    setHistory(prev => [...prev, snapshot()]);
    setFuture([]);

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
  // NEW ITEM PLACEMENT
  // -----------------------------
  const handleNewItem = (event) => {
    event.preventDefault();

    const toolToPlace = event.dataTransfer
      ? event.dataTransfer.getData('tool')
      : activeTool;

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

  const handleConfirmPlacement = ({ camera, displayName, equipmentType, manufacturer, modelName, costPerUnit } = {}) => {
    if (!pendingPlacement) return;

    setHistory(prev => [...prev, snapshot()]);
    setFuture([]);
    const { x, y, type, replaceItemId } = pendingPlacement;

    if (replaceItemId != null) {
      if (type === 'camera' && camera) {
        updatePlacement(replaceItemId, (item) => ({
          ...item,
          name: camera.modelNumber ?? item.name,
          resolution: camera.resolution ?? item.resolution,
          attributes: {
            ...(item.attributes ?? {}),
            cameraId: camera.id,
            cameraModel: camera.modelNumber,
            brand: camera.brand,
            resolution: camera.resolution,
            cameraType: camera.type,
          },
        }));
        setSelectedItemId(replaceItemId);
      }
      return;
    }

    const resolvedType = type === 'device' && equipmentType ? equipmentType : type;
    const base = createDevice(resolvedType, x, y);
    let newObject = displayName ? { ...base, name: displayName } : base;

    if (type === 'device') {
      const normalizedManufacturer = manufacturer?.trim();
      const normalizedModelName = modelName?.trim();

      newObject = {
        ...newObject,
        name: normalizedModelName || newObject.name,
        attributes: {
          ...(newObject.attributes ?? {}),
          ...(normalizedManufacturer ? { brand: normalizedManufacturer } : {}),
          ...(normalizedModelName ? { modelName: normalizedModelName } : {}),
          ...(typeof costPerUnit === 'number' ? { costPerUnit } : {}),
        },
      };
    }

    if (type === 'camera' && camera) {
      newObject = {
        ...newObject,
        name: camera.modelNumber ?? newObject.name,
        resolution: camera.resolution ?? newObject.resolution,
        attributes: {
          ...(newObject.attributes ?? {}),
          cameraId: camera.id,
          cameraModel: camera.modelNumber,
          brand: camera.brand,
          resolution: camera.resolution,
          cameraType: camera.type,
        },
      };
    }

    setEquipment((prev) => [...prev, newObject]);
    setSelectedItemId(newObject.id);
    onUnsavedChanges(true);
  };

  // -----------------------------
  // CHANGE CAMERA MODEL
  // -----------------------------
  const handleChangeCameraModel = (item) => {
    if (!item || item.type !== 'camera') return;
    setPendingPlacement({ x: item.x, y: item.y, type: 'camera', replaceItemId: item.id });
    setSelectedItemId(null);
  };

  // -----------------------------
  // DELETE EQUIPMENT
  // -----------------------------
  const handleDeleteEquipment = (id) => {
    setHistory(prev => [...prev, snapshot()]);
    setFuture([]);

    setEquipment((prev) => prev.filter((item) => item.id !== id));
    setSelectedItemId(null);
    onUnsavedChanges(true);
  };

  // -----------------------------
  // WALL GRAPH CHANGE
  // -----------------------------
  const handleWallGraphChange = (updater) => {
    if (!floorId || typeof updater !== 'function') return;

    setHistory(prev => [...prev, snapshot()]);
    setFuture([]);

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
        type: item.type || item.kind || 'camera',
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
  // RENDER
  // -----------------------------
  return (
    <div className="design-workspace">
      <Toast ref={toastRef} position="top-right" />

      <div className="toolbar-sidebar">
        <Toolbar
          onSelectTool={setActiveTool}
          onUndo={undo}
          onRedo={redo}
          canUndo={history.length > 0}
          canRedo={future.length > 0}
        />
      </div>

      <div
        className="image-fullscreen-wrapper"
        onClick={() => {
          setSelectedItemId(null);
          closeSelector();
        }}
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
          scale={scale}
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
        visible={pendingPlacement != null}
        placementType={pendingPlacement?.type ?? null}
        onHide={closeSelector}
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

  return (
    <div className="design-page-container">
      <div className="design-topbar">
        <button onClick={handleBackButton} className="back-button">
          &larr; Back to Project List
        </button>
        <button
          onClick={() => {
            if (hasUnsavedChanges) {
              const confirm = window.confirm('You have unsaved changes. Please save before viewing the Bill of Materials.');
              if (!confirm) return;
            }
            navigate('/app/bom', { state: { projectId } });
          }}
          style={{padding: '8px 20px',
            backgroundColor: '#245d91',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'}}
        >
          📦 Bill of Materials
        </button>
        <button
          onClick={() => navigate('/app/calculator', { state: { projectId } })}
          style={{
            padding: '8px 20px',
            backgroundColor: '#245d91',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          💾 Storage
        </button>

        <button
          onClick={() => navigate('/app/ups', { state: { projectId } })}
          style={{
            padding: '8px 20px',
            backgroundColor: '#245d91',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔋 UPS
        </button>
      </div>

            <Workspace
        imageSrc={currentImageSrc}
        floorId={currentFloorId}
        scale={currentScale}
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
            <Button
              key={layout.floorID}
              type="button"
              label={`Layer ${layout.layer}`}
              onClick={() => setSelectedLayer(index)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: selectedLayer === index ? '#007bff' : '#fff',
                color: selectedLayer === index ? '#fff' : '#000',
                fontWeight: selectedLayer === index ? 'bold' : 'normal',
                border: 'none',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignPage;