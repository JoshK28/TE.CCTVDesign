import { useState, useEffect, useRef } from 'react';
import { getImagePoint } from '../utils/points';

const HANDLE_SIZE = 8;

const RESIZE_HANDLES = [
  { id: 'nw', cx: 0,   cy: 0,   cursor: 'nw-resize' },
  { id: 'n',  cx: 0.5, cy: 0,   cursor: 'n-resize'  },
  { id: 'ne', cx: 1,   cy: 0,   cursor: 'ne-resize' },
  { id: 'e',  cx: 1,   cy: 0.5, cursor: 'e-resize'  },
  { id: 'se', cx: 1,   cy: 1,   cursor: 'se-resize' },
  { id: 's',  cx: 0.5, cy: 1,   cursor: 's-resize'  },
  { id: 'sw', cx: 0,   cy: 1,   cursor: 'sw-resize' },
  { id: 'w',  cx: 0,   cy: 0.5, cursor: 'w-resize'  },
];

const getViewBox = (imageSize) =>
  imageSize?.naturalWidth && imageSize?.naturalHeight
    ? `0 0 ${imageSize.naturalWidth} ${imageSize.naturalHeight}`
    : undefined;

function applyResize(o, handleId, dx, dy) {
  let { x, y, width, height } = o;
  if (handleId.includes('e')) width  = Math.max(10, width  + dx);
  if (handleId.includes('s')) height = Math.max(10, height + dy);
  if (handleId.includes('w')) { x += dx; width  = Math.max(10, width  - dx); }
  if (handleId.includes('n')) { y += dy; height = Math.max(10, height - dy); }
  return { ...o, x, y, width, height };
}

export default function ObstacleDrawingLayer({
  activeTool,
  obstacles,
  imageSize,
  onObstaclesChange,
  onExitObstacleMode,
}) {
  const [draft, setDraft] = useState(null);
  const [selectedObstacleId, setSelectedObstacleId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [mode, setMode] = useState('draw');
  const [pendingRect, setPendingRect] = useState(null);
  const [labelInput, setLabelInput] = useState('');

  // ref so pointer move/up handlers always see latest dragging state
  const draggingRef = useRef(null);
  draggingRef.current = dragging;

  const svgRef = useRef(null);

  useEffect(() => {
    if (activeTool !== 'obstacle') {
      setDraft(null);
      setSelectedObstacleId(null);
      setDragging(null);
      setPendingRect(null);
      setLabelInput('');
      return;
    }
    setMode('draw');
    setSelectedObstacleId(null);
  }, [activeTool]);

  useEffect(() => {
    if (activeTool !== 'obstacle') return;

    const handleKeyDown = (e) => {
      if (pendingRect) return;

      if (mode === 'draw' && e.key === 'Enter') {
        setDraft(null);
        setMode('edit');
        return;
      }
      if (mode !== 'edit') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObstacleId) {
        e.preventDefault();
        onObstaclesChange((prev) => prev.filter((o) => o.id !== selectedObstacleId));
        setSelectedObstacleId(null);
        return;
      }
      if (e.key === 'Escape') {
        if (selectedObstacleId) setSelectedObstacleId(null);
        else onExitObstacleMode?.();
        return;
      }
      if (e.key === 'Enter') onExitObstacleMode?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, mode, selectedObstacleId, pendingRect, onObstaclesChange, onExitObstacleMode]);

  const normaliseRect = (x1, y1, x2, y2) => ({
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  });

  const MIN_SIZE = 10;

  // Get point relative to the SVG element
  const getSvgPoint = (e) => getImagePoint(e, svgRef.current, imageSize);

  const confirmLabel = () => {
    if (!pendingRect) return;
    onObstaclesChange((prev) => [
      ...prev,
      {
        id: Date.now(),
        floorID: null,
        label: labelInput.trim() || 'Obstacle',
        color: '#FF0000',
        ...pendingRect,
      },
    ]);
    setPendingRect(null);
    setLabelInput('');
  };

  const cancelLabel = () => {
    setPendingRect(null);
    setLabelInput('');
  };

  // ---- SVG-level pointer handlers ----

  const handleSvgPointerDown = (e) => {
    if (activeTool !== 'obstacle') return;
    if (pendingRect) return;

    const pt = getSvgPoint(e);

    if (mode === 'draw') {
      e.preventDefault();
      setDraft({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
      return;
    }

    // edit mode — check if we hit a resize handle of the selected obstacle first
    if (mode === 'edit' && selectedObstacleId) {
      const sel = obstacles.find((o) => o.id === selectedObstacleId);
      if (sel) {
        for (const h of RESIZE_HANDLES) {
          const hx = sel.x + h.cx * sel.width;
          const hy = sel.y + h.cy * sel.height;
          if (Math.abs(pt.x - hx) <= HANDLE_SIZE && Math.abs(pt.y - hy) <= HANDLE_SIZE) {
            e.preventDefault();
            e.stopPropagation();
            setDragging({ type: 'resize', obstacleId: sel.id, handleId: h.id, lastX: pt.x, lastY: pt.y });
            return;
          }
        }
      }
    }

    // edit mode — check if we hit an obstacle rect
    if (mode === 'edit') {
      const hit = [...obstacles].reverse().find(
        (o) => pt.x >= o.x && pt.x <= o.x + o.width && pt.y >= o.y && pt.y <= o.y + o.height
      );
      if (hit) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedObstacleId(hit.id);
        setDragging({ type: 'move', obstacleId: hit.id, offsetX: pt.x - hit.x, offsetY: pt.y - hit.y });
        return;
      }
      // clicked empty space — deselect
      setSelectedObstacleId(null);
    }
  };

  const handleSvgPointerMove = (e) => {
    if (activeTool !== 'obstacle') return;
    const pt = getSvgPoint(e);

    if (mode === 'draw' && draft) {
      setDraft((d) => ({ ...d, currentX: pt.x, currentY: pt.y }));
      return;
    }

    const drag = draggingRef.current;
    if (mode === 'edit' && drag) {
      if (drag.type === 'move') {
        onObstaclesChange((prev) =>
          prev.map((o) =>
            o.id === drag.obstacleId
              ? { ...o, x: pt.x - drag.offsetX, y: pt.y - drag.offsetY }
              : o
          )
        );
      } else if (drag.type === 'resize') {
        const dx = pt.x - drag.lastX;
        const dy = pt.y - drag.lastY;
        onObstaclesChange((prev) =>
          prev.map((o) =>
            o.id === drag.obstacleId ? applyResize(o, drag.handleId, dx, dy) : o
          )
        );
        setDragging((d) => ({ ...d, lastX: pt.x, lastY: pt.y }));
      }
    }
  };

  const handleSvgPointerUp = () => {
    if (activeTool !== 'obstacle') return;

    if (mode === 'draw' && draft) {
      const rect = normaliseRect(draft.startX, draft.startY, draft.currentX, draft.currentY);
      if (rect.width >= MIN_SIZE && rect.height >= MIN_SIZE) {
        setPendingRect(rect);
        setLabelInput('');
      }
      setDraft(null);
      return;
    }

    setDragging(null);
  };

  const isActive = activeTool === 'obstacle';

  return (
    <>
      <svg
        ref={svgRef}
        className="obstacle-overlay"
        viewBox={getViewBox(imageSize)}
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: isActive && !pendingRect ? 'all' : 'none',
          cursor: mode === 'draw' ? 'crosshair' : 'default',
        }}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerLeave={() => { setDraft(null); setDragging(null); }}
      >
        {obstacles.map((o) => {
          const isSelected = o.id === selectedObstacleId;
          return (
            <g key={o.id}>
              <rect
                x={o.x}
                y={o.y}
                width={o.width}
                height={o.height}
                fill={o.color ?? '#FF000033'}
                stroke={isSelected ? '#FFD700' : (o.color ?? '#FF0000')}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeDasharray={isSelected ? '6 3' : 'none'}
                style={{ cursor: mode === 'edit' ? 'move' : 'default', pointerEvents: 'none' }}
              />
              <text
                x={o.x + o.width / 2}
                y={o.y + o.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="#fff"
                stroke="#000"
                strokeWidth="0.4"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {o.label}
              </text>

              {/* Resize handles — only when selected in edit mode */}
              {isSelected && mode === 'edit' && RESIZE_HANDLES.map((h) => (
                <rect
                  key={h.id}
                  x={o.x + h.cx * o.width - HANDLE_SIZE / 2}
                  y={o.y + h.cy * o.height - HANDLE_SIZE / 2}
                  width={HANDLE_SIZE}
                  height={HANDLE_SIZE}
                  fill="#fff"
                  stroke="#245d91"
                  strokeWidth="1.5"
                  style={{ pointerEvents: 'none', cursor: h.cursor }}
                />
              ))}
            </g>
          );
        })}

        {/* Draft rectangle while drawing */}
        {draft && (
          <rect
            {...normaliseRect(draft.startX, draft.startY, draft.currentX, draft.currentY)}
            fill="#FF000022"
            stroke="#FF0000"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
        )}
      </svg>

      {isActive && (
        <p className="wall-mode-hint" role="status">
          {mode === 'draw'
            ? 'Click and drag to draw an obstacle box. Press Enter to switch to edit mode.'
            : 'Obstacle edit mode — click to select, drag to move, drag handles to resize, Delete to remove. Esc deselects or exits; Enter exits.'}
        </p>
      )}

      {/* Popup label input */}
      {pendingRect && (
        <div
          style={{
            position: 'absolute',
            left: pendingRect.x + pendingRect.width / 2 - 110,
            top: pendingRect.y + pendingRect.height / 2 - 40,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '10px 14px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            minWidth: '220px',
            pointerEvents: 'all',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>
            Label this obstacle
          </label>
          <input
            autoFocus
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') confirmLabel();
              if (e.key === 'Escape') cancelLabel();
            }}
            placeholder="e.g. Tree, Car, Column"
            style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '0.9rem',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); cancelLabel(); }}
              style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); confirmLabel(); }}
              style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', background: '#245d91', color: '#fff', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </>
  );
}