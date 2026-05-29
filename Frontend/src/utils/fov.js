// Field-of-view helpers used by the design canvas.
//
// Each camera renders a triangular/pie-slice polygon representing the area it
// can see. The polygon is built by ray-casting from the camera's origin
// across its horizontal FOV (derived from focal length and a default sensor
// width), and each ray is stopped at the nearest wall or obstacle edge so
// the FOV is correctly occluded by the layout.

const DEFAULT_SENSOR_WIDTH = 6.4;
const DEFAULT_MAX_DISTANCE = 300;
const DEFAULT_MAX_DISTANCE_METERS = 60;      // fallback if no IR range on item
const DEFAULT_RAY_COUNT = 48;
const DEFAULT_FOCAL_LENGTH = 2.8;
const DEFAULT_SENSOR_TYPE = '1/2.8';
const RAY_EPSILON = 1e-6;

// Solve the parametric intersection between a ray (origin + t·direction)
// and a wall segment, returning the hit point and ray distance, or null if
// the ray misses or hits past maxDistance.
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

// Cast a single ray from `origin` at `angle` and return its first hit (or
// the point at maxDistance if the ray hits nothing).
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

// converts an obstacle rectangle into 4 wall segments for ray casting
const obstacleToWalls = (obstacle) => {
  const { x, y, width, height } = obstacle;
  return [
    { x1: x,         y1: y,          x2: x + width, y2: y          }, // top
    { x1: x + width, y1: y,          x2: x + width, y2: y + height }, // right
    { x1: x + width, y1: y + height, x2: x,         y2: y + height }, // bottom
    { x1: x,         y1: y + height, x2: x,         y2: y          }, // left
  ];
};

// Build the SVG `points` string for a camera's FOV polygon. The polygon
// starts at the camera origin, fans rayCount+1 rays across the camera's
// horizontal FOV (computed from sensorWidth and focalLength), and each ray
// is clipped against the supplied walls and obstacle edges.
export const calculateFovPolygon = (item, walls, options = {}, obstacles = []) => {
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

  // combine walls and obstacle edges into one list for ray casting
  const allWalls = [
    ...walls,
    ...obstacles.flatMap(obstacleToWalls),
  ];

  const points = [`${x},${y}`];

  for (let i = 0; i <= rayCount; i += 1) {
    const { x: hitX, y: hitY } = castRayWithWalls(origin, startAngle + step * i, maxDistancePx, allWalls);
    points.push(`${hitX},${hitY}`);
  }

  return points.join(' ');
};