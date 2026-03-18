import React from 'react'; 
import { Menu } from 'primereact/menu';
import { MegaMenu } from 'primereact/megamenu';
import 'primeicons/primeicons.css';

export default function Toolbar() {
    const items = [
        {
            label: 'New',
            icon: 'pi pi-plus',
            items: [{label: 'Camera'}, {label: 'Sensor'}, {label: 'Alarm'}]}
    ];

    return (
        <div className="card">
            <MegaMenu model={items} orientation="vertical" breakpoint="960px" />
        </div>
    )
}