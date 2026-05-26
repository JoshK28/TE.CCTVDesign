import { useState, useEffect } from 'react';
import { getImagePoint } from '../utils/points';
import { getViewBox } from '../utils/overlayUtils';
import {
  HANDLE_SIZE,
  MIN_SIZE,
  RESIZE_HANDLES,
  applyResize,
  findObstacleAt,
  findResizeHandleAt,
  normaliseRect,
} from '../utils/obstaclesUtil';

const OBSTACLE_HINTS = {
  draw: 'Click and drag to draw an obstacle box. Press Enter to switch to edit mode.',
  edit: 'Obstacle edit mode — click to select, drag to move, drag handles to resize, Delete to remove. Esc deselects or exits; Enter exits.',
};

export function ObstacleOverlay({ obstacles, imageSize, selectedId = null }) {
  return (
    <svg className="obstacle-overlay" viewBox={getViewBox(imageSize)} preserveAspectRatio="none">
      {obstacles.map((o) => (
        <g key={o.id}>
          <rect
            x={o.x} y={o.y} width={o.width} height={o.height}
            className={o.id === selectedId ? 'obstacle-rect obstacle-rect--selected' : 'obstacle-rect'}
          />
          <text x={o.x + o.width / 2} y={o.y + o.height / 2} className="obstacle-label">
            {o.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function ObstacleDrawingLayer({
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

  useEffect(() => {
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
  }, [mode, selectedObstacleId, pendingRect, onObstaclesChange, onExitObstacleMode]);

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

  const handlePointerDown = (e) => {
    if (pendingRect) return;
    const pt = getImagePoint(e, e.currentTarget, imageSize);

    if (mode === 'draw') {
      e.preventDefault();
      setDraft({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
      return;
    }

    const selected = obstacles.find((o) => o.id === selectedObstacleId);
    const handle = findResizeHandleAt(selected, pt);
    if (handle) {
      e.preventDefault();
      e.stopPropagation();
      setDragging({ type: 'resize', obstacleId: selected.id, handleId: handle.id, lastX: pt.x, lastY: pt.y });
      return;
    }

    const hit = findObstacleAt(obstacles, pt);
    if (hit) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedObstacleId(hit.id);
      setDragging({ type: 'move', obstacleId: hit.id, offsetX: pt.x - hit.x, offsetY: pt.y - hit.y });
      return;
    }
    setSelectedObstacleId(null);
  };

  const handlePointerMove = (e) => {
    const pt = getImagePoint(e, e.currentTarget, imageSize);

    if (mode === 'draw' && draft) {
      setDraft((d) => ({ ...d, currentX: pt.x, currentY: pt.y }));
      return;
    }

    if (mode !== 'edit' || !dragging) return;

    if (dragging.type === 'move') {
      onObstaclesChange((prev) =>
        prev.map((o) =>
          o.id === dragging.obstacleId
            ? { ...o, x: pt.x - dragging.offsetX, y: pt.y - dragging.offsetY }
            : o
        )
      );
      return;
    }

    const dx = pt.x - dragging.lastX;
    const dy = pt.y - dragging.lastY;
    onObstaclesChange((prev) =>
      prev.map((o) => (o.id === dragging.obstacleId ? applyResize(o, dragging.handleId, dx, dy) : o))
    );
    setDragging((d) => ({ ...d, lastX: pt.x, lastY: pt.y }));
  };

  const handlePointerUp = () => {
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

  const handlePointerLeave = () => {
    setDraft(null);
    setDragging(null);
  };

  return (
    <>
      <ObstacleOverlay obstacles={obstacles} imageSize={imageSize} selectedId={selectedObstacleId} />
      <svg
        className="obstacle-overlay"
        viewBox={getViewBox(imageSize)}
        preserveAspectRatio="none"
        style={{
          pointerEvents: pendingRect ? 'none' : 'all',
          cursor: mode === 'draw' ? 'crosshair' : 'default',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {mode === 'edit' && selectedObstacleId && obstacles
          .filter((o) => o.id === selectedObstacleId)
          .flatMap((o) => RESIZE_HANDLES.map((h) => (
            <rect
              key={`${o.id}-${h.id}`}
              x={o.x + h.cx * o.width - HANDLE_SIZE / 2}
              y={o.y + h.cy * o.height - HANDLE_SIZE / 2}
              width={HANDLE_SIZE} height={HANDLE_SIZE}
              className="obstacle-handle"
              style={{ cursor: h.cursor }}
            />
          )))}

        {draft && (
          <rect
            {...normaliseRect(draft.startX, draft.startY, draft.currentX, draft.currentY)}
            className="obstacle-rect--draft"
          />
        )}
      </svg>

      <p className="draw-mode-hint" role="status">
        {OBSTACLE_HINTS[mode]}
      </p>

      {pendingRect && (
        <div
          className="obstacle-label-popup"
          style={{
            left: pendingRect.x + pendingRect.width / 2 - 110,
            top: pendingRect.y + pendingRect.height / 2 - 40,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <label className="obstacle-label-popup__label">Label this obstacle</label>
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
            className="obstacle-label-popup__input"
          />
          <div className="obstacle-label-popup__actions">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); cancelLabel(); }}
              className="obstacle-label-popup__btn obstacle-label-popup__btn--cancel"
            >
              Cancel
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); confirmLabel(); }}
              className="obstacle-label-popup__btn obstacle-label-popup__btn--confirm"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </>
  );
}
