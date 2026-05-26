import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

import {
    Toolbar,
    Equipment,
    EquipmentSelector,
    AttributesBar,
    WallDrawingLayer,
    WallOverlay,
    ObstacleDrawingLayer,
    ObstacleOverlay,
} from '../Components/index';

import ScaleCalibrationModal from '../Components/ScaleCalibrationModal';
import ExportModal from '../Components/ExportModal';

import api from '../services/api';
import { getSaveErrorMessage, saveDesign } from '../utils/designSave';
import { calculateFovPolygon } from '../utils/fov';
import { getImagePoint } from '../utils/points';
import { empty_Walls, segmentsToWallGraph, wallToSegments } from '../utils/wallsConverter';
import useUndoRedo from '../hooks/useUndoRedo';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import '../page_styling/designPage.css';

// ppm converter (for measure + scale calibration)
const scaleToPpm = (scaleString) => {
    if (!scaleString || !scaleString.includes(':')) return null;
    const ppm = parseFloat(scaleString.split(':')[1]);
    return Number.isFinite(ppm) ? ppm : null;
};

const DEFAULT_ICON_BACKGROUND_COLOR = '#ffffff';

const CAMERA_DEFAULTS = {
    focalLength: 2.8,
    height: 3,
    tilt: 0,
    resolution: '1080p',
    irRange: 30,
    notes: '',
    fovColor: '#0096ff',
    fovOpacity: 0.3,
    iconBackgroundColor: DEFAULT_ICON_BACKGROUND_COLOR,
};

// Build a fresh camera placement object with all FOV/appearance defaults.
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

// Build a fresh non-camera device placement (NVR, switch, sensor, etc.).
const createDevice = ({ x, y, type, name = '', attributes = {}, id = Date.now() }) => ({
    id,
    type,
    x,
    y,
    name: name || attributes.modelName || '',
    iconBackgroundColor: DEFAULT_ICON_BACKGROUND_COLOR,
    attributes,
});

