export const DEFAULT_ICON_BACKGROUND_COLOR = '#ffffff';

export const CAMERA_DEFAULTS = {
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

export const FOV_PRESET_COLORS = [
  CAMERA_DEFAULTS.fovColor,
  '#ff0000',
  '#00ff00',
  '#ffa500',
  '#800080',
  '#ffff00',
];

const pickDefined = (source) =>
  Object.fromEntries(Object.entries(source).filter(([, v]) => v !== undefined));

export const createCamera = ({ x, y, name = '', attributes = {}, rotation = 0, id = Date.now() }) => ({
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

export const createDevice = ({ x, y, type, name = '', attributes = {}, id = Date.now() }) => ({
  id,
  type,
  x,
  y,
  name: name || attributes.modelName || '',
  iconBackgroundColor: DEFAULT_ICON_BACKGROUND_COLOR,
  attributes,
});

export const placementFromApi = (p) => {
  const type = p.type || 'camera';
  const subtype = p.subtype ?? '';
  let settings = {};
  if (p.settingsJson) {
    try {
      settings = JSON.parse(p.settingsJson) ?? {};
    } catch (err) {
      console.warn('Failed to parse settingsJson for placement', p.placementID, err);
    }
  }

  const attributes = {
    cameraId: p.cameraId ?? 0,
    brand: p.brand ?? '',
    resolution: p.resolution ?? '',
    ...(p.cameraModel ? { cameraModel: p.cameraModel } : {}),
    ...(p.modelName ? { modelName: p.modelName } : {}),
    ...(type === 'camera' && subtype ? { cameraType: subtype } : {}),
    ...(p.costPerUnit != null ? { costPerUnit: p.costPerUnit } : {}),
    ...(settings.deviceSpecifications ? { deviceSpecifications: settings.deviceSpecifications } : {}),
    ...(p.networkingId != null ? { networkingId: p.networkingId } : {}),
    ...(p.accessControlId != null ? { accessControlId: p.accessControlId } : {}),
  };

  const args = {
    x: p.x,
    y: p.y,
    id: p.placementID ?? Date.now(),
    rotation: p.rotation ?? 0,
    name: p.cameraModel || p.modelName || '',
    attributes,
  };

  const base = type === 'camera' ? createCamera(args) : createDevice({ ...args, type });
  const { deviceSpecifications: _ignored, ...overrides } = settings;
  return { ...base, ...overrides };
};

export const buildSettingsJson = (item) => {
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
      : { deviceSpecifications: attrs.deviceSpecifications }),
  });
  return Object.keys(settings).length > 0 ? JSON.stringify(settings) : null;
};

export const toPlacementPayload = (item, floorId) => {
  const attrs = item.attributes ?? {};
  const isCatalogItem =
    attrs.cameraId != null || attrs.networkingId != null || attrs.accessControlId != null;
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
