import { useState } from 'react';

export default function WallDrawingLayer({ activeTool, walls, onAddWall }) {
  const [draftWall, setDraftWall] = useState(null);
  const wallModeActive = activeTool === 'wall';

  const getCanvasPoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event) => {
    if (!wallModeActive) return;
    event.preventDefault();
    event.stopPropagation();
    const start = getCanvasPoint(event);
    setDraftWall({ x1: start.x, y1: start.y, x2: start.x, y2: start.y });
  };

  const handlePointerMove = (event) => {
    if (!wallModeActive || !draftWall) return;
    const current = getCanvasPoint(event);
    setDraftWall((prev) => (prev ? { ...prev, x2: current.x, y2: current.y } : prev));
  };

  const finishDraftWall = (event) => {
    if (!wallModeActive || !draftWall) return;
    event.stopPropagation();
    const length = Math.hypot(draftWall.x2 - draftWall.x1, draftWall.y2 - draftWall.y1);
    if (length >= 6) {
      onAddWall?.({ 
        id: Date.now(), 
        ...draftWall,
        length: length,           // pixel length for rendering
        realWorldLength: 0,       // real world length in metres - will be filled by popup later
        realWorldHeight: 0        // real world height in metres - will be filled by popup later
      });
    }
    setDraftWall(null);
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
        {draftWall && (
          <line
            x1={draftWall.x1}
            y1={draftWall.y1}
            x2={draftWall.x2}
            y2={draftWall.y2}
            className="wall-line wall-line--draft"
          />
        )}
      </svg>
      <div
        className={`wall-draw-capture ${wallModeActive ? 'is-active' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDraftWall}
        onPointerLeave={finishDraftWall}
        onClick={(event) => {
          if (!wallModeActive) return;
          event.preventDefault();
          event.stopPropagation();
        }}
      />
    </>
  );
}
