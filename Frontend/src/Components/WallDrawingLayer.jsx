import { useEffect, useState } from 'react';

export default function WallDrawingLayer({ activeTool, walls, onAddWall }) {
  const [startPost, setStartPost] = useState(null);
  const [endPost, setEndPost] = useState(null);
  const wallModeActive = activeTool === 'wall';
  const MIN_LENGTH = 6;

  const getCanvasPoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const endChain = () => {
    setStartPost(null);
    setEndPost(null);
  };

  useEffect(() => {
    if (!wallModeActive) endChain();
  }, [wallModeActive]);

  useEffect(() => {
    if (!wallModeActive) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter') endChain();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [wallModeActive]);

  const handlePointerMove = (event) => {
    if (!wallModeActive || !startPost) return;
    setEndPost(getCanvasPoint(event));
  };

  const handleClick = (event) => {
    if (!wallModeActive) return;
    event.preventDefault();
    event.stopPropagation();

    const point = getCanvasPoint(event);

    if (!startPost) {
      setStartPost(point);
      return;
    }

    const length = Math.hypot(point.x - startPost.x, point.y - startPost.y);
    if (length >= MIN_LENGTH) {
      onAddWall?.({ id: Date.now(), x1: startPost.x, y1: startPost.y, x2: point.x, y2: point.y });
      setStartPost(point);
      setEndPost(point);
    }
  };

  return (
    <>
      <svg className="wall-overlay">
        {walls.map((wall) => (
          <line
            key={wall.id}
            x1={wall.x1}
            y1={wall.y1}
            x2={wall.x2}
            y2={wall.y2}
            className="wall-line"
          />
        ))}
        {startPost && endPost && (
          <line
            x1={startPost.x}
            y1={startPost.y}
            x2={endPost.x}
            y2={endPost.y}
            className="wall-line wall-line--draft"
          />
        )}
      </svg>
      <div
        className={`wall-draw-capture ${wallModeActive ? 'is-active' : ''}`}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
      />
    </>
  );
}
