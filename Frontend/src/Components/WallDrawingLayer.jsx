import { useEffect, useMemo, useState } from 'react';
import { getLocalPoint } from '../utils/points';
import { wallGraphToSegments } from '../utils/wallsConverter';

const MIN_LENGTH = 6;
const ENDPOINT_HIT_RADIUS = 10;
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function WallDrawingLayer({ activeTool, wallGraph, onWallGraphChange, onExitWallMode }) {
  const [draft, setDraft] = useState(null); 
  const [dragPostId, setDragPostId] = useState(null);

  const [mode, setMode] = useState('draw');
  const wallModeActive = activeTool === 'wall';
  const posts = wallGraph?.posts ?? [];
  const postById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);
  const walls = useMemo(() => wallGraphToSegments(wallGraph), [wallGraph]);

  const getPostAtPoint = (point) =>
    posts.find((post) => Math.hypot(post.x - point.x, post.y - point.y) <= ENDPOINT_HIT_RADIUS) ?? null;

  useEffect(() => {
    if (wallModeActive) {
      setMode('draw');
      return;
    }
    setDraft(null);
    setDragPostId(null);
  }, [wallModeActive]);

  useEffect(() => {
    if (!wallModeActive) return undefined;
    const onKeyDown = (event) => {
      if (mode === 'draw' && event.key === 'Enter') {
        setDraft(null);
        setMode('edit');
        return;
      }
      if (mode === 'edit' && (event.key === 'Escape' || event.key === 'Enter')) onExitWallMode?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [wallModeActive, mode, onExitWallMode]);

  const handlePointerMove = (event) => {
    if (!wallModeActive) return;
    const point = getLocalPoint(event, event.currentTarget);

    if (mode === 'edit' && dragPostId) {
      onWallGraphChange?.((graph) => ({
        ...graph,
        posts: (graph.posts ?? []).map((post) => (post.id === dragPostId ? { ...post, x: point.x, y: point.y } : post)),
      }));
      return;
    }
    if (mode === 'draw' && draft) setDraft((prev) => ({ ...prev, previewPoint: point }));
  };

  const handlePointerDown = (event) => {
    if (!wallModeActive || mode !== 'edit') return;
    const hit = getPostAtPoint(getLocalPoint(event, event.currentTarget));
    if (!hit) return;
    event.preventDefault();
    event.stopPropagation();
    setDragPostId(hit.id);
  };

  const handleClick = (event) => {
    if (!wallModeActive || mode !== 'draw') return;
    event.preventDefault();
    event.stopPropagation();
    const point = getLocalPoint(event, event.currentTarget);
    const targetPost = getPostAtPoint(point);

    if (!draft) {
      const firstPostId = newId();
      onWallGraphChange?.((graph) => ({ ...graph, posts: [...(graph.posts ?? []), { id: firstPostId, x: point.x, y: point.y }] }));
      setDraft({ startPostId: firstPostId, previewPoint: point });
      return;
    }

    const startPost = postById.get(draft.startPostId);
    if (!startPost) return;
    const targetPoint = targetPost ? { x: targetPost.x, y: targetPost.y } : point;
    if (Math.hypot(targetPoint.x - startPost.x, targetPoint.y - startPost.y) < MIN_LENGTH) return;

    const nextPostId = targetPost?.id ?? newId();
    onWallGraphChange?.((graph) => ({
      ...graph,
      posts: targetPost ? graph.posts ?? [] : [...(graph.posts ?? []), { id: nextPostId, x: targetPoint.x, y: targetPoint.y }],
      links: [...(graph.links ?? []), { id: newId(), aPostId: draft.startPostId, bPostId: nextPostId }],
    }));
    setDraft({ startPostId: nextPostId, previewPoint: targetPoint });
  };

  const startPost = draft ? postById.get(draft.startPostId) : null;

  return (
    <>
      <svg className="wall-overlay">
        {/* Persisted wall links rendered as solid segments. */}
        {walls.map((wall) => (
          <line key={wall.id} x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} className="wall-line" />
        ))}
        {mode === 'edit' &&
          /* Existing posts become draggable handles in edit mode. */
          posts.map((post) => <circle key={post.id} cx={post.x} cy={post.y} r="5" className="wall-post-handle" />)}
        {mode === 'draw' && startPost && draft?.previewPoint && (
          /* Live draft segment from chain start to cursor. */
          <line
            x1={startPost.x}
            y1={startPost.y}
            x2={draft.previewPoint.x}
            y2={draft.previewPoint.y}
            className="wall-line wall-line--draft"
          />
        )}
      </svg>
      <div
        className={`wall-draw-capture ${wallModeActive ? 'is-active' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragPostId(null)}
        onPointerLeave={() => setDragPostId(null)}
        onClick={handleClick}
      />
    </>
  );
}
