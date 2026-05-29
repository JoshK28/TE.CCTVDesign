// Geometry helpers for drawing, hit-testing and resizing obstacle rectangles
// on the floor plan. An "obstacle" is an axis-aligned rectangle that the FOV
// ray-cast treats as opaque (see utils/fov.js).

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

// Convert two arbitrary corner points into a top-left + width/height rect
// (so dragging in any direction always yields positive width/height).
export const normaliseRect = (x1, y1, x2, y2) => ({
  x: Math.min(x1, x2),
  y: Math.min(y1, y2),
  width: Math.abs(x2 - x1),
  height: Math.abs(y2 - y1),
});

// Apply an (dx, dy) pointer delta to an obstacle by adjusting only the
// edges implied by the handle id (e.g. "nw" moves north + west edges).
// Width/height are clamped to MIN_SIZE so the rectangle can't collapse.
export const applyResize = (o, handleId, dx, dy) => {
  let { x, y, width, height } = o;
  if (handleId.includes('e')) width  = Math.max(MIN_SIZE, width  + dx);
  if (handleId.includes('s')) height = Math.max(MIN_SIZE, height + dy);
  if (handleId.includes('w')) { x += dx; width  = Math.max(MIN_SIZE, width  - dx); }
  if (handleId.includes('n')) { y += dy; height = Math.max(MIN_SIZE, height - dy); }
  return { ...o, x, y, width, height };
};

// Find the topmost obstacle containing the point, or null. The list is
// reversed so the visually-on-top obstacle (last drawn) wins.
export const findObstacleAt = (obstacles, pt) =>
  [...obstacles].reverse().find(
    (o) => pt.x >= o.x && pt.x <= o.x + o.width && pt.y >= o.y && pt.y <= o.y + o.height
  ) ?? null;

// Return the resize handle (nw/n/ne/...) under the point for the given
// obstacle, or null when the point isn't near any handle. Used by the editor
// to decide whether a pointer-down should start a resize.
export const findResizeHandleAt = (obstacle, pt) => {
  if (!obstacle) return null;
  for (const h of RESIZE_HANDLES) {
    const hx = obstacle.x + h.cx * obstacle.width;
    const hy = obstacle.y + h.cy * obstacle.height;
    if (Math.abs(pt.x - hx) <= HANDLE_SIZE && Math.abs(pt.y - hy) <= HANDLE_SIZE) return h;
  }
  return null;
};
