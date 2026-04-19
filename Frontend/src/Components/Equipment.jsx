import { useState, useEffect } from 'react';

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

function Equipment({ id, kind, x, y, rotation = 0, onSelect, onUpdatePlacement }) {
  const [livePos, setLivePos] = useState({ x, y });

  useEffect(() => {
    setLivePos({ x, y });
  }, [x, y]);


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
      
      // Persist updated coordinates into shared placement state.
      onUpdatePlacement(id, { x: finalX, y: finalY });

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