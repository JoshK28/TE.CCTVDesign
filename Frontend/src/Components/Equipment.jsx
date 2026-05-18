import securityCameraIcon from '../assets/Icons/security-camera.png';

const ICONS = {
  camera: <img src={securityCameraIcon} alt="" draggable={false} />,
  router: '📶',
  sensor: '📡',
  alarm: '🔔',
  nvr: '💾',
  switch: '🔀',
  'access point': '📡',
};

const getIcon = (equipmentType) =>
  ICONS[String(equipmentType ?? '').toLowerCase().trim()] ?? '❓';

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
