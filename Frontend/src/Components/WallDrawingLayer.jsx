import { useEffect, useState } from 'react';
import { getLocalPoint } from '../utils/points';
import { closestLinkIdAt, removeWallLink, wallToSegments } from '../utils/wallsConverter';

const MIN_LEN = 6;
const HIT_R = 10;
const WALL_PICK = 14;
const newId = () => `post-${Date.now()}`;
const newLinkId = () => `link-${Date.now()}`;

export default function WallDrawingLayer({ activeTool, wallGraph, onWallGraphChange, onExitWallMode }) {
  const [draft, setDraft] = useState(null);
  const [dragPostId, setDragPostId] = useState(null);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [mode, setMode] = useState('draw');
  const posts = wallGraph?.posts ?? [];
  const byId = new Map(posts.map((p) => [p.id, p]));
  const postAt = (pt) => posts.find((p) => Math.hypot(p.x - pt.x, p.y - pt.y) <= HIT_R) ?? null;

  useEffect(() => {
    if (activeTool !== 'wall') {
      setDraft(null);
      setDragPostId(null);
      setSelectedLinkId(null);
      return;
    }
    setMode('draw');
    setSelectedLinkId(null);
  }, [activeTool]);

  useEffect(() => {
    if (activeTool !== 'wall') return;
    const kd = (e) => {
      if (mode === 'draw' && e.key === 'Enter') {
        setDraft(null);
        setMode('edit');
        return;
      }
      if (mode !== 'edit') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLinkId) {
        e.preventDefault();
        onWallGraphChange?.((g) => removeWallLink(g, selectedLinkId));
        setSelectedLinkId(null);
        return;
      }
      if (e.key === 'Escape') {
        if (selectedLinkId) setSelectedLinkId(null);
        else onExitWallMode?.();
        return;
      }
      if (e.key === 'Enter') onExitWallMode?.();
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [activeTool, mode, onExitWallMode, onWallGraphChange, selectedLinkId]);

  const chainStart = draft && byId.get(draft.startPostId);
  const endDrag = () => setDragPostId(null);

  return (
    <>
      <svg className="wall-overlay">
        {wallToSegments(wallGraph).map((w) => (
          <line
            key={w.id}
            x1={w.x1}
            y1={w.y1}
            x2={w.x2}
            y2={w.y2}
            className={w.id === selectedLinkId ? 'wall-line wall-line--selected' : 'wall-line'}
          />
        ))}
        {mode === 'edit' &&
          posts.map((p) => <circle key={p.id} cx={p.x} cy={p.y} r="5" className="wall-post-handle" />)}
        {mode === 'draw' && chainStart && draft?.previewPoint && (
          <line
            x1={chainStart.x}
            y1={chainStart.y}
            x2={draft.previewPoint.x}
            y2={draft.previewPoint.y}
            className="wall-line wall-line--draft"
          />
        )}
      </svg>
      {activeTool === 'wall' ? (
        <p className="wall-mode-hint" role="status">
          {mode === 'draw'
            ? 'Draw walls on the canvas. Wall drawing mode — exit by pressing Enter.'
            : 'Wall editing mode — click a wall to select, Delete or Backspace to remove. Esc deselects or exits; Enter exits.'}
        </p>
      ) : null}
      <div
        className={`wall-draw-capture${activeTool === 'wall' ? ` is-active is-${mode}-phase` : ''}`}
        onPointerDown={(e) => {
          if (activeTool !== 'wall' || mode !== 'edit') return;
          const h = postAt(getLocalPoint(e, e.currentTarget));
          if (!h) return;
          e.preventDefault();
          e.stopPropagation();
          setDragPostId(h.id);
        }}
        onPointerMove={(e) => {
          if (activeTool !== 'wall') return;
          const pt = getLocalPoint(e, e.currentTarget);
          if (mode === 'edit' && dragPostId) {
            onWallGraphChange?.((g) => ({
              ...g,
              posts: (g.posts ?? []).map((p) => (p.id === dragPostId ? { ...p, x: pt.x, y: pt.y } : p)),
            }));
          } else if (mode === 'draw' && draft) setDraft((d) => ({ ...d, previewPoint: pt }));
        }}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClick={(e) => {
          if (activeTool !== 'wall') return;
          e.preventDefault();
          e.stopPropagation();
          const pt = getLocalPoint(e, e.currentTarget);
          if (mode === 'edit') {
            if (postAt(pt)) setSelectedLinkId(null);
            else setSelectedLinkId(closestLinkIdAt(wallGraph, pt.x, pt.y, WALL_PICK));
            return;
          }
          if (mode !== 'draw') return;
          const snap = postAt(pt);
          if (!draft) {
            const id = newId();
            onWallGraphChange?.((g) => ({ ...g, posts: [...(g.posts ?? []), { id, x: pt.x, y: pt.y }] }));
            setDraft({ startPostId: id, previewPoint: pt });
            return;
          }
          const sp = byId.get(draft.startPostId);
          if (!sp) return;
          const end = snap ? { x: snap.x, y: snap.y } : pt;
          if (Math.hypot(end.x - sp.x, end.y - sp.y) < MIN_LEN) return;
          const nextId = snap?.id ?? newId();
          onWallGraphChange?.((g) => ({
            ...g,
            posts: snap ? g.posts ?? [] : [...(g.posts ?? []), { id: nextId, x: end.x, y: end.y }],
            links: [...(g.links ?? []), { id: newLinkId(), aPostId: draft.startPostId, bPostId: nextId }],
          }));
          setDraft({ startPostId: nextId, previewPoint: end });
        }}
      />
    </>
  );
}
