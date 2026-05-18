import { MegaMenu } from 'primereact/megamenu';
import 'primeicons/primeicons.css';
import securityCameraIcon from '../assets/Icons/security-camera.png';

export default function Toolbar({ onSelectTool }) {

    const draggableItem = (item) => {
        const isCamera = item.label === 'camera';
        return (
            <div 
                draggable 
                onDragStart={(e) => {e.dataTransfer.setData('tool', item.label);}}
                onClick={()=> onSelectTool(item.label)}
                style={{ padding: '0.75rem 1.25rem', cursor: 'grab',
                background: '#212529',  }}
            >
                {isCamera ? (
                    <img src={securityCameraIcon} alt="" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                ) : (
                    <span className="pi pi-camera" style={{ marginRight: '0.5rem' }}></span>
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
                {items: [{label: 'camera', template: draggableItem},
                    {label: 'router', template: draggableItem},
                     {label: 'sensor', template: draggableItem},
                      {label: 'alarm', template: draggableItem}]}
                ]]
        },
        {
            label: 'Draw',
            icon: 'pi pi-pencil',
            items: [[
                { items: [{ label: 'wall', template: draggableItem }] }
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