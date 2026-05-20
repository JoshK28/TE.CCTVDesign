import { useState, useEffect } from 'react';
import { getLocalPoint } from '../utils/points';

export default function ObstacleDrawingLayer({
  activeTool,
  obstacles,
  onObstaclesChange,
  onExitObstacleMode,
}) {
  const [draft, setDraft] = useState(null);
  const [selectedObstacleId, setSelectedObstacleId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [mode, setMode] = useState('draw');
  const [pendingRect, setPendingRect] = useState(null);
  const [labelInput, setLabelInput] = useState('');

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

  return (
    <>
      <svg
        className="obstacle-overlay"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {obstacles.map((o) => (
          <g key={o.id}>
            <rect
              x={o.x}
              y={o.y}
              width={o.width}
              height={o.height}
              fill={o.color ?? '#FF000033'}
              stroke={o.id === selectedObstacleId ? '#FFD700' : (o.color ?? '#FF0000')}
              strokeWidth={o.id === selectedObstacleId ? 2.5 : 1.5}
              strokeDasharray={o.id === selectedObstacleId ? '6 3' : 'none'}
              style={{ pointerEvents: mode === 'edit' ? 'all' : 'none', cursor: 'move' }}
              onClick={(e) => {
                if (mode !== 'edit') return;
                e.preventDefault();
                e.stopPropagation();
                setSelectedObstacleId(o.id);
              }}
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
          </g>
        ))}

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

      {activeTool === 'obstacle' && (
        <p className="wall-mode-hint" role="status">
          {mode === 'draw'
            ? 'Click and drag to draw an obstacle box. Press Enter to switch to edit mode.'
            : 'Obstacle edit mode — click an obstacle to select, Delete to remove. Esc deselects or exits; Enter exits.'}
        </p>
      )}

      <div
        className={`wall-draw-capture${activeTool === 'obstacle' ? ` is-active is-${mode}-phase` : ''}`}
        style={{ pointerEvents: pendingRect ? 'none' : undefined }}
        onClick={(e) => {
          if (activeTool !== 'obstacle') return;
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          if (activeTool !== 'obstacle') return;
          if (mode !== 'draw') return;
          if (pendingRect) return;
          e.preventDefault();
          e.stopPropagation();
          const pt = getLocalPoint(e, e.currentTarget);
          setDraft({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
        }}
        onPointerMove={(e) => {
          if (activeTool !== 'obstacle') return;
          const pt = getLocalPoint(e, e.currentTarget);

          if (mode === 'draw' && draft) {
            setDraft((d) => ({ ...d, currentX: pt.x, currentY: pt.y }));
            return;
          }

          if (mode === 'edit' && dragging) {
            onObstaclesChange((prev) =>
              prev.map((o) =>
                o.id === dragging.obstacleId
                  ? { ...o, x: pt.x - dragging.offsetX, y: pt.y - dragging.offsetY }
                  : o
              )
            );
          }
        }}
        onPointerUp={(e) => {
          if (activeTool !== 'obstacle') return;
          e.preventDefault();
          e.stopPropagation();

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
        }}
        onPointerLeave={() => {
          setDraft(null);
          setDragging(null);
        }}
      />

      {/* popup is AFTER the capture div so it sits on top in DOM order */}
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