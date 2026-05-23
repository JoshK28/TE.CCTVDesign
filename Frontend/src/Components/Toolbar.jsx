import { MegaMenu } from 'primereact/megamenu';
import 'primeicons/primeicons.css';

import securityCameraIcon from '../assets/Icons/security-camera.png';

export default function Toolbar({ onSelectTool }) {

    const getIconFor = (label) => {
        switch (label) {
            case 'camera':
                return securityCameraIcon;

            case 'device':
                return 'pi pi-box';

            case 'wall':
                return 'pi pi-minus';

            case 'measure':
                return 'pi pi-arrows-h';

            case 'Scale Calibration':  
                return 'pi pi-sliders-v';

            case 'Image Settings':      
                return 'pi pi-cog';

            default:
                return null;
        }
    };

    const draggableItem = (item) => {
        const iconSrc = getIconFor(item.label);
        const isImage = iconSrc && !iconSrc.startsWith('pi ');

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
                    color: '#ffffff'
                }}
            >
                {isImage ? (
                    <img
                        src={iconSrc}
                        alt=""
                        draggable={false}
                        style={{
                            width: '22px',
                            height: '22px',
                            marginRight: '0.5rem',
                            pointerEvents: 'none'
                        }}
                    />
                ) : iconSrc ? (
                    <span className={iconSrc} style={{ marginRight: '0.5rem', color: '#ffffff' }}></span>
                ) : (
                    <span className="pi pi-question-circle" style={{ marginRight: '0.5rem', color: '#ffffff' }}></span>
                )}
                {item.label}
            </div>
        );
    };

    const selectableItem = (item) => {
        const iconClass = getIconFor(item.label);
        const isPrimeIcon = iconClass && iconClass.startsWith('pi ');

        return (
            <div
                onClick={() => onSelectTool(item.label)}
                style={{
                    padding: '0.75rem 1.25rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#ffffff'
                }}
            >
                {isPrimeIcon ? (
                    <span className={iconClass} style={{ marginRight: '0.5rem', color: '#ffffff' }}></span>
                ) : (
                    <span className="pi pi-bars" style={{ marginRight: '0.5rem', color: '#ffffff' }}></span>
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
            label: 'Tools',
            icon: 'pi pi-wrench',
            items: [[
                {
                    items: [
                        { label: 'measure', template: selectableItem },
                        { label: 'Scale Calibration', template: selectableItem } // NEW
                    ]
                }
            ]]
        },
        {
            label: 'Image',
            icon: 'pi pi-image',
            items: [[
                {
                    items: [
                        { label: 'Image Settings', template: selectableItem } // NEW
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
                    color: '#ffffff'
                }}
                className="dark-dashboard-menu"
            />
        </div>
    );
}