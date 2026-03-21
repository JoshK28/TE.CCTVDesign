import { useState } from 'react';

const getIconAppearance = (type) => {
  switch (type) {
    case 'camera': return { icon: '📷', color: '#007bff' };
    case 'server': return { icon: '🖥️', color: '#28a745' };
    case 'sensor': return { icon: '📡', color: '#dc3545' };
    default:       return { icon: '❓', color: '#6c757d' };
  }
};

function EquipmentIcon({ id, type, x, y, isSelected, onSelect, onUpdatePosition }) {
  const { icon, color } = getIconAppearance(type);
  
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
      className="equipment-icon"
      onPointerDown={handlePointerDown}
      style={{ 
        left: livePos.x, 
        top: livePos.y, 
        position: 'absolute', 
        transform: 'translate(-50%, -50%)',
        cursor: isDragging ? 'grabbing' : 'grab', 
        fontSize: '24px',
        userSelect: 'none', 
        border: isSelected ? `2px dashed ${color}` : '2px solid transparent',
        borderRadius: '50%',
        padding: '2px',
        backgroundColor: isSelected ? `${color}22` : 'transparent',
        zIndex: isSelected ? 10 : 1,
      }} 
    >
      {icon}
    </div>
  );
}

export default EquipmentIcon;