import { Sidebar } from 'primereact/sidebar';

export default function AttributesBar({ selectedItemId, equipment}) {

    const selectedItem = equipment.find(item => item.id === selectedItemId);

    return (
        <div>
            <Sidebar 
                visible={selectedItem !== undefined} 
                position="right" 
                
                modal={false}
                style={{ width: '300px' }}
            >

                <h2>Properties</h2>
                
                {selectedItem ? (
                <div className="property-form">
                    <p><strong> {selectedItem.type} ID:</strong> {selectedItem.id}</p>
                    <p><strong> {selectedItem.type} Type:</strong> {selectedItem.type}</p>
                    <p><strong> {selectedItem.type} Position:</strong> ({selectedItem.x}, {selectedItem.y})</p>
                    <p>More settings coming soon...</p>
                </div>
                ) : (
                <p>Select an item to view its properties.</p>
                )}
            </Sidebar>
        </div>
       
    )
}