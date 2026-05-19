import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { ColorPicker } from 'primereact/colorpicker';
import { useState, useRef, useEffect } from 'react';
import './AttributesBar.css';

function AttributesBar({
  selectedItem,
  onClose,
  onUpdateSettings,
  onChangeCameraModel,
  onDeleteEquipment,
}) {

  // -----------------------------
  // HOOKS MUST ALWAYS RUN FIRST
  // -----------------------------
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const swatchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        swatchRef.current &&
        !swatchRef.current.contains(e.target)
      ) {
        setShowPicker(false);
      }
    }
    if (showPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  // -----------------------------
  // CONDITIONAL RETURN MUST COME AFTER HOOKS
  // -----------------------------
  if (!selectedItem) return null;

  // -----------------------------
  // STATIC DATA
  // -----------------------------
  const presetColors = [
    "rgba(0, 150, 255, 0.3)",
    "rgba(255, 0, 0, 0.3)",
    "rgba(0, 255, 0, 0.3)",
    "rgba(255, 165, 0, 0.3)",
    "rgba(128, 0, 128, 0.3)",
    "rgba(255, 255, 0, 0.3)"
  ];

  // -----------------------------
  // COLOUR HELPERS
  // -----------------------------
  function rgbaToHex(rgba) {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return "#0096ff";
    const [_, r, g, b] = match;
    return (
      "#" +
      [r, g, b].map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      }).join("")
    );
  }

  function hexToRgba(hex, opacity) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  function stripOpacity(rgba) {
    return rgba.replace(/,?\s*[\d.]+\)$/,'') + ')';
  }

  const currentOpacity = selectedItem.fovOpacity ?? 0.3;
  const isPreset = presetColors.some(
    preset => stripOpacity(preset) === stripOpacity(selectedItem.fovColor)
  );

  const attrs = selectedItem.attributes ?? {};
  const isCamera = selectedItem.type === 'camera';
  const brandName = attrs.brand ?? '';
  const modelName = attrs.cameraModel ?? attrs.modelName ?? selectedItem.name ?? '';
  const costPerUnit = attrs.costPerUnit;
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

        {/* Equipment details */}
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
          {costPerUnit != null && (
            <div className="field">
              <label>Cost per unit</label>
              <div className="readonly-value">${costPerUnit}</div>
            </div>
          )}
        </div>

        {selectedItem.type === 'camera' && typeof onChangeCameraModel === 'function' && (
          <div className="attributes-change-model-section">
            <Button
              type="button"
              label="Change camera model"
              icon="pi pi-sync"
              outlined
              onClick={() => onChangeCameraModel(selectedItem)}
            />
          </div>
        )}

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
            <label>Name</label>
            <InputText
              value={selectedItem.name || ""}
              onChange={(e) => onUpdateSettings(selectedItem.id, "name", e.target.value)}
            />
          </div>

          {isCamera && (
            <div className="field">
              <label>Resolution</label>
              <InputText
                value={attrs.resolution ?? ''}
                onChange={(e) =>
                  onUpdateSettings(selectedItem.id, 'attributes', {
                    ...attrs,
                    resolution: e.target.value,
                  })
                }
              />
            </div>
          )}
        </div>

        {/* PLACEMENT */}
        <h3 className="section-subtitle">Placement</h3>
        <div className="section-box">
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

          {isCamera && (
            <>
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
                <label>Tilt (°)</label>
                <Slider
                  value={selectedItem.tilt || 0}
                  onChange={(e) => onUpdateSettings(selectedItem.id, "tilt", e.value)}
                  min={-90}
                  max={90}
                />
                <span className="slider-value">{selectedItem.tilt || 0}°</span>
              </div>
            </>
          )}
        </div>

        {isCamera && (
          <>
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

            {/* FOV APPEARANCE */}
            <h3 className="section-subtitle">FOV Appearance</h3>
            <div className="section-box">

              {/* PRESET COLOURS */}
              <div className="field">
                <label>Preset Colours</label>
                <div className="fov-swatches">
                  {presetColors.map((color, index) => (
                    <div
                      key={index}
                      className={`fov-swatch ${
                        stripOpacity(color) === stripOpacity(selectedItem.fovColor) ? "selected" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setShowPicker(false);
                        onUpdateSettings(selectedItem.id, "fovColor", color);
                      }}
                    />
                  ))}

                  {/* CUSTOM COLOUR SWATCH */}
                  <div
                    ref={swatchRef}
                    className={`fov-swatch custom ${!isPreset ? "selected" : ""}`}
                    style={{ backgroundColor: selectedItem.fovColor }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPicker(prev => !prev);
                    }}
                  >
                    <span className="edit-indicator">✎</span>
                  </div>
                </div>

                {/* INLINE PICKER */}
                {showPicker && (
                  <div ref={pickerRef} className="picker-inline">
                    <ColorPicker
                      value={rgbaToHex(selectedItem.fovColor)}
                      format="hex"
                      inline
                      onChange={(e) => {
                        const rgba = hexToRgba(e.value, currentOpacity);
                        onUpdateSettings(selectedItem.id, "fovColor", rgba);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* OPACITY */}
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

                    const hex = rgbaToHex(selectedItem.fovColor);
                    const rgba = hexToRgba(hex, newOpacity);
                    onUpdateSettings(selectedItem.id, "fovColor", rgba);
                  }}
                />
                <span className="slider-value">{currentOpacity.toFixed(2)}</span>
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
          </>
        )}

      </div>
    </Sidebar>
  );
}

export default AttributesBar;