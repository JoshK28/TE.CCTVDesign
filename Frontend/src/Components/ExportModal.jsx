import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ToggleButton } from 'primereact/togglebutton';
import { SelectButton } from 'primereact/selectbutton';
import { Checkbox } from 'primereact/checkbox';
import defaultLogo from '../assets/logo.png';

export default function ExportModal({ visible, floorLayouts = [], currentLayerId, onHide, onConfirmExport }) {
  const [companyName, setCompanyName] = useState('My Security Firm');
  const [projectTitle, setProjectTitle] = useState('Site Security Blueprint');
  const [exportType, setExportType] = useState('pdf'); 
  const [orientation, setOrientation] = useState('landscape'); 
  
  const [showFov, setShowFov] = useState(true);
  const [showWalls, setShowWalls] = useState(true);
  const [showEquipment, setShowEquipment] = useState(true);
  const [logoPreview, setLogoPreview] = useState(defaultLogo);

  // Floating Parameter Option States
  const [overlayPosition, setOverlayPosition] = useState('top-left');
  const [overlaySize, setOverlaySize] = useState('medium');
  const [selectedLayerIds, setSelectedLayerIds] = useState([]);

  const fileInputRef = useRef(null);

  // Auto-check the currently active workspace layer on open
  useEffect(() => {
    if (visible && currentLayerId) {
      setSelectedLayerIds([currentLayerId]);
    }
  }, [visible, currentLayerId]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLayerCheckboxChange = (id, checked) => {
    if (checked) {
      setSelectedLayerIds((prev) => [...prev, id]);
    } else {
      setSelectedLayerIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleExportSubmit = () => {
    onConfirmExport({
      exportType,
      orientation,
      showFov,
      showWalls,
      showEquipment,
      selectedLayerIds,
      branding: {
        companyName,
        projectTitle,
        logo: logoPreview,
        position: overlayPosition, 
        size: overlaySize          
      }
    });
  };

  const positionOptions = [
    { label: '↖️ Top Left', value: 'top-left' },
    { label: '↗️ Top Right', value: 'top-right' },
    { label: '↙️ Bottom Left', value: 'bottom-left' },
    { label: '↘️ Bottom Right', value: 'bottom-right' }
  ];

  const sizeOptions = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' }
  ];

  return (
    <Dialog 
      header="📤 Export Configurations" 
      visible={visible} 
      style={{ width: '520px' }} 
      onHide={onHide}
      modal
      headerStyle={{ background: '#212529', color: '#ffffff', padding: '1.25rem' }}
      contentStyle={{ background: '#ffffff', padding: '1.5rem' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Export Target Type Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Export Format</label>
            <SelectButton value={exportType} options={[{ label: 'PDF Report', value: 'pdf' }, { label: 'PNG Image', value: 'png' }]} onChange={(e) => e.value && setExportType(e.value)} />
          </div>
          {exportType === 'pdf' && (
            <div>
              <label style={labelStyle}>Orientation</label>
              <SelectButton value={orientation} options={[{ label: 'Landscape', value: 'landscape' }, { label: 'Portrait', value: 'portrait' }]} onChange={(e) => e.value && setOrientation(e.value)} />
            </div>
          )}
        </div>

        {/* TARGET LAYERS FILTER SELECTION BOX */}
        {floorLayouts.length > 0 && (
          <div>
            <label style={labelStyle}>Select Layout Layers to Include</label>
            <div style={{ background: '#f8fafc', border: '1px solid #ced4da', borderRadius: '4px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '120px', overflowY: 'auto' }}>
              {floorLayouts.map((layout) => (
                <div key={layout.floorID} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Checkbox 
                    inputId={`layer-${layout.floorID}`} 
                    checked={selectedLayerIds.includes(layout.floorID)} 
                    onChange={(e) => handleLayerCheckboxChange(layout.floorID, e.checked)} 
                  />
                  {/* 💡 FIXED: Explicit type conversion to string avoids crashes with numerical IDs */}
                  <label htmlFor={`layer-${layout.floorID}`} style={{ fontSize: '13px', color: '#333', cursor: 'pointer' }}>
                    Layer {layout.layer} (ID: {String(layout.floorID)})
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #dee2e6' }} />

        {/* Visibility Layer Toggles */}
        <div>
          <label style={labelStyle}>Include Elements</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <ToggleButton onLabel="FOV On" offLabel="FOV Off" checked={showFov} onChange={(e) => setShowFov(e.value)} />
            <ToggleButton onLabel="Walls On" offLabel="Walls Off" checked={showWalls} onChange={(e) => setShowWalls(e.value)} />
            <ToggleButton onLabel="Nodes On" offLabel="Nodes Off" checked={showEquipment} onChange={(e) => setShowEquipment(e.value)} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid #dee2e6' }} />

        {/* Custom Branding Specification fields */}
        <div>
          <label style={{ ...labelStyle, color: '#245d91' }}>🎨 Floating Branding Configurations</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon"><i className="pi pi-building"></i></span>
              <InputText placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="p-inputgroup">
              <span className="p-inputgroup-addon"><i className="pi pi-file"></i></span>
              <InputText placeholder="Project Title" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
            </div>

            {/* LOGO UPLOAD & FLOATING CONTROLS SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px' }}>Badge Position</label>
                <SelectButton value={overlayPosition} options={positionOptions} onChange={(e) => e.value && setOverlayPosition(e.value)} style={{ transform: 'scale(0.9)', transformOrigin: 'left center' }} />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px' }}>Badge Sizing scale</label>
                <SelectButton value={overlaySize} options={sizeOptions} onChange={(e) => e.value && setOverlaySize(e.value)} style={{ transform: 'scale(0.9)', transformOrigin: 'left center' }} />
              </div>
            </div>

            <div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoChange} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}>
                <Button type="button" label="Upload Custom Logo" icon="pi pi-upload" className="p-button-outlined p-button-sm" onClick={() => fileInputRef.current?.click()} style={{ width: 'auto', color: '#245d91', borderColor: '#245d91' }} />
                {logoPreview && <img src={logoPreview} alt="Preview" style={{ height: '24px', marginLeft: 'auto', objectFit: 'contain' }} />}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Controls Row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
          <Button type="button" label="Cancel" className="p-button-text" onClick={onHide} style={{ color: '#6c757d', fontWeight: '600' }} />
          <Button type="button" label="Run Export Processing" icon="pi pi-download" onClick={handleExportSubmit} style={{ backgroundColor: '#245d91', borderColor: '#245d91', fontWeight: '600' }} />
        </div>

      </div>
    </Dialog>
  );
}

const labelStyle = { fontWeight: '600', color: '#343a40', display: 'block', marginBottom: '0.3rem', fontSize: '13px' };