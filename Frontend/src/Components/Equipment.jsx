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
    onSelect(id);

    const startX = e.clientX - livePos.x;
    const startY = e.clientY - livePos.y;

    const handlePointerMove = (moveEvent) => {
      setLivePos({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      });
    };

    const handlePointerUp = (upEvent) => {
      const finalX = upEvent.clientX - startX;
      const finalY = upEvent.clientY - startY;

      onUpdatePosition(id, finalX, finalY);

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
      onClick={(e) => e.stopPropagation()}
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
      }}
    >
      {getIcon(type).icon}
    </div>
  );
}

export default Equipment;