// Field-of-view helpers used by the design canvas.
//
// Each camera renders a triangular/pie-slice polygon representing the area it
// can see. The polygon is built by ray-casting from the camera's origin
// across its horizontal FOV (derived from focal length and a default sensor
// width), and each ray is stopped at the nearest wall or obstacle edge so
// the FOV is correctly occluded by the layout.

const DEFAULT_SENSOR_WIDTH = 6.4;
const DEFAULT_MAX_DISTANCE = 300;
const DEFAULT_RAY_COUNT = 48;
const DEFAULT_FOCAL_LENGTH = 2.8;
const RAY_EPSILON = 1e-6;

// Solve the parametric intersection between a ray (origin + t·direction)
// and a wall segment, returning the hit point and ray distance, or null if
// the ray misses or hits past maxDistance.
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
    sensorWidth = DEFAULT_SENSOR_WIDTH,
    maxDistance = DEFAULT_MAX_DISTANCE,
    rayCount = DEFAULT_RAY_COUNT,
    defaultFocalLength = DEFAULT_FOCAL_LENGTH,
  } = options;

  const { x = 0, y = 0, rotation = 0 } = item;
  const focalLength = item.focalLength ?? defaultFocalLength;
  const halfFov = Math.atan(sensorWidth / (2 * focalLength));
  const startAngle = (rotation * Math.PI) / 180 - halfFov;
  const step = (halfFov * 2) / rayCount;
  const origin = { x, y };

  // combine walls and obstacle edges into one list for ray casting
  const allWalls = [
    ...walls,
    ...obstacles.flatMap(obstacleToWalls),
  ];

  const points = [`${x},${y}`];
  for (let i = 0; i <= rayCount; i += 1) {
    const { x: hitX, y: hitY } = castRayWithWalls(origin, startAngle + step * i, maxDistance, allWalls);
    points.push(`${hitX},${hitY}`);
  }

  return points.join(' ');
};