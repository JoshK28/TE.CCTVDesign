import { Sidebar } from 'primereact/sidebar';

export default function AttributesBar({ selectedItemId, equipment, onClose }) {

    const selectedItem = equipment.find(item => item.id === selectedItemId);

    return (
        <div>
            <Sidebar 
                visible={selectedItem !== undefined} 
                position="right" 
                onHide={onClose}
                modal={false}
                style={{ width: '300px' }}
            >

                <h2>Properties</h2>
                
                {selectedItem ? (
                <div className="property-form">
                    <p><strong>Editing Item ID:</strong> {selectedItem.id}</p>
                    <p>More settings coming soon...</p>
                </div>
                ) : (
                <p>Select an item to view its properties.</p>
                )}
            </Sidebar>
        </div>
       
    )
}