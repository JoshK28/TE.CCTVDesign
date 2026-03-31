import { useState } from 'react';

const getIcon = (type) => {
  switch (type) {
    case 'camera': return { icon: '📷' };
    case 'router': return { icon: '🖥️' };
    case 'alarm': return { icon: '📡' };
    default:       return { icon: '❓' };
  }
};

function Equipment({ id, type, x, y, onSelect, onUpdatePosition, onDoubleClick }) {

  const [livePos, setLivePos] = useState({ x, y });

  const handlePointerDown = (e) => {
    e.stopPropagation();

    const startX = e.clientX - livePos.x;
    const startY = e.clientY - livePos.y;

    const handlePointerMove = (moveEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;

      // Smooth visual movement
      setLivePos({ x: newX, y: newY });

      // NEW: live update to parent state
      onUpdatePosition(id, newX, newY);

      // Keep selected so AttributesBar updates live
      onSelect(id);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      className="equipment"
      onPointerDown={handlePointerDown}
      onMouseEnter={() => onSelect(id)}
      onMouseLeave={() => onSelect(null)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onDoubleClick) onDoubleClick(id);
      }}
      style={{
        left: livePos.x,
        top: livePos.y,
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        userSelect: 'none',
        fontSize: '24px',
        cursor: 'grab'
      }}
    >
      {getIcon(type).icon}
    </div>
  );
}

export default Equipment;