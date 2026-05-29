import api from '../services/api';

// Picks only defined keys from `source` into a fresh object. Used to keep the
// SettingsJson blob compact and to avoid persisting `undefined`s as `null`s.
const pickDefined = (source) => {
  const out = {};
  for (const [k, v] of Object.entries(source)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
};

// Build the JSON blob holding everything the design UI can edit per placement
// that does not have a dedicated column on the backend. Loader in DesignPage
// reverses this.
const buildSettingsJson = (item) => {
  const attrs = item.attributes ?? {};
  const isCamera = item.type === 'camera';

  const settings = pickDefined({
    name: item.name,
    customIcon: item.customIcon,
    iconBackgroundColor: item.iconBackgroundColor,
    ...(isCamera
      ? {
          focalLength: item.focalLength,
          height: item.height,
          tilt: item.tilt,
          irRange: item.irRange,
          notes: item.notes,
          fovColor: item.fovColor,
          fovOpacity: item.fovOpacity,
        }
      : {
          deviceSpecifications: attrs.deviceSpecifications,
        }),
  });

  return Object.keys(settings).length > 0 ? JSON.stringify(settings) : null;
};

const toPlacementPayload = (item, floorId) => {
  const attrs = item.attributes ?? {};
  const isCatalogItem =
    attrs.cameraId != null || attrs.networkingId != null || attrs.accessControlId != null;

  // Subtype carries the camera type (Bullet/Dome/PTZ/…) for cameras or the
  // original-cased device subtype (Router/Switch/…) for devices. For catalog
  // items we leave it empty since the FK lookup recovers the real type.
  const subtype = isCatalogItem
    ? ''
    : item.type === 'camera'
      ? attrs.cameraType ?? ''
      : item.type ?? '';

  const costPerUnit =
    typeof attrs.costPerUnit === 'number' && Number.isFinite(attrs.costPerUnit)
      ? attrs.costPerUnit
      : null;

  return {
    floorID: floorId,
    cameraId: attrs.cameraId ?? null,
    networkingId: attrs.networkingId ?? null,
    accessControlId: attrs.accessControlId ?? null,
    x: item.x,
    y: item.y,
    rotation: item.rotation || 0,
    type: item.type || 'camera',
    cameraModel: attrs.cameraModel ?? '',
    brand: attrs.brand ?? '',
    resolution: attrs.resolution ?? '',
    modelName: attrs.modelName ?? '',
    subtype,
    costPerUnit,
    settingsJson: buildSettingsJson(item),
  };
};

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

const toObstaclePayload = (obstacle, floorId) => ({
  floorID: floorId,
  label: obstacle.label,
  x: obstacle.x,
  y: obstacle.y,
  width: obstacle.width,
  height: obstacle.height,
  rotation: obstacle.rotation ?? 0,
  color: obstacle.color ?? '#FF0000',
});

export const saveDesign = async ({ floorId, equipment, walls, obstacles = [] }) => {
  await api.post(
    `/api/camerplacements/save/${floorId}`,
    equipment.map((item) => toPlacementPayload(item, floorId))
  );

  await api.post(
    `/api/walls/save/${floorId}`,
    walls.map((wall) => toWallPayload(wall, floorId))
  );

  await api.post(
    `/api/obstacles/save/${floorId}`,
    obstacles.map((obstacle) => toObstaclePayload(obstacle, floorId))
  );
};

export const getSaveErrorMessage = (err) => {
  const apiMessage = err?.response?.data;
  return typeof apiMessage === 'string'
    ? apiMessage
    : apiMessage?.message || err?.message || 'Failed to save';
};
