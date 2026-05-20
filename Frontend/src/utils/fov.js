const DEFAULT_MAX_DISTANCE_METERS = 60;      // fallback if no IR range on item
const DEFAULT_RAY_COUNT = 48;
const DEFAULT_FOCAL_LENGTH = 2.8;
const DEFAULT_SENSOR_TYPE = '1/2.8';
const RAY_EPSILON = 1e-6;

// Industry-standard active sensor sizes (mm)
const SENSOR_PRESETS = {
  '1/3':   { width: 4.8, height: 3.6 },
  '1/2.8': { width: 5.4, height: 3.1 },
  '1/2.7': { width: 5.0, height: 2.8 },
  '1/2':   { width: 6.4, height: 4.8 },
  '2/3':   { width: 8.8, height: 6.6 },
  '1':     { width: 12.8, height: 9.6 },
};

// ---------- Ray / wall intersection ----------

const getRayWallIntersection = (origin, direction, maxDistance, wall) => {
  const sx = wall.x2 - wall.x1;
  const sy = wall.y2 - wall.y1;
  const cross = direction.x * sy - direction.y * sx;
  if (Math.abs(cross) < RAY_EPSILON) return null;

  const dx = wall.x1 - origin.x;
  const dy = wall.y1 - origin.y;
  const t = (dx * sy - dy * sx) / cross;
  const u = (dx * direction.y - dy * direction.x) / cross;

  if (t < 0 || t > maxDistance || u < 0 || u > 1) return null;

  return {
    x: origin.x + direction.x * t,
    y: origin.y + direction.y * t,
    distance: t,
  };
};

const castRayWithWalls = (origin, angle, maxDistance, walls) => {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  let closest = {
    x: origin.x + direction.x * maxDistance,
    y: origin.y + direction.y * maxDistance,
    distance: maxDistance,
  };

  for (const wall of walls) {
    const hit = getRayWallIntersection(origin, direction, maxDistance, wall);
    if (hit && hit.distance < closest.distance) {
      closest = hit;
    }
  }

  return closest;
};

// ---------- Main FOV polygon ----------

/**
 * calculateFovPolygon
 *
 * item: {
 *   x, y, rotation,
 *   focalLength,
 *   sensorType,
 *   corridorMode,
 *   irRange
 * }
 *
 * walls: [{ x1, y1, x2, y2 }, ...]
 *
 * options: {
 *   ppm,                // pixels per metre (from ScaleCalibrator)
 *   rayCount,
 *   focalLength,
 *   sensorType,
 *   corridorMode,
 *   maxDistanceMeters
 * }
 */
export const calculateFovPolygon = (item, walls, options = {}) => {
  if (!item) return '';

  const {
    ppm = null,
    rayCount = DEFAULT_RAY_COUNT,
    focalLength: optFocalLength,
    sensorType: optSensorType,
    corridorMode: optCorridorMode,
    maxDistanceMeters: optMaxDistanceMeters,
  } = options;

  const {
    x = 0,
    y = 0,
    rotation = 0,
    focalLength: itemFocalLength,
    sensorType: itemSensorType,
    corridorMode: itemCorridorMode,
    irRange: itemIrRange,
  } = item;

  // ----- Resolve core parameters -----

  const focalLength = Number.isFinite(optFocalLength)
    ? optFocalLength
    : (Number.isFinite(itemFocalLength) ? itemFocalLength : DEFAULT_FOCAL_LENGTH);

  const sensorKey = (optSensorType || itemSensorType || DEFAULT_SENSOR_TYPE).trim();
  const sensor = SENSOR_PRESETS[sensorKey] ?? SENSOR_PRESETS[DEFAULT_SENSOR_TYPE];

  const corridorMode = typeof optCorridorMode === 'boolean'
    ? optCorridorMode
    : !!itemCorridorMode;

  const maxDistanceMeters = Number.isFinite(optMaxDistanceMeters)
    ? optMaxDistanceMeters
    : (Number.isFinite(itemIrRange) ? itemIrRange : DEFAULT_MAX_DISTANCE_METERS);

  // If we don't have a valid ppm, fall back to a pixel-based distance
  const maxDistancePx = ppm && ppm > 0
    ? maxDistanceMeters * ppm
    : maxDistanceMeters * 10; // crude fallback so something still renders

  // ----- Compute HFOV (horizontal only) -----
  // HFOV = 2 * atan(sensor_width / (2 * f))
  const hfov = 2 * Math.atan(sensor.width / (2 * focalLength));

  // Corridor mode swaps HFOV/VFOV; for top-down we only care about the
  // horizontal angle, so we use VFOV as the horizontal angle when corridorMode is true.
  const vfov = 2 * Math.atan(sensor.height / (2 * focalLength));
  const effectiveHfov = corridorMode ? vfov : hfov;

  const halfFov = effectiveHfov / 2;
  const startAngle = (rotation * Math.PI) / 180 - halfFov;
  const step = (effectiveHfov) / rayCount;
  const origin = { x, y };

  // ----- Build polygon -----
  const points = [`${x},${y}`];

  for (let i = 0; i <= rayCount; i += 1) {
    const angle = startAngle + step * i;
    const { x: hitX, y: hitY } = castRayWithWalls(origin, angle, maxDistancePx, walls);
    points.push(`${hitX},${hitY}`);
  }

  return points.join(' ');
};
