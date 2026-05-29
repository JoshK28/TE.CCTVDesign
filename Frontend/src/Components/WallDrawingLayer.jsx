import { useEffect, useState } from 'react';
import useDraftLine from '../hooks/useDraftLine';
import DraftLine from './DraftLine';
import { getViewBox } from '../utils/overlayUtils';
import {
  closestLinkIdAt,
  parsePixelsPerMeter,
  removeWallLink,
  removeWallPost,
  segmentLengthText,
  wallToSegments,
} from '../utils/wallsConverter';

const MIN_LEN = 6;
const HIT_R = 10;
const WALL_PICK = 14;
const newId = () => `post-${Date.now()}`;
const newLinkId = () => `link-${Date.now()}`;
const WALL_HINTS = {
  draw: 'Draw walls on the canvas. Press Enter or Esc when finished to continue to editing.',
  edit: 'Wall editing mode — click a wall or post to select, Delete or Backspace to remove. Press Enter or Esc to exit.',
};

// SVG <text> label rendered at the midpoint of a wall segment showing the
// length in metres (computed from the project scale). Returns null if no
// pixels-per-metre value is configured.
function WallLengthLabel({ x1, y1, x2, y2, pixelsPerMeter, className = 'wall-length-label' }) {
  const label = segmentLengthText(x1, y1, x2, y2, pixelsPerMeter);
  return label ? (
    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2} className={className}>
      {label}
    </text>
  ) : null;
}

// Non-interactive SVG overlay that paints every wall segment from the wall
// graph plus its length label. Used both inside the drawing layer and in the
// normal (non-editing) view on the design page.
export function WallOverlay({ wallGraph, scale, selectedLinkId, imageSize }) {
  return (
    <svg className="wall-overlay" viewBox={getViewBox(imageSize)} preserveAspectRatio="none">
      {wallToSegments(wallGraph).map((w) => (
        <g key={w.id}>
          <line
            x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
            className={w.id === selectedLinkId ? 'wall-line wall-line--selected' : 'wall-line'}
          />
          <WallLengthLabel {...w} pixelsPerMeter={parsePixelsPerMeter(scale)} />
        </g>
      ))}
    </svg>
  );
}

/*
WallDrawingLayer is the interactive overlay used while the "wall" tool is
active. It supports two phases controlled by `mode`:
  - "draw" : click to chain wall segments together. Enter/Esc switches to
             edit mode.
  - "edit" : click a wall or post to select it, drag posts to move them, and
             Delete/Backspace to remove the selection. Enter/Esc leaves wall
             mode entirely.
All changes flow back through onWallGraphChange so the parent owns the wall
graph and can route the change through its undo/redo stack.
*/
export default function WallDrawingLayer({ wallGraph, scale, imageSize, onWallGraphChange, onExitWallMode }) {
  const [draftStartPostId, setDraftStartPostId] = useState(null);
  const [dragPostId, setDragPostId] = useState(null);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [mode, setMode] = useState('draw');
  const {
    start: draftStart,
    preview,
    getPoint,
    beginAt,
    reset: resetDraftLine,
    handlePointerMove: handleDraftPointerMove,
  } = useDraftLine({ active: mode === 'draw', imageSize });
  const posts = wallGraph?.posts ?? [];
  const pixelsPerMeter = parsePixelsPerMeter(scale);
  const postAt = (pt) => posts.find((p) => Math.hypot(p.x - pt.x, p.y - pt.y) <= HIT_R) ?? null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode === 'draw' && (e.key === 'Enter' || e.key === 'Escape')) {
        setDraftStartPostId(null);
        resetDraftLine();
        setMode('edit');
        return;
      }
      if (mode !== 'edit') return;

      const isDeleteKey = e.key === 'Delete' || e.key === 'Backspace';
      if (isDeleteKey && (selectedLinkId || selectedPostId)) {
        e.preventDefault();
        onWallGraphChange?.((g) => (selectedLinkId ? removeWallLink(g, selectedLinkId) : removeWallPost(g, selectedPostId)));
        setSelectedLinkId(null);
        setSelectedPostId(null);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Escape') onExitWallMode?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onExitWallMode, onWallGraphChange, resetDraftLine, selectedLinkId, selectedPostId]);

  const endDrag = () => setDragPostId(null);

  // In edit mode, start dragging a post if the pointer landed on one.
  const handlePointerDown = (e) => {
    if (mode !== 'edit') return;
    const post = postAt(getPoint(e));
    if (!post) return;
    e.preventDefault();
    e.stopPropagation();
    setDragPostId(post.id);
  };

  // Drive the live preview while drawing, or move a dragged post while editing.
  const handlePointerMove = (e) => {
    if (mode === 'edit' && dragPostId) {
      const point = getPoint(e);
      onWallGraphChange?.((g) => ({
        ...g,
        posts: (g.posts ?? []).map((p) => (p.id === dragPostId ? { ...p, x: point.x, y: point.y } : p)),
      }));
      return;
    }

    if (mode === 'draw' && draftStartPostId) handleDraftPointerMove(e);
  };

  // In edit mode: select the post under the click, or otherwise the closest
  // nearby wall link. In draw mode: drop a new post and either start a fresh
  // chain or close the segment back to a snapped existing post.
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const point = getPoint(e);
    if (mode === 'edit') {
      const post = postAt(point);
      setSelectedPostId(post?.id ?? null);
      setSelectedLinkId(post ? null : closestLinkIdAt(wallGraph, point.x, point.y, WALL_PICK));
      return;
    }

    if (mode !== 'draw') return;
    if (!draftStartPostId) {
      const id = newId();
      onWallGraphChange?.((g) => ({ ...g, posts: [...(g.posts ?? []), { id, x: point.x, y: point.y }] }));
      setDraftStartPostId(id);
      beginAt(point, point);
      return;
    }

    const snap = postAt(point);
    const end = snap ?? point;
    if (!draftStart || Math.hypot(end.x - draftStart.x, end.y - draftStart.y) < MIN_LEN) return;

    const nextId = snap?.id ?? newId();
    onWallGraphChange?.((g) => ({
      ...g,
      posts: snap ? g.posts ?? [] : [...(g.posts ?? []), { id: nextId, x: end.x, y: end.y }],
      links: [...(g.links ?? []), { id: newLinkId(), aPostId: draftStartPostId, bPostId: nextId }],
    }));
    setDraftStartPostId(nextId);
    beginAt(end, end);
  };

  return (
    <>
      <WallOverlay wallGraph={wallGraph} scale={scale} selectedLinkId={selectedLinkId} imageSize={imageSize} />
      <svg className="wall-overlay" viewBox={getViewBox(imageSize)} preserveAspectRatio="none">
        {mode === 'edit' &&
          posts.map((p) => (
            <circle
              key={p.id} cx={p.x} cy={p.y} r="5"
              className={p.id === selectedPostId ? 'wall-post-handle wall-post-handle--selected' : 'wall-post-handle'}
            />
          ))}
        {mode === 'draw' && draftStart && preview && (
          <DraftLine from={draftStart} to={preview} lineClassName="wall-line wall-line--draft">
            <WallLengthLabel
              x1={draftStart.x} y1={draftStart.y} x2={preview.x} y2={preview.y} pixelsPerMeter={pixelsPerMeter}
              className="wall-length-label wall-length-label--draft"
            />
          </DraftLine>
        )}
      </svg>
      <p className="draw-mode-hint" role="status">
        {WALL_HINTS[mode]}
      </p>
      <div
        className={`wall-draw-capture is-active is-${mode}-phase`}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerLeave={endDrag} onClick={handleClick}
      />
    </>
  );
}
