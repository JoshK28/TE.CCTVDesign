import securityCameraIcon from '../assets/Icons/security-camera.png';
import domeIcon from '../assets/Icons/Dome.png';
import routerIcon from '../assets/Icons/Router.png';
import sensorIcon from '../assets/Icons/Sensor.png';
import alarmIcon from '../assets/Icons/Alarm.png';
import nvrIcon from '../assets/Icons/NVR.png';

import { getImagePoint } from '../utils/points';
import { DEFAULT_ICON_BACKGROUND_COLOR } from '../utils/placement';

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

/* Resolves the icon for a placement (custom icon > subtype > type). */
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
Equipment renders a single placed item on the floorplan.
Supports:
- click-to-select
- drag-to-move
- hover tooltip (merged FinalAngwik feature)
*/
function Equipment({
    deviceInstance,
    imageSize,
    onSelect,
    onUpdatePlacement,
    onMouseEnter,
    onMouseLeave
}) {
    const { id, x, y, rotation = 0 } = deviceInstance;

    const iconBackgroundColor =
        deviceInstance.iconBackgroundColor ?? DEFAULT_ICON_BACKGROUND_COLOR;

    /* Drag-to-move logic. */
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

    /* Hover tooltip data builder. */
    const handleHoverEnter = () => {
        if (!onMouseEnter) return;

        onMouseEnter({
            name: deviceInstance.name,
            model:
                deviceInstance.attributes?.cameraModel ||
                deviceInstance.attributes?.modelName,
            brand: deviceInstance.attributes?.brand,
            resolution: deviceInstance.attributes?.resolution,
            type: deviceInstance.type,
            fov: deviceInstance.fov,
            height: deviceInstance.attributes?.height,
        });
    };

    const handleHoverLeave = () => {
        if (onMouseLeave) onMouseLeave();
    };

    return (
        <div
            className="equipment"
            onPointerDown={handlePointerDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
            }}
            onMouseEnter={handleHoverEnter}
            onMouseLeave={handleHoverLeave}
            style={{
                left: imageSize?.naturalWidth
                    ? `${(x / imageSize.naturalWidth) * 100}%`
                    : x,
                top: imageSize?.naturalHeight
                    ? `${(y / imageSize.naturalHeight) * 100}%`
                    : y,
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
