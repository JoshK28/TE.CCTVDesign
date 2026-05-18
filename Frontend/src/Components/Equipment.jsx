import securityCameraIcon from '../assets/Icons/security-camera.png';
import routerIcon from '../assets/Icons/Router.png';
import sensorIcon from '../assets/Icons/Sensor.png';
import alarmIcon from '../assets/Icons/Alarm.png';

const ICONS = {
  camera: <img src={securityCameraIcon} alt="" draggable={false} className="equipment-icon" />,
  router: <img src={routerIcon} alt="" draggable={false} className="equipment-icon" />,
  sensor: <img src={sensorIcon} alt="" draggable={false} className="equipment-icon" />,
  alarm: <img src={alarmIcon} alt="" draggable={false} className="equipment-icon" />,
  nvr: '💾',
  switch: '🔀',
  'access point': '📡',
};

const getIcon = (equipmentType) =>
  ICONS[String(equipmentType ?? '').toLowerCase().trim()] ?? <span className="equipment-icon">❓</span>;

function Equipment({ deviceInstance, onSelect, onUpdatePlacement }) {
  const { id, type, x, y, rotation = 0 } = deviceInstance;

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect(id);

    const offsetX = e.clientX - x;
    const offsetY = e.clientY - y;

    const handlePointerMove = (moveEvent) => {
      onUpdatePlacement(id, {
        x: moveEvent.clientX - offsetX,
        y: moveEvent.clientY - offsetY,
      });
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
        left: x,
        top: y,
        position: 'absolute',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        userSelect: 'none',
        fontSize: '24px',
        cursor: 'grab',
      }}
    >
      {getIcon(type)}
    </div>
  );
}

export default Equipment;
