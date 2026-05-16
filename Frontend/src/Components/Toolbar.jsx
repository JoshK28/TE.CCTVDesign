import { MegaMenu } from 'primereact/megamenu';
import 'primeicons/primeicons.css';
import securityCameraIcon from '../assets/Icons/security-camera.png';

export default function Toolbar({ onArmTool }) {
  const draggableItem = (item) => {
    const isCamera = item.label === 'camera';
    const isDevice = item.label === 'device';
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('tool', item.label);
          onArmTool(item.label);
        }}
        onClick={() => onArmTool(item.label)}
        style={{ padding: '0.75rem 1.25rem', cursor: 'grab' }}
      >
        {isCamera ? (
          <img src={securityCameraIcon} alt="" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        ) : isDevice ? (
          <span className="pi pi-box" style={{ marginRight: '0.5rem' }}></span>
        ) : (
          <span className="pi pi-camera" style={{ marginRight: '0.5rem' }}></span>
        )}
        {item.label}
      </div>
    );
  };

  const selectableItem = (item) => (
    <div onClick={() => onArmTool(item.label)} style={{ padding: '0.75rem 1.25rem', cursor: 'pointer' }}>
      <span className="pi pi-bars" style={{ marginRight: '0.5rem' }}></span>
      {item.label}
    </div>
  );

  const items = [
    {
      label: 'New',
      icon: 'pi pi-plus',
      items: [[{ items: [{ label: 'camera', template: draggableItem }, { label: 'device', template: draggableItem }] }]],
    },
    {
      label: 'Draw',
      icon: 'pi pi-pencil',
      items: [[{ items: [{ label: 'wall', template: selectableItem }] }]],
    },
  ];

  return (
    <div className="card">
      <MegaMenu model={items} orientation="vertical" breakpoint="960px" />
    </div>
  );
}
