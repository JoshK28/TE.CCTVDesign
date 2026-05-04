import { useState, useEffect } from 'react';
import securityCameraIcon from '../assets/Icons/security-camera.png';
import routerIcon from '../assets/Icons/router.png';
import sensorIcon from '../assets/Icons/sensor.png';
import alarmIcon from '../assets/Icons/alarm.png';

const getIcon = (equipmentType) => {
  switch (equipmentType) {
    case 'camera':
      return { icon: <img src={securityCameraIcon} alt="" draggable={false} className="equipment-icon" /> };

    case 'router':
      return { icon: <img src={routerIcon} alt="" draggable={false} className="equipment-icon" /> };

    case 'sensor':
      return { icon: <img src={sensorIcon} alt="" draggable={false} className="equipment-icon" /> };

    case 'alarm':
      return { icon: <img src={alarmIcon} alt="" draggable={false} className="equipment-icon" /> };

    default:
      return { icon: <span className="equipment-icon">❓</span> };
  }
};

function Equipment({ deviceInstance, onSelect, onUpdatePlacement }) {
  const { id, type, x, y, rotation = 0 } = deviceInstance;
  const [livePos, setLivePos] = useState({ x, y });

  useEffect(() => {
    setLivePos({ x, y });
  }, [x, y]);

  const handlePointerDown = (e) => {
    e.stopPropagation();

    const startX = e.clientX - livePos.x;
    const startY = e.clientY - livePos.y;

    const handlePointerMove = (moveEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;

      setLivePos({ x: newX, y: newY });

      // Live update parent state
      onUpdatePlacement(id, { x: newX, y: newY });

      // Keep sidebar open and updating
      onSelect(id);
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
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      style={{
        left: livePos.x,
        top: livePos.y,
        position: 'absolute',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
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