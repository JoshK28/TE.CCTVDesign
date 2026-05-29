import api from '../services/api';
import { toPlacementPayload } from './placement';

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