/*
WORKSPACE
New structure from MainDesign + measure tool + scale calibration + image settings
*/
function Workspace({
    imageSrc,
    floorId,
    scale,
    ppm,
    setPPM,
    onUnsavedChanges = () => {},
    workspaceRef,
    exportOptions,
}) {
    const [activeTool, setActiveTool] = useState(null);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [pendingEquipment, setPendingEquipment] = useState(null);
    const [equipment, setEquipment] = useState([]);
    const [wallGraphs, setWallGraphs] = useState({});
    const [obstacles, setObstacles] = useState([]);
    const [saving, setSaving] = useState(false);

    const toastRef = useRef(null);
    const [imageSize, setImageSize] = useState(null);

    // IMAGE SETTINGS STATE
    const [imgScale, setImgScale] = useState(1);
    const [imgRotation, setImgRotation] = useState(0);
    const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
    const [imgFlip, setImgFlip] = useState({ x: 1, y: 1 });
    const [imageSettingsOpen, setImageSettingsOpen] = useState(false);
    const dragState = useRef({ dragging: false, startX: 0, startY: 0 });

    // MEASURE TOOL STATE
    const [measureStart, setMeasureStart] = useState(null);
    const [measureEnd, setMeasureEnd] = useState(null);
    const [measurePreview, setMeasurePreview] = useState(null);
    const [measureCursor, setMeasureCursor] = useState(null);
    const [measureEscCount, setMeasureEscCount] = useState(0);

    // SCALE CALIBRATION STATE
    const [calibrationStart, setCalibrationStart] = useState(null);
    const [calibrationEnd, setCalibrationEnd] = useState(null);
    const [calibrationDistancePx, setCalibrationDistancePx] = useState(null);
    const [showCalibrationModal, setShowCalibrationModal] = useState(false);

    useEffect(() => {
        setImageSize(null);
    }, [imageSrc]);

    const handleImageLoad = ({ currentTarget: img }) => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        setImageSize((prev) =>
            prev?.naturalWidth === img.naturalWidth && prev?.naturalHeight === img.naturalHeight
                ? prev
                : { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }
        );
    };

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
    const currentWallGraph = floorId ? wallGraphs[floorId] ?? empty_Walls : empty_Walls;
    const currentWalls = wallToSegments(currentWallGraph);

    // LOAD FLOOR DATA
    useEffect(() => {
        if (!floorId) return;

        setEquipment([]);

        const fetchPlacements = async () => {
            try {
                const res = await api.get(`/api/camerplacements/${floorId}`);
                const loaded = (res.data ?? []).map((p) => {
                    const type = p.type || 'camera';
                    const modelName = p.modelName ?? '';
                    const subtype = p.subtype ?? '';

                    let settings = {};
                    if (p.settingsJson) {
                        try {
                            settings = JSON.parse(p.settingsJson) ?? {};
                        } catch (err) {
                            console.warn(
                                'Failed to parse settingsJson for placement',
                                p.placementID,
                                err
                            );
                        }
                    }

                    const attributes = {
                        cameraId: p.cameraId ?? 0,
                        brand: p.brand ?? '',
                        resolution: p.resolution ?? '',
                        ...(p.cameraModel ? { cameraModel: p.cameraModel } : {}),
                        ...(modelName ? { modelName } : {}),
                        ...(type === 'camera' && subtype ? { cameraType: subtype } : {}),
                        ...(p.costPerUnit != null ? { costPerUnit: p.costPerUnit } : {}),
                        ...(settings.deviceSpecifications
                            ? { deviceSpecifications: settings.deviceSpecifications }
                            : {}),
                    };

                    const args = {
                        x: p.x,
                        y: p.y,
                        id: p.placementID ?? Date.now(),
                        rotation: p.rotation ?? 0,
                        name: p.cameraModel || modelName || '',
                        attributes,
                    };

                    const base =
                        type === 'camera' ? createCamera(args) : createDevice({ ...args, type });

                    const { deviceSpecifications: _ignored, ...overrides } = settings;
                    return { ...base, ...overrides };
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
                    realWorldHeight: w.realWorldHeight,
                }));

                setWallGraphs((prev) => ({
                    ...prev,
                    [floorId]: segmentsToWallGraph(loadedWalls),
                }));
            } catch (err) {
                console.error('Failed to load walls', err);
            }
        };

        const fetchObstacles = async () => {
            try {
                const res = await api.get(`/api/obstacles/floor/${floorId}`);
                const loaded = (res.data ?? []).map((o) => ({
                    ...o,
                    id: o.obstacleId,
                }));
                setObstacles(loaded);
            } catch (err) {
                console.error('Failed to load obstacles', err);
            }
        };

        fetchPlacements();
        fetchWalls();
        fetchObstacles();
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

    // TOOL ARMING
    const armTool = (tool) => {
        closeEquipmentSelector();

        // Image Settings opens panel instead of arming a drawing tool
        if (tool === 'Image Settings') {
            setImageSettingsOpen(true);
            return;
        }

        setActiveTool(tool);

        if (tool === 'measure') {
            setMeasureStart(null);
            setMeasureEnd(null);
            setMeasurePreview(null);
            setMeasureCursor(null);
            setMeasureEscCount(0);
        }

        if (tool === 'Scale Calibration') {
            setCalibrationStart(null);
            setCalibrationEnd(null);
            setCalibrationDistancePx(null);
            setMeasureCursor(null);
            setMeasureEscCount(0);
        }
    };

    // ESC / ENTER HANDLING
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Measure tool ESC/Enter
            if (activeTool === 'measure') {
                if (event.key === 'Escape') {
                    if (measureStart || measureEnd || measurePreview) {
                        setMeasureStart(null);
                        setMeasureEnd(null);
                        setMeasurePreview(null);
                        setMeasureCursor(null);
                        setMeasureEscCount(1);
                        return;
                    }

                    if (measureEscCount === 1) {
                        setMeasureEscCount(0);
                        setActiveTool(null);
                    }
                }

                if (event.key === 'Enter') {
                    if (measureStart && !measureEnd && measurePreview) {
                        setMeasureEnd(measurePreview);
                        setMeasurePreview(null);
                    }
                }

                return;
            }

            // Calibration tool ESC
            if (activeTool === 'Scale Calibration') {
                if (event.key === 'Escape') {
                    if (calibrationStart || calibrationEnd) {
                        setCalibrationStart(null);
                        setCalibrationEnd(null);
                        setCalibrationDistancePx(null);
                        setMeasureCursor(null);
                        setMeasureEscCount(1);
                        return;
                    }

                    if (measureEscCount === 1) {
                        setMeasureEscCount(0);
                        setActiveTool(null);
                    }
                }

                return;
            }

            // Other tools: cancel on ESC/Enter except wall/obstacle
            if (!activeTool) return;
            if (activeTool === 'wall') return;
            if (activeTool === 'obstacle') return;

            if (event.key === 'Escape' || event.key === 'Enter') {
                setPendingEquipment(null);
                setActiveTool(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        activeTool,
        measureStart,
        measureEnd,
        measurePreview,
        calibrationStart,
        calibrationEnd,
        measureEscCount,
    ]);

    // IMAGE DRAG (REPOSITION) – applied to floorplan-stage
    const startImageDrag = (e) => {
        if (activeTool === 'measure' || activeTool === 'Scale Calibration') return;
        dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY };
    };

    const stopImageDrag = () => {
        dragState.current.dragging = false;
    };

    const handleImageDragMove = (e) => {
        if (!dragState.current.dragging) return;

        const { startX, startY } = dragState.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        dragState.current.startX = e.clientX;
        dragState.current.startY = e.clientY;

        setImgOffset((prev) => ({
            x: prev.x + dx,
            y: prev.y + dy,
        }));
    };

    // UPDATE PLACEMENT (with history)
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

    // CANVAS INTERACTION (measure + calibration + placement)
    const handleCanvasInteraction = (event) => {
        event.stopPropagation();

        // SCALE CALIBRATION TOOL
        if (activeTool === 'Scale Calibration') {
            const { x, y } = getImagePoint(event, event.currentTarget, imageSize);

            if (!calibrationStart) {
                setCalibrationStart({ x, y });
                return;
            }

            if (!calibrationEnd) {
                const end = { x, y };
                setCalibrationEnd(end);

                const dx = end.x - calibrationStart.x;
                const dy = end.y - calibrationStart.y;
                const px = Math.hypot(dx, dy);

                setCalibrationDistancePx(px);
                setShowCalibrationModal(true);
                return;
            }

            return;
        }

        // MEASURE TOOL
        if (activeTool === 'measure') {
            const { x, y } = getImagePoint(event, event.currentTarget, imageSize);

            if (!measureStart) {
                setMeasureStart({ x, y });
                setMeasureCursor(null);
                return;
            }

            if (!measureEnd) {
                setMeasureEnd({ x, y });
                setMeasurePreview(null);
                return;
            }

            return;
        }

        // Equipment placement (MainDesign behaviour)
        const droppedTool = event.dataTransfer ? event.dataTransfer.getData('tool') : '';
        const toolToPlace = droppedTool || activeTool;

        if (toolToPlace && toolToPlace !== 'wall' && toolToPlace !== 'obstacle') {
            const { x, y } = getImagePoint(event, event.currentTarget, imageSize);
            openEquipmentSelector({ x, y, type: toolToPlace });
            return;
        }

        setSelectedItemId(null);
        closeEquipmentSelector();
    };

    // LIVE PREVIEW MOVEMENT (measure + calibration)
    const handlePointerMove = (e) => {
        if (!imageSize) return;

        if (activeTool === 'measure') {
            const pt = getImagePoint(e, e.currentTarget, imageSize);

            if (!measureStart) {
                setMeasureCursor(pt);
            }

            if (measureStart && !measureEnd) {
                setMeasurePreview(pt);
            }
        }

        if (activeTool === 'Scale Calibration') {
            const pt = getImagePoint(e, e.currentTarget, imageSize);
            setMeasureCursor(pt);
        }
    };

    // RIGHT CLICK DISABLED for measure/calibration
    const handleContextMenu = (e) => {
        if (activeTool === 'measure' || activeTool === 'Scale Calibration') {
            e.preventDefault();
        }
    };

    // CONFIRM PLACEMENT
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

    // CHANGE EQUIPMENT MODEL
    const handleChangeModel = (item) => {
        if (!item) return;

        const selectorType = item.type === 'camera' ? 'camera' : 'device';

        openEquipmentSelector({
            x: item.x,
            y: item.y,
            type: selectorType,
            replaceItemId: item.id,
        });
    };

    // DELETE EQUIPMENT
    const handleDeleteEquipment = (id) => {
        commit();

        setEquipment((prev) => prev.filter((item) => item.id !== id));
        setSelectedItemId(null);
        onUnsavedChanges(true);
    };

    // WALL GRAPH CHANGE
    const handleWallGraphChange = (updater) => {
        if (!floorId || typeof updater !== 'function') return;

        commit();

        setWallGraphs((prev) => ({
            ...prev,
            [floorId]: updater(prev[floorId] ?? empty_Walls),
        }));

        onUnsavedChanges(true);
    };

    // SAVE (placements + walls + obstacles)
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
            await saveDesign({ floorId, equipment, walls: currentWalls });

            toastRef.current?.show({
                severity: 'success',
                detail: 'Placements and walls saved successfully.',
            });

            onUnsavedChanges(false);
        } catch (err) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Save failed',
                detail: getSaveErrorMessage(err),
            });
            console.error('Failed to save', err);
        } finally {
            setSaving(false);
        }

        const obstaclesToSave = obstacles.map((o) => ({
            floorID: floorId,
            label: o.label,
            x: o.x,
            y: o.y,
            width: o.width,
            height: o.height,
            rotation: o.rotation ?? 0,
            color: o.color ?? '#FF0000',
        }));

        await api.post(`/api/obstacles/save/${floorId}`, obstaclesToSave);
    };

    const showFov = exportOptions ? exportOptions.showFov !== false : true;
    const showWalls = showFov;
    const branding = exportOptions?.brandingActive && exportOptions?.brandingData;

    const overlayViewBox = imageSize
        ? `0 0 ${imageSize.naturalWidth} ${imageSize.naturalHeight}`
        : undefined;

    // SCALE CALIBRATION APPLY
    const handleApplyCalibration = (newPPM) => {
        if (typeof setPPM === 'function') {
            setPPM(newPPM);
        }

        if (typeof onUnsavedChanges === 'function') {
            onUnsavedChanges(true);
        }

        setShowCalibrationModal(false);
        setActiveTool(null);
        setCalibrationStart(null);
        setCalibrationEnd(null);
        setCalibrationDistancePx(null);
        setMeasureCursor(null);
        setMeasureEscCount(0);
    };

    // RENDER
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
                    onClick={handleCanvasInteraction}
                    onDrop={(event) => {
                        event.preventDefault();
                        handleCanvasInteraction(event);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onMouseDown={startImageDrag}
                    onMouseMove={handleImageDragMove}
                    onMouseUp={stopImageDrag}
                    onPointerMove={handlePointerMove}
                    onContextMenu={handleContextMenu}
                    style={{
                        transform: `
                            translate(${imgOffset.x}px, ${imgOffset.y}px)
                            scale(${imgScale * imgFlip.x}, ${imgScale * imgFlip.y})
                            rotate(${imgRotation}deg)
                        `,
                        transformOrigin: 'center center',
                    }}
                >
                    <img
                        src={imageSrc}
                        alt="Full-screen design layout"
                        className="fullscreen-image"
                        draggable="false"
                        crossOrigin="anonymous"
                        onLoad={handleImageLoad}
                    />

                    {branding && (
                        <div className="floating-branding">
                            {branding.logo && (
                                <img
                                    src={branding.logo}
                                    alt="Logo"
                                    className="floating-branding__logo"
                                />
                            )}
                            <div>
                                <h4 className="floating-branding__title">
                                    {branding.projectTitle || 'Specification Layout'}
                                </h4>
                                <p className="floating-branding__company">
                                    {branding.companyName}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* MEASURE TOOL — HOVER DOT BEFORE FIRST CLICK */}
                    {activeTool === 'measure' && !measureStart && measureCursor && (
                        <svg
                            className="measure-overlay"
                            viewBox={overlayViewBox}
                            preserveAspectRatio="none"
                        >
                            <circle
                                cx={measureCursor.x}
                                cy={measureCursor.y}
                                className="measure-point-start"
                            />
                        </svg>
                    )}

                    {showFov && (
                        <svg
                            className="fov-overlay"
                            viewBox={overlayViewBox}
                            preserveAspectRatio="none"
                        >
                            {equipment
                                .filter((item) => item.type === 'camera')
                                .map((item) => (
                                    <polygon
                                        key={item.id}
                                        points={calculateFovPolygon(
                                            item,
                                            currentWalls,
                                            {},
                                            obstacles
                                        )}
                                        fill={item.fovColor ?? '#0096ff'}
                                        stroke={item.fovColor ?? '#0096ff'}
                                        fillOpacity={item.fovOpacity ?? 0.3}
                                        strokeOpacity={item.fovOpacity ?? 0.3}
                                        strokeWidth="2"
                                    />
                                ))}
                        </svg>
                    )}

                    {/* SCALE CALIBRATION HOVER HANDLE */}
                    {activeTool === 'Scale Calibration' &&
                        !calibrationStart &&
                        measureCursor && (
                            <svg
                                className="scale-overlay"
                                viewBox={overlayViewBox}
                                preserveAspectRatio="none"
                            >
                                <circle
                                    cx={measureCursor.x}
                                    cy={measureCursor.y}
                                    r="8"
                                    className="scale-handle"
                                />
                            </svg>
                        )}

                    {/* SCALE CALIBRATION PREVIEW */}
                    {activeTool === 'Scale Calibration' &&
                        calibrationStart &&
                        !calibrationEnd &&
                        measureCursor && (
                            <svg
                                className="scale-overlay"
                                viewBox={overlayViewBox}
                                preserveAspectRatio="none"
                            >
                                <line
                                    x1={calibrationStart.x}
                                    y1={calibrationStart.y}
                                    x2={measureCursor.x}
                                    y2={measureCursor.y}
                                    className="scale-line"
                                />
                                <circle
                                    cx={calibrationStart.x}
                                    cy={calibrationStart.y}
                                    r="8"
                                    className="scale-handle"
                                />
                                <circle
                                    cx={measureCursor.x}
                                    cy={measureCursor.y}
                                    r="8"
                                    className="scale-handle"
                                />
                            </svg>
                        )}

                    {/* SCALE CALIBRATION FINAL LINE */}
                    {activeTool === 'Scale Calibration' &&
                        calibrationStart &&
                        calibrationEnd && (
                            <svg
                                className="scale-overlay"
                                viewBox={overlayViewBox}
                                preserveAspectRatio="none"
                            >
                                <line
                                    x1={calibrationStart.x}
                                    y1={calibrationStart.y}
                                    x2={calibrationEnd.x}
                                    y2={calibrationEnd.y}
                                    className="scale-line"
                                />
                                <circle
                                    cx={calibrationStart.x}
                                    cy={calibrationStart.y}
                                    r="8"
                                    className="scale-handle"
                                />
                                <circle
                                    cx={calibrationEnd.x}
                                    cy={calibrationEnd.y}
                                    r="8"
                                    className="scale-handle"
                                />
                            </svg>
                        )}

                    {/* MEASURE TOOL — FINAL MEASUREMENT */}
                    {measureStart && measureEnd && (
                        <svg
                            className="measure-overlay"
                            viewBox={overlayViewBox}
                            preserveAspectRatio="none"
                        >
                            <circle
                                cx={measureStart.x}
                                cy={measureStart.y}
                                className="measure-point-start"
                            />
                            <circle
                                cx={measureEnd.x}
                                cy={measureEnd.y}
                                className="measure-point-end"
                            />
                            <line
                                x1={measureStart.x}
                                y1={measureStart.y}
                                x2={measureEnd.x}
                                y2={measureEnd.y}
                                className="measure-line"
                            />
                            {(() => {
                                const midX = (measureStart.x + measureEnd.x) / 2;
                                const midY = (measureStart.y + measureEnd.y) / 2;

                                const distMeters =
                                    ppm && ppm > 0
                                        ? (
                                              Math.hypot(
                                                  measureEnd.x - measureStart.x,
                                                  measureEnd.y - measureStart.y
                                              ) / ppm
                                          ).toFixed(2)
                                        : null;

                                return (
                                    <>
                                        <rect
                                            x={midX - 30}
                                            y={midY - 14}
                                            width="60"
                                            height="28"
                                            className="measure-label-bg"
                                        />
                                        <text
                                            x={midX}
                                            y={midY}
                                            className="measure-label-text"
                                        >
                                            {distMeters != null ? `${distMeters} m` : 'N/A'}
                                        </text>
                                    </>
                                );
                            })()}
                        </svg>
                    )}

                    {/* MEASURE TOOL — LIVE PREVIEW */}
                    {measureStart && !measureEnd && measurePreview && (
                        <svg
                            className="measure-overlay"
                            viewBox={overlayViewBox}
                            preserveAspectRatio="none"
                        >
                            <circle
                                cx={measureStart.x}
                                cy={measureStart.y}
                                className="measure-point-start"
                            />
                            <line
                                x1={measureStart.x}
                                y1={measureStart.y}
                                x2={measurePreview.x}
                                y2={measurePreview.y}
                                className="measure-line measure-line--preview"
                            />
                            {(() => {
                                const midX = (measureStart.x + measurePreview.x) / 2;
                                const midY = (measureStart.y + measurePreview.y) / 2;

                                const distMeters =
                                    ppm && ppm > 0
                                        ? (
                                              Math.hypot(
                                                  measurePreview.x - measureStart.x,
                                                  measurePreview.y - measureStart.y
                                              ) / ppm
                                          ).toFixed(2)
                                        : null;

                                return (
                                    <>
                                        <rect
                                            x={midX - 30}
                                            y={midY - 14}
                                            width="60"
                                            height="28"
                                            className="measure-label-bg"
                                        />
                                        <text
                                            x={midX}
                                            y={midY}
                                            className="measure-label-text"
                                        >
                                            {distMeters != null ? `${distMeters} m` : 'N/A'}
                                        </text>
                                    </>
                                );
                            })()}
                        </svg>
                    )}

                    {/* WALLS + OBSTACLES + EQUIPMENT */}
                    {showWalls && activeTool !== 'wall' && (
                        <WallOverlay
                            wallGraph={currentWallGraph}
                            scale={scale}
                            imageSize={imageSize}
                        />
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

                    {activeTool !== 'obstacle' && (
                        <ObstacleOverlay obstacles={obstacles} imageSize={imageSize} />
                    )}

                    {activeTool === 'obstacle' && (
                        <ObstacleDrawingLayer
                            obstacles={obstacles}
                            imageSize={imageSize}
                            onObstaclesChange={(updater) => {
                                setObstacles((prev) =>
                                    typeof updater === 'function' ? updater(prev) : updater
                                );
                                onUnsavedChanges(true);
                            }}
                            onExitObstacleMode={() => armTool(null)}
                        />
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

            {/* EQUIPMENT SELECTOR */}
            <EquipmentSelector
                visible={pendingEquipment != null}
                placementType={pendingEquipment?.type ?? null}
                onHide={closeEquipmentSelector}
                onConfirmSelection={handleConfirmPlacement}
            />

            {/* ATTRIBUTES BAR */}
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

            {/* SCALE CALIBRATION MODAL */}
            <ScaleCalibrationModal
                visible={showCalibrationModal}
                pixelDistance={calibrationDistancePx || 0}
                onApply={handleApplyCalibration}
                onCancel={() => {
                    setShowCalibrationModal(false);
                    setCalibrationStart(null);
                    setCalibrationEnd(null);
                    setCalibrationDistancePx(null);
                    setMeasureCursor(null);
                    setMeasureEscCount(0);
                    setActiveTool(null);
                }}
            />

            {/* IMAGE SETTINGS DIALOG */}
            <Dialog
                header="Image Settings"
                visible={imageSettingsOpen}
                onHide={() => setImageSettingsOpen(false)}
                style={{ width: '360px' }}
            >
                <div className="image-settings-panel">
                    <h4>Resize</h4>
                    <div className="image-settings-row">
                        <button
                            type="button"
                            onClick={() => setImgScale((s) => s + 0.1)}
                        >
                            Zoom In
                        </button>
                        <button
                            type="button"
                            onClick={() => setImgScale((s) => Math.max(0.1, s - 0.1))}
                        >
                            Zoom Out
                        </button>
                        <button
                            type="button"
                            onClick={() => setImgScale(1)}
                        >
                            Reset Zoom
                        </button>
                    </div>

                    <h4>Rotate</h4>
                    <div className="image-settings-row">
                        <button
                            type="button"
                            onClick={() => setImgRotation((r) => r - 90)}
                        >
                            Rotate Left
                        </button>
                        <button
                            type="button"
                            onClick={() => setImgRotation((r) => r + 90)}
                        >
                            Rotate Right
                        </button>
                    </div>

                    <h4>Flip</h4>
                    <div className="image-settings-row">
                        <button
                            type="button"
                            onClick={() =>
                                setImgFlip((f) => ({ ...f, x: f.x * -1 }))
                            }
                        >
                            Flip Horizontal
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setImgFlip((f) => ({ ...f, y: f.y * -1 }))
                            }
                        >
                            Flip Vertical
                        </button>
                    </div>

                    <h4>Reposition</h4>
                    <div className="image-settings-row image-settings-row--grid">
                        <button
                            type="button"
                            onClick={() =>
                                setImgOffset((o) => ({ ...o, y: o.y - 20 }))
                            }
                        >
                            Up
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setImgOffset((o) => ({ ...o, y: o.y + 20 }))
                            }
                        >
                            Down
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setImgOffset((o) => ({ ...o, x: o.x - 20 }))
                            }
                        >
                            Left
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setImgOffset((o) => ({ ...o, x: o.x + 20 }))
                            }
                        >
                            Right
                        </button>
                    </div>

                    <h4>Reset</h4>
                    <button
                        type="button"
                        onClick={() => {
                            setImgScale(1);
                            setImgRotation(0);
                            setImgOffset({ x: 0, y: 0 });
                            setImgFlip({ x: 1, y: 1 });
                        }}
                    >
                        Reset Image
                    </button>
                </div>
            </Dialog>
        </div>
    );
}

/*
DESIGN PAGE
New structure from MainDesign + ppm for measure/calibration
*/
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
        showFov: true,
        brandingActive: false,
        brandingData: null,
    });

    const [ppm, setPPM] = useState(null);
    const workspaceRef = useRef(null);

    useEffect(() => {
        if (imageSrcFromState) {
            setLoading(false);
            return;
        }

        if (!projectId) {
            navigate('/app/projects');
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

    // Update ppm when layer changes
    useEffect(() => {
        if (floorLayouts.length > 0) {
            const currentScale = floorLayouts[selectedLayer]?.scale ?? '';
            setPPM(scaleToPpm(currentScale));
        }
    }, [floorLayouts, selectedLayer]);

    // EXPORT
    const handleExecuteExport = async (settings) => {
        setExportModalOpen(false);

        const filename = settings.branding.projectTitle.replace(/\s+/g, '_');

        const layers = settings.selectedLayerIds?.length
            ? floorLayouts.flatMap((l, i) =>
                  settings.selectedLayerIds.includes(l.floorID) ? [i] : []
              )
            : [selectedLayer];

        const original = selectedLayer;

        const captureLayer = async (idx) => {
            setSelectedLayer(idx);
            setExportWorkspaceConfig({
                showFov: settings.showFov,
                brandingActive: true,
                brandingData: settings.branding,
            });

            await new Promise((r) => setTimeout(r, 400));

            if (!workspaceRef.current) return null;

            try {
                return await html2canvas(workspaceRef.current, {
                    useCORS: true,
                    scale: 1.5,
                });
            } catch (err) {
                console.error(err);
                return null;
            }
        };

        const orientation = settings.orientation === 'portrait' ? 'p' : 'l';
        let pdf = null;

        for (const i of layers) {
            const canvas = await captureLayer(i);
            if (!canvas) continue;

            const { width, height } = canvas;

            if (!pdf) {
                pdf = new jsPDF({ orientation, unit: 'px', format: [width, height] });
            } else {
                pdf.addPage([width, height], orientation);
            }

            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
        }

        pdf?.save(`${filename}_Report.pdf`);

        setSelectedLayer(original);
        setExportWorkspaceConfig({
            showFov: true,
            brandingActive: false,
            brandingData: null,
        });
    };

    if (loading) return <p className="design-message">Loading floor layouts...</p>;

    const currentLayout = floorLayouts[selectedLayer] ?? null;

    const currentImageSrc = imageSrcFromState
        ? imageSrcFromState
        : currentLayout
        ? `http://localhost:5113/api/floorlayouts/image/${currentLayout.floorID}`
        : null;

    if (!currentImageSrc) {
        return <p className="design-message">No floor layouts found for this project.</p>;
    }

    const currentFloorId = currentLayout?.floorID ?? null;
    const currentScale = currentLayout?.scale ?? '';

    const handleBackButton = () => {
        if (
            hasUnsavedChanges &&
            !window.confirm('You have unsaved changes. Do you want to leave without saving?')
        ) {
            return;
        }

        navigate('/app/projects');
    };

    const handleBomButton = () => {
        if (
            hasUnsavedChanges &&
            !window.confirm(
                'You have unsaved changes. Please save before viewing the Bill of Materials.'
            )
        ) {
            return;
        }

        navigate('/app/bom', { state: { projectId } });
    };

    return (
        <div className="design-page-container">
            <div className="design-topbar">
                <button onClick={handleBackButton} className="design-back-btn">
                    &larr; Back to Projects
                </button>

                <button onClick={handleBomButton} className="design-nav-btn">
                    📦 BOM
                </button>

                <button
                    onClick={() =>
                        navigate('/app/calculator', { state: { projectId } })
                    }
                    className="design-nav-btn"
                >
                    💾 Storage
                </button>

                <button
                    onClick={() => navigate('/app/ups', { state: { projectId } })}
                    className="design-nav-btn"
                >
                    🔋 UPS
                </button>

                <button
                    onClick={() => setExportModalOpen(true)}
                    className="design-export-btn"
                >
                    <span>📤</span> Export Plan Layout
                </button>
            </div>

            <Workspace
                imageSrc={currentImageSrc}
                floorId={currentFloorId}
                scale={currentScale}
                ppm={ppm}
                setPPM={setPPM}
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
                            className={`design-layer-btn${
                                selectedLayer === index ? ' design-layer-btn--active' : ''
                            }`}
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