export const HANDLE_SIZE = 8;
export const MIN_SIZE = 10;

export const RESIZE_HANDLES = [
  { id: 'nw', cx: 0,   cy: 0,   cursor: 'nw-resize' },
  { id: 'n',  cx: 0.5, cy: 0,   cursor: 'n-resize'  },
  { id: 'ne', cx: 1,   cy: 0,   cursor: 'ne-resize' },
  { id: 'e',  cx: 1,   cy: 0.5, cursor: 'e-resize'  },
  { id: 'se', cx: 1,   cy: 1,   cursor: 'se-resize' },
  { id: 's',  cx: 0.5, cy: 1,   cursor: 's-resize'  },
  { id: 'sw', cx: 0,   cy: 1,   cursor: 'sw-resize' },
  { id: 'w',  cx: 0,   cy: 0.5, cursor: 'w-resize'  },
];

export const normaliseRect = (x1, y1, x2, y2) => ({
  x: Math.min(x1, x2),
  y: Math.min(y1, y2),
  width: Math.abs(x2 - x1),
  height: Math.abs(y2 - y1),
});

export const applyResize = (o, handleId, dx, dy) => {
  let { x, y, width, height } = o;
  if (handleId.includes('e')) width  = Math.max(MIN_SIZE, width  + dx);
  if (handleId.includes('s')) height = Math.max(MIN_SIZE, height + dy);
  if (handleId.includes('w')) { x += dx; width  = Math.max(MIN_SIZE, width  - dx); }
  if (handleId.includes('n')) { y += dy; height = Math.max(MIN_SIZE, height - dy); }
  return { ...o, x, y, width, height };
};

export const findObstacleAt = (obstacles, pt) =>
  [...obstacles].reverse().find(
    (o) => pt.x >= o.x && pt.x <= o.x + o.width && pt.y >= o.y && pt.y <= o.y + o.height
  ) ?? null;

export const findResizeHandleAt = (obstacle, pt) => {
  if (!obstacle) return null;
  for (const h of RESIZE_HANDLES) {
    const hx = obstacle.x + h.cx * obstacle.width;
    const hy = obstacle.y + h.cy * obstacle.height;
    if (Math.abs(pt.x - hx) <= HANDLE_SIZE && Math.abs(pt.y - hy) <= HANDLE_SIZE) return h;
  }
  return null;
};
