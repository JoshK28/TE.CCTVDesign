const DEFAULT_SENSOR_WIDTH = 6.4;
const DEFAULT_MAX_DISTANCE = 300;
const DEFAULT_RAY_COUNT = 48;
const RAY_EPSILON = 1e-6;

const getRayWallIntersection = (origin, direction, maxDistance, wall) => {
  const sx = wall.x2 - wall.x1;
  const sy = wall.y2 - wall.y1;
  const cross = direction.x * sy - direction.y * sx;

  if (Math.abs(cross) < RAY_EPSILON) return null;

  const qpx = wall.x1 - origin.x;
  const qpy = wall.y1 - origin.y;
  const t = (qpx * sy - qpy * sx) / cross;
  const u = (qpx * direction.y - qpy * direction.x) / cross;

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
    defaultFocalLength = 2.8,
  } = options;

  const x = item.x ?? 0;
  const y = item.y ?? 0;
  const rotation = item.rotation ?? 0;
  const focalLength = item.focalLength ?? defaultFocalLength;
  const hfov = 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI);
  const halfAngle = hfov / 2;
  const leftAngle = (rotation - halfAngle) * (Math.PI / 180);
  const rightAngle = (rotation + halfAngle) * (Math.PI / 180);
  const origin = { x, y };

  const points = [`${x},${y}`];
  for (let i = 0; i <= rayCount; i += 1) {
    const ratio = i / rayCount;
    const angle = leftAngle + (rightAngle - leftAngle) * ratio;
    const hitPoint = castRayWithWalls(origin, angle, maxDistance, walls);
    points.push(`${hitPoint.x},${hitPoint.y}`);
  }

  return points.join(' ');
};
