import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Slider } from 'primereact/slider';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { ColorPicker } from 'primereact/colorpicker';
import './AttributesBar.css';


function AttributesBar({ selectedItem, onClose, onUpdateSettings, onDeleteEquipment }) {
  if (!selectedItem) return null;

  const resolutions = [
    { label: "720p (HD)", value: "720p" },
    { label: "1080p (Full HD)", value: "1080p" },
    { label: "1440p (2K)", value: "1440p" },
    { label: "2160p (4K)", value: "2160p" }
  ];

  // -----------------------------
  // COLOUR CONVERSION HELPERS
  // -----------------------------
  function rgbaToHex(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return "#0096ff";
    const [_, r, g, b] = match;
    return (
      "#" +
      [r, g, b]
        .map(x => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  function hexToRgba(hex, opacity) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  const currentOpacity = selectedItem.fovOpacity ?? 0.3;
  const attrs = selectedItem.attributes ?? {};
  const brandName = attrs.brand ?? '';
  const modelName = attrs.cameraModel ?? selectedItem.name ?? '';

  const propertiesTitle = `${selectedItem.type ?? ''} properties`;

  return (
    <Sidebar
      visible={!!selectedItem}
      position="right"
      onHide={onClose}
      modal={false}
      showCloseIcon={true}
      dismissable={false}
      style={{ width: '380px' }}
    >
      <div className="sidebar-content">
        <h2 className="section-title">{propertiesTitle}</h2>

        <h3 className="section-subtitle">Equipment details</h3>
        <div className="section-box">
          <div className="field">
            <label>Brand name</label>
            <div className="readonly-value">{brandName || '—'}</div>
          </div>
          <div className="field">
            <label>Model name</label>
            <div className="readonly-value">{modelName || '—'}</div>
          </div>
        </div>

        
        
        {onDeleteEquipment && (
          <div className="attributes-delete-section">
            <Button
              type="button"
              label="Delete equipment"
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={() => {
                if (window.confirm('Remove this equipment from the layout?')) {
                  onDeleteEquipment(selectedItem.id);
                }
              }}
            />
          </div>
        )}


        {/* GENERAL */}
        <h3 className="section-subtitle">General</h3>
        <div className="section-box">

          <div className="field">
            <label>Camera Name</label>
            <InputText
              value={selectedItem.name || ""}
              onChange={(e) => onUpdateSettings(selectedItem.id, "name", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Resolution</label>
            <Dropdown
              value={selectedItem.resolution || "1080p"}
              options={resolutions}
              onChange={(e) => onUpdateSettings(selectedItem.id, "resolution", e.value)}
            />
          </div>

        </div>

        {/* LENS */}
        <h3 className="section-subtitle">Lens & Optics</h3>
        <div className="section-box">

          <div className="field">
            <label>Focal Length (mm)</label>
            <InputNumber
              value={selectedItem.focalLength || 2.8}
              onValueChange={(e) => onUpdateSettings(selectedItem.id, "focalLength", e.value)}
              min={1}
              max={50}
            />
          </div>

        </div>

        
        <h3 className="section-subtitle">FOV Appearance</h3>
        <div className="section-box">

          <div className="field">
            <label>FOV Colour</label>
            <ColorPicker
              value={rgbaToHex(selectedItem.fovColor)}
              format="hex"
              onChange={(e) => {
                const rgba = hexToRgba(e.value, currentOpacity);
                onUpdateSettings(selectedItem.id, "fovColor", rgba);
              }}
            />
          </div>

          <div className="field slider-field">
            <label>Opacity</label>
            <Slider
              value={currentOpacity}
              min={0.05}
              max={1}
              step={0.05}
              onChange={(e) => {
                const newOpacity = e.value;
                onUpdateSettings(selectedItem.id, "fovOpacity", newOpacity);

                // Rebuild RGBA with new opacity
                const hex = rgbaToHex(selectedItem.fovColor);
                const rgba = hexToRgba(hex, newOpacity);
                onUpdateSettings(selectedItem.id, "fovColor", rgba);
              }}
            />
            <span className="slider-value">{currentOpacity.toFixed(2)}</span>
          </div>

        </div>

        {/* PHYSICAL */}
        <h3 className="section-subtitle">Physical</h3>
        <div className="section-box">

          <div className="field">
            <label>Camera Height (m)</label>
            <InputNumber
              value={selectedItem.height || 3}
              onValueChange={(e) => onUpdateSettings(selectedItem.id, "height", e.value)}
              min={1}
              max={20}
            />
          </div>

          <div className="field slider-field">
            <label>Rotation (°)</label>
            <Slider
              value={selectedItem.rotation || 0}
              onChange={(e) => onUpdateSettings(selectedItem.id, "rotation", e.value)}
              min={0}
              max={360}
            />
            <span className="slider-value">{selectedItem.rotation || 0}°</span>
          </div>

          <div className="field slider-field">
            <label>Tilt (°)</label>
            <Slider
              value={selectedItem.tilt || 0}
              onChange={(e) => onUpdateSettings(selectedItem.id, "tilt", e.value)}
              min={-90}
              max={90}
            />
            <span className="slider-value">{selectedItem.tilt || 0}°</span>
          </div>

        </div>

        {/* IR */}
        <h3 className="section-subtitle">Infrared</h3>
        <div className="section-box">

          <div className="field">
            <label>IR Range (m)</label>
            <InputNumber
              value={selectedItem.irRange || 30}
              onValueChange={(e) => onUpdateSettings(selectedItem.id, "irRange", e.value)}
              min={0}
              max={200}
            />
          </div>

        </div>
      </div>
    </Sidebar>
  );
}

export default AttributesBar;