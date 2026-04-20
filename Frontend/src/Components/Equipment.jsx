import { useState } from 'react';

const getIcon = (type) => {
  switch (type) {
    case 'camera': return { icon: '📷' };
    case 'router': return { icon: '🖥️' };
    case 'alarm': return { icon: '📡' };
    default:       return { icon: '❓' };
  }
};

function Equipment({ id, type, x, y, onSelect, onUpdatePosition }) {

  const [livePos, setLivePos] = useState({ x, y });

  const handlePointerDown = (e) => {
    e.stopPropagation();

    const startX = e.clientX - livePos.x;
    const startY = e.clientY - livePos.y;

    const handlePointerMove = (moveEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;

      setLivePos({ x: newX, y: newY });

      // Live update parent state
      onUpdatePosition(id, newX, newY);

      // Keep sidebar open and updating
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
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
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