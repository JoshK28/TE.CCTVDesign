import api from '../services/api';

const toPlacementPayload = (item, floorId) => ({
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
  resolution: item.attributes?.resolution ?? '',
});

const toWallPayload = (wall, floorId) => ({
  floorID: floorId,
  x1: wall.x1,
  y1: wall.y1,
  x2: wall.x2,
  y2: wall.y2,
  length: wall.length ?? Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1),
  realWorldLength: wall.realWorldLength ?? 0,
  realWorldHeight: wall.realWorldHeight ?? 0,
});

export const saveDesign = async ({ floorId, equipment, walls }) => {
  await api.post(
    `/api/camerplacements/save/${floorId}`,
    equipment.map((item) => toPlacementPayload(item, floorId))
  );

  await api.post(
    `/api/walls/save/${floorId}`,
    walls.map((wall) => toWallPayload(wall, floorId))
  );
};

export const getSaveErrorMessage = (err) => {
  const apiMessage = err?.response?.data;
  return typeof apiMessage === 'string'
    ? apiMessage
    : apiMessage?.message || err?.message || 'Failed to save';
};
