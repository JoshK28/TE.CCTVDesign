import { useEffect, useState } from 'react';
import { getImagePoint } from '../utils/points';
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

function WallLengthLabel({ x1, y1, x2, y2, pixelsPerMeter, className = 'wall-length-label' }) {
  const label = segmentLengthText(x1, y1, x2, y2, pixelsPerMeter);
  return label ? (
    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2} className={className}>
      {label}
    </text>
  ) : null;
}

const getViewBox = (imageSize) =>
  imageSize?.naturalWidth && imageSize?.naturalHeight
    ? `0 0 ${imageSize.naturalWidth} ${imageSize.naturalHeight}`
    : undefined;

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

export default function WallDrawingLayer({ wallGraph, scale, imageSize, onWallGraphChange, onExitWallMode }) {
  const [draft, setDraft] = useState(null);
  const [dragPostId, setDragPostId] = useState(null);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [mode, setMode] = useState('draw');
  const posts = wallGraph?.posts ?? [];
  const pixelsPerMeter = parsePixelsPerMeter(scale);
  const byId = new Map(posts.map((p) => [p.id, p]));
  const postAt = (pt) => posts.find((p) => Math.hypot(p.x - pt.x, p.y - pt.y) <= HIT_R) ?? null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (mode === 'draw' && (e.key === 'Enter' || e.key === 'Escape')) {
        setDraft(null);
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
  }, [mode, onExitWallMode, onWallGraphChange, selectedLinkId, selectedPostId]);

  const chainStart = draft && byId.get(draft.startPostId);
  const endDrag = () => setDragPostId(null);

  const handlePointerDown = (e) => {
    if (mode !== 'edit') return;
    const post = postAt(getImagePoint(e, e.currentTarget, imageSize));
    if (!post) return;
    e.preventDefault();
    e.stopPropagation();
    setDragPostId(post.id);
  };

  const handlePointerMove = (e) => {
    const point = getImagePoint(e, e.currentTarget, imageSize);

    if (mode === 'edit' && dragPostId) {
      onWallGraphChange?.((g) => ({
        ...g,
        posts: (g.posts ?? []).map((p) => (p.id === dragPostId ? { ...p, x: point.x, y: point.y } : p)),
      }));
      return;
    }

    if (mode === 'draw' && draft) setDraft((d) => ({ ...d, previewPoint: point }));
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const point = getImagePoint(e, e.currentTarget, imageSize);
    if (mode === 'edit') {
      const post = postAt(point);
      setSelectedPostId(post?.id ?? null);
      setSelectedLinkId(post ? null : closestLinkIdAt(wallGraph, point.x, point.y, WALL_PICK));
      return;
    }

    if (mode !== 'draw') return;
    if (!draft) {
      const id = newId();
      onWallGraphChange?.((g) => ({ ...g, posts: [...(g.posts ?? []), { id, x: point.x, y: point.y }] }));
      setDraft({ startPostId: id, previewPoint: point });
      return;
    }

    const start = byId.get(draft.startPostId);
    const snap = postAt(point);
    const end = snap ?? point;
    if (!start || Math.hypot(end.x - start.x, end.y - start.y) < MIN_LEN) return;

    const nextId = snap?.id ?? newId();
    onWallGraphChange?.((g) => ({
      ...g,
      posts: snap ? g.posts ?? [] : [...(g.posts ?? []), { id: nextId, x: end.x, y: end.y }],
      links: [...(g.links ?? []), { id: newLinkId(), aPostId: draft.startPostId, bPostId: nextId }],
    }));
    setDraft({ startPostId: nextId, previewPoint: end });
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
        {mode === 'draw' && chainStart && draft?.previewPoint && (
          <g>
            <line
              x1={chainStart.x} y1={chainStart.y} x2={draft.previewPoint.x} y2={draft.previewPoint.y}
              className="wall-line wall-line--draft"
            />
            <WallLengthLabel
              x1={chainStart.x} y1={chainStart.y} x2={draft.previewPoint.x} y2={draft.previewPoint.y} pixelsPerMeter={pixelsPerMeter}
              className="wall-length-label wall-length-label--draft"
            />
          </g>
        )}
      </svg>
      <p className="wall-mode-hint" role="status">
        {WALL_HINTS[mode]}
      </p>
      <div
        className={`wall-draw-capture is-active is-${mode}-phase`}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerLeave={endDrag} onClick={handleClick}
      />
    </>
  );
}
