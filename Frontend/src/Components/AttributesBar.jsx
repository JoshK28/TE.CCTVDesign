import { Sidebar } from 'primereact/sidebar';

const sectionStyle = { marginTop: '12px' };
const inputStyle = { width: '100%', marginTop: '4px', marginBottom: '8px' };

const numberOrEmpty = (value) => {
  if (value === '') return '';
  const parsed = Number(value);
  return Number.isNaN(parsed) ? '' : parsed;
};

export default function AttributesBar({
    selectedItem,
    onUpdateAttributes,
}) {
    const kindLabel = selectedItem ? (selectedItem.kind ?? selectedItem.type) : '';
    const attrs = selectedItem?.attributes ?? {};

    const updateAttr = (key, value) => {
        if (!selectedItem) return;
        onUpdateAttributes(selectedItem.id, { [key]: value });
    };

    const renderKindFields = () => {
        if (!selectedItem) return null;

        switch (kindLabel) {
            case 'camera':
                return (
                    <div style={sectionStyle}>
                        <label>Camera model</label>
                        <input
                            type="text"
                            value={attrs.cameraModel ?? ''}
                            onChange={(e) => updateAttr('cameraModel', e.target.value)}
                            style={inputStyle}
                        />
                        <label>FOV (degrees)</label>
                        <input
                            type="number"
                            value={attrs.fov ?? ''}
                            onChange={(e) => updateAttr('fov', numberOrEmpty(e.target.value))}
                            style={inputStyle}
                        />
                    </div>
                );
            case 'router':
                return (
                    <div style={sectionStyle}>
                        <label>Coverage radius (m)</label>
                        <input
                            type="number"
                            value={attrs.coverageRadius ?? ''}
                            onChange={(e) => updateAttr('coverageRadius', numberOrEmpty(e.target.value))}
                            style={inputStyle}
                        />
                        <label>Port count</label>
                        <input
                            type="number"
                            value={attrs.portCount ?? ''}
                            onChange={(e) => updateAttr('portCount', numberOrEmpty(e.target.value))}
                            style={inputStyle}
                        />
                    </div>
                );
            case 'sensor':
                return (
                    <div style={sectionStyle}>
                        <label>Sensor subtype</label>
                        <input
                            type="text"
                            value={attrs.sensorSubtype ?? ''}
                            onChange={(e) => updateAttr('sensorSubtype', e.target.value)}
                            style={inputStyle}
                        />
                        <label>Threshold</label>
                        <input
                            type="number"
                            value={attrs.threshold ?? ''}
                            onChange={(e) => updateAttr('threshold', numberOrEmpty(e.target.value))}
                            style={inputStyle}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            <Sidebar 
                visible={selectedItem !== undefined} 
                position="right" 
                onHide={() => {}}
                modal={false}
                style={{ width: '300px' }}
            >

                <h2>Properties</h2>
                
                {selectedItem ? (
                <div className="property-form">
                    <p><strong>{kindLabel} ID:</strong> {selectedItem.id}</p>
                    <p><strong>Kind:</strong> {kindLabel}</p>
                    <p><strong>Position:</strong> ({selectedItem.x}, {selectedItem.y})</p>
                    <div style={sectionStyle}>
                        <label>Label</label>
                        <input
                            type="text"
                            value={attrs.label ?? ''}
                            onChange={(e) => updateAttr('label', e.target.value)}
                            style={inputStyle}
                        />
                        <label>Notes</label>
                        <textarea
                            value={attrs.notes ?? ''}
                            onChange={(e) => updateAttr('notes', e.target.value)}
                            style={{ ...inputStyle, minHeight: '72px' }}
                        />
                    </div>
                    {renderKindFields()}
                </div>
                ) : (
                    <p>No item selected.</p>
                )}

                <hr />

                
            </Sidebar>
        </div>
       
    )
}