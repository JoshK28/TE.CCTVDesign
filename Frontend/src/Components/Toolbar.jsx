import { MegaMenu } from 'primereact/megamenu';
import 'primeicons/primeicons.css';

import securityCameraIcon from '../assets/Icons/security-camera.png';
import routerIcon from '../assets/Icons/router.png';
import sensorIcon from '../assets/Icons/sensor.png';
import alarmIcon from '../assets/Icons/alarm.png';

export default function Toolbar({ onSelectTool, onUndo, onRedo, canUndo, canRedo }) {

    const getIconFor = (label) => {
        switch (label) {
            case 'camera':
                return securityCameraIcon;
            case 'router':
                return routerIcon;
            case 'sensor':
                return sensorIcon;
            case 'alarm':
                return alarmIcon;
            default:
                return null;
        }
    };

    const draggableItem = (item) => {
        const iconSrc = getIconFor(item.label);

        return (
            <div
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('tool', item.label); }}
                onClick={() => onSelectTool(item.label)}
                style={{ padding: '0.75rem 1.25rem', cursor: 'grab', display: 'flex', alignItems: 'center' }}
            >
                {iconSrc ? (
                    <img
                        src={iconSrc}
                        alt=""
                        draggable={false}
                        style={{
                            width: '22px',
                            height: '22px',
                            marginRight: '0.5rem',
                            verticalAlign: 'middle',
                            pointerEvents: 'none'
                        }}
                    />
                ) : (
                    <span className="pi pi-question-circle" style={{ marginRight: '0.5rem' }}></span>
                )}
                {item.label}
            </div>
        );
    };

    const items = [
        {
            label: 'New',
            icon: 'pi pi-plus',
            items: [[
                {
                    items: [
                        { label: 'camera', template: draggableItem },
                        { label: 'router', template: draggableItem },
                        { label: 'sensor', template: draggableItem },
                        { label: 'alarm', template: draggableItem }
                    ]
                }
            ]]
        },
        {
            label: 'Draw',
            icon: 'pi pi-pencil',
            items: [[
                { items: [{ label: 'wall', template: draggableItem }] }
            ]]
        },
        {
            label: 'Actions',
            icon: 'pi pi-history',
            items: [[
                {
                    items: [
                        {
                            label: 'Undo',
                            icon: 'pi pi-undo',
                            disabled: !canUndo,
                            command: onUndo
                        },
                        {
                            label: 'Redo',
                            icon: 'pi pi-refresh',
                            disabled: !canRedo,
                            command: onRedo
                        }
                    ]
                }
            ]]
        }
    ];

    return (
        <div className="card">
            <MegaMenu model={items} orientation="vertical" breakpoint="960px" />
        </div>
    );
}