import { useState, useEffect, useRef } from 'react';

const getIcon = (kind) => {
  switch (kind) {
    case 'camera':
      return { icon: '📷' };
    case 'router':
      return { icon: '🖥️' };
    case 'sensor':
      return { icon: '📡' };
    case 'alarm':
      return { icon: '🔔' };
    default:
      return { icon: '❓' };
  }
};

function Equipment({ placement, onSelect, onUpdatePlacement }) {
  const { id, kind, x, y, rotation = 0 } = placement;
  const [livePos, setLivePos] = useState({ x, y });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setLivePos({ x, y });
  }, [x, y]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect(id);
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - livePos.x,
      y: e.clientY - livePos.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const { x: offsetX, y: offsetY } = dragOffsetRef.current;
    setLivePos({
      x: e.clientX - offsetX,
      y: e.clientY - offsetY,
    });
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    onUpdatePlacement(id, { x: livePos.x, y: livePos.y });
  };

  return (
    <div
      className="equipment"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => e.stopPropagation()}
      style={{
        left: livePos.x,
        top: livePos.y,
        position: 'absolute',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        userSelect: 'none',
        fontSize: '24px',
      }}
    >
      {getIcon(kind).icon}
    </div>
  );
}

export default Equipment;