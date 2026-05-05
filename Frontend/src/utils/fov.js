const DEFAULT_SENSOR_WIDTH = 6.4;
const DEFAULT_MAX_DISTANCE = 300;
const DEFAULT_RAY_COUNT = 48;
const DEFAULT_FOCAL_LENGTH = 2.8;
const RAY_EPSILON = 1e-6;

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

export const calculateFovPolygon = (item, walls, options = {}) => {
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

  const points = [`${x},${y}`];
  for (let i = 0; i <= rayCount; i += 1) {
    const { x: hitX, y: hitY } = castRayWithWalls(origin, startAngle + step * i, maxDistance, walls);
    points.push(`${hitX},${hitY}`);
  }

  return points.join(' ');
};
