import { Tooltip } from 'primereact/tooltip';
import securityCameraIcon from '../assets/Icons/security-camera.png';
import domeIcon from '../assets/Icons/Dome.png';
import routerIcon from '../assets/Icons/Router.png';
import sensorIcon from '../assets/Icons/Sensor.png';
import alarmIcon from '../assets/Icons/Alarm.png';

const renderImg = (src) => (
  <img src={src} alt="" draggable={false} className="equipment-icon" />
);

const CAMERA_TYPE_ICONS = {
  dome: domeIcon,
};

const ICONS = {
  camera: renderImg(securityCameraIcon),
  router: renderImg(routerIcon),
  sensor: renderImg(sensorIcon),
  alarm: renderImg(alarmIcon),
  nvr: <span className="equipment-icon equipment-icon--emoji">💾</span>,
  switch: <span className="equipment-icon equipment-icon--emoji">🔀</span>,
  'access point': <span className="equipment-icon equipment-icon--emoji">📡</span>,
};

const getIcon = (deviceInstance) => {
  if (deviceInstance?.customIcon) {
    return renderImg(deviceInstance.customIcon);
  }

  const type = String(deviceInstance?.type ?? '').toLowerCase().trim();

  if (type === 'camera') {
    const cameraType = String(deviceInstance?.attributes?.cameraType ?? '')
      .toLowerCase()
      .trim();
    const src = CAMERA_TYPE_ICONS[cameraType] ?? securityCameraIcon;
    return renderImg(src);
  }

  return ICONS[type] ?? <span className="equipment-icon equipment-icon--emoji">❓</span>;
};

function Equipment({ deviceInstance, onSelect, onUpdatePlacement }) {
  const { id, x, y, rotation = 0 } = deviceInstance;

  // Tooltip content
  const name = deviceInstance.name || deviceInstance.attributes?.cameraModel || 'Unnamed device';
  const type = deviceInstance.type || 'Unknown';
  const model = deviceInstance.attributes?.cameraModel || deviceInstance.attributes?.modelName || '—';
  const brand = deviceInstance.attributes?.brand || '';
  const resolution = deviceInstance.attributes?.resolution || '';

  const tooltipContent = `
Name: ${name}
Type: ${type}
Model: ${model}
${brand ? `Brand: ${brand}` : ''}
${resolution ? `Resolution: ${resolution}` : ''}
  `.trim();

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect(id);

    const offsetX = e.clientX - x;
    const offsetY = e.clientY - y;
    let isFirstMove = true;

    const handlePointerMove = (moveEvent) => {
      onUpdatePlacement(
        id,
        {
          x: moveEvent.clientX - offsetX,
          y: moveEvent.clientY - offsetY,
        },
        { commit: isFirstMove }
      );
      isFirstMove = false;
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <>
      <Tooltip target={`#equip-${id}`} content={tooltipContent} position="top" />

      <div
        id={`equip-${id}`}
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
          cursor: 'grab',
        }}
      >
        {getIcon(deviceInstance)}
      </div>
    </>
  );
}

export default Equipment;