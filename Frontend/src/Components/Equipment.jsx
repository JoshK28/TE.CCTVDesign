import { useState } from 'react';

const getIconAppearance = (type) => {
  switch (type) {
    case 'camera': return { icon: '📷' };
    case 'server': return { icon: '🖥️' };
    case 'alarm': return { icon: '📡' };
    default:       return { icon: '❓' };
  }
};

function Equipment({ id, type, x, y, isSelected, onSelect , onUpdatePosition }) {
  const { icon } = getIconAppearance(type);
  
  const [livePos, setLivePos] = useState({ x, y });
  const [isDragging, setIsDragging] = useState(false);


  const handlePointerDown = (e) => {
    e.stopPropagation(); 
    onSelect(id);
    setIsDragging(true);

    const startX = e.clientX - livePos.x;
    const startY = e.clientY - livePos.y;

    const handlePointerMove = (moveEvent) => {
      setLivePos({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      });
    };

    const handlePointerUp = (upEvent) => {
      setIsDragging(false);
      
      const finalX = upEvent.clientX - startX;
      const finalY = upEvent.clientY - startY;
      
      // Tell the parent database to permanently save these new coordinates
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
      style={{ 
        left: livePos.x, 
        top: livePos.y, 
        position: 'absolute', 
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab', 
        userSelect: 'none',
        fontSize: '24px',
        backgroundColor: isSelected ? 'rgb(0, 123, 255)' : 'transparent'
      }} 
    >
      {icon}
    </div>
  );
}

export default Equipment;