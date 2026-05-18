import { MegaMenu } from 'primereact/megamenu';
import 'primeicons/primeicons.css';

import securityCameraIcon from '../assets/Icons/security-camera.png';

export default function Toolbar({ onSelectTool, onUndo, onRedo, canUndo, canRedo }) {

    const getIconFor = (label) => {
        switch (label) {
            case 'camera':
                return securityCameraIcon;
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
                style={{
                    padding: '0.75rem 1.25rem',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#212529',
                }}
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
                ) : item.label === 'device' ? (
                    <span className="pi pi-box" style={{ marginRight: '0.5rem' }}></span>
                ) : (
                    <span className="pi pi-question-circle" style={{ marginRight: '0.5rem' }}></span>
                )}
                {item.label}
            </div>
        );
    };

    const selectableItem = (item) => (
        <div
            onClick={() => onSelectTool(item.label)}
            style={{ padding: '0.75rem 1.25rem', cursor: 'pointer' }}
        >
            <span className="pi pi-bars" style={{ marginRight: '0.5rem' }}></span>
            {item.label}
        </div>
    );

    const items = [
        {
            label: 'New',
            icon: 'pi pi-plus',
            items: [[
                {
                    items: [
                        { label: 'camera', template: draggableItem },
                        { label: 'device', template: draggableItem }
                    ]
                }
            ]]
        },
        {
            label: 'Draw',
            icon: 'pi pi-pencil',
            items: [[
                { items: [{ label: 'wall', template: selectableItem }] }
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
        <div 
            className="card toolbar-card-override" 
            style={{ 
                background: '#212529', 
                borderRight: '1px solid #2d3238', 
                height: '100%',
            }}
        >
            <MegaMenu 
                model={items} 
                orientation="vertical" 
                style={{ 
                    background: 'transparent', 
                    border: 'none',
                    color: '#ffffff !inportant'
                }}
                // You can add global css class hooks to style inner items cleanly
                className="dark-dashboard-menu"
            />
        </div>
    );
}