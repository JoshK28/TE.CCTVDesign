import React from 'react'; 
import { Menu } from 'primereact/menu';
import { MegaMenu } from 'primereact/megamenu';
import 'primeicons/primeicons.css';

export default function Toolbar(onSelectTool) {
    const items = [
        {
            label: 'New',
            icon: 'pi pi-plus',
            items: [[
                {items: [{label: 'Camera', command : () => onSelectTool('camera')}, {label: 'Sensor', command : () => onSelectTool('sensor')}, {label: 'Alarm', command : () => onSelectTool('alarm')   }]}
                ]]
        },
        {
            label: 'Draw',
            icon: 'pi pi-pencil'
        }
    ];

    return (
        <div className="card">
            <MegaMenu model={items} orientation="vertical" breakpoint="960px" />
        </div>
    )
}