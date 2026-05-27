import securityCameraIcon from '../assets/Icons/security-camera.png';
import domeIcon from '../assets/Icons/Dome.png';
import routerIcon from '../assets/Icons/Router.png';
import sensorIcon from '../assets/Icons/Sensor.png';
import alarmIcon from '../assets/Icons/Alarm.png';
import { getImagePoint } from '../utils/points';

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

export default function Equipment({
  deviceInstance,
  imageSize,
  onSelect,
  onUpdatePlacement,
  onMouseEnter,
  onMouseLeave
}) {
  const { id, x, y, rotation = 0 } = deviceInstance;

  // Build tooltip content (clean, structured)
  const tooltipContent = {
    name:
      deviceInstance.name ||
      deviceInstance.attributes?.cameraModel ||
      deviceInstance.attributes?.modelName ||
      'Unnamed device',
    type: deviceInstance.type || 'Unknown',
    model:
      deviceInstance.attributes?.cameraModel ||
      deviceInstance.attributes?.modelName ||
      '—',
    brand: deviceInstance.attributes?.brand || '—',
    resolution: deviceInstance.attributes?.resolution || '—'
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect(id);

    const stage = e.currentTarget.parentElement;
    const startPoint = getImagePoint(e, stage, imageSize);
    const offsetX = startPoint.x - x;
    const offsetY = startPoint.y - y;
    let isFirstMove = true;

    const handlePointerMove = (moveEvent) => {
      const point = getImagePoint(moveEvent, stage, imageSize);
      onUpdatePlacement(
        id,
        {
          x: point.x - offsetX,
          y: point.y - offsetY,
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
    <div
      id={`equip-${id}`}
      className="equipment"
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onMouseEnter={() => onMouseEnter(tooltipContent)}
      onMouseLeave={onMouseLeave}
      style={{
        left: imageSize?.naturalWidth ? `${(x / imageSize.naturalWidth) * 100}%` : x,
        top: imageSize?.naturalHeight ? `${(y / imageSize.naturalHeight) * 100}%` : y,
        position: 'absolute',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        userSelect: 'none',
        cursor: 'grab',
      }}
    >
      {getIcon(deviceInstance)}
    </div>
  );
}