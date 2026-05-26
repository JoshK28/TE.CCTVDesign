import securityCameraIcon from '../assets/Icons/security-camera.png';
import domeIcon from '../assets/Icons/Dome.png';
import routerIcon from '../assets/Icons/Router.png';
import sensorIcon from '../assets/Icons/Sensor.png';
import alarmIcon from '../assets/Icons/Alarm.png';
import nvrIcon from '../assets/Icons/NVR.png';
import { getImagePoint } from '../utils/points';

const DEFAULT_ICON_BACKGROUND_COLOR = '#ffffff';

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
  nvr: renderImg(nvrIcon),
  switch: <span className="equipment-icon equipment-icon--emoji">🔀</span>,
  'access point': <span className="equipment-icon equipment-icon--emoji">📡</span>,
};

// Resolves the icon to render for a placement: a user-uploaded custom icon
// wins, otherwise the icon is chosen from the type (or camera subtype) with
// a generic "?" emoji as a last-resort fallback.
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

/*
Equipment renders a single placed item (camera or device) on top of the
floor-plan image. It positions itself in image-coordinate space (percentages
of the image's natural size so placements stay correct on resize), supports
click-to-select and drag-to-move, and delegates state updates back to the
parent via onSelect / onUpdatePlacement.
*/
function Equipment({ deviceInstance, imageSize, onSelect, onUpdatePlacement }) {
  const { id, x, y, rotation = 0 } = deviceInstance;
  const iconBackgroundColor =
    deviceInstance.iconBackgroundColor ?? DEFAULT_ICON_BACKGROUND_COLOR;

  // Start a drag: select this item, then track pointer movement against the
  // parent stage and patch x/y as the user drags. Only the first patch is
  // committed to the undo stack so an entire drag becomes one undo step.
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
      className="equipment"
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      style={{
        left: imageSize?.naturalWidth ? `${(x / imageSize.naturalWidth) * 100}%` : x,
        top: imageSize?.naturalHeight ? `${(y / imageSize.naturalHeight) * 100}%` : y,
        position: 'absolute',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        userSelect: 'none',
        cursor: 'grab',
      }}
    >
      <div
        className="equipment-icon-background"
        style={{ backgroundColor: iconBackgroundColor }}
      >
        {getIcon(deviceInstance)}
      </div>
    </div>
  );
}

export default Equipment;
