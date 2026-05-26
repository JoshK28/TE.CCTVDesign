import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Slider } from 'primereact/slider';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { ColorPicker } from 'primereact/colorpicker';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { TabView, TabPanel } from 'primereact/tabview';
import { useState, useRef, useEffect } from 'react';

import './AttributesBar.css';

const DEFAULT_FOV_COLOR = '#0096ff';
const DEFAULT_FOV_OPACITY = 0.3;
const MAX_ICON_BYTES = 1_000_000;
const ALLOWED_ICON_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'];
const PRESET_COLORS = ['#0096ff', '#ff0000', '#00ff00', '#ffa500', '#800080', '#ffff00'];
const DEVICE_SPECIFICATION_FIELDS = [
  { field: 'maxResolutionMp', label: 'Max Resolution', unit: 'MP' },
  { field: 'channelCount', label: 'Number of Channels' },
  { field: 'inputBandwidthMbps', label: 'Input Bandwidth', unit: 'Mbps' },
  { field: 'outputBandwidthMbps', label: 'Output Bandwidth', unit: 'Mbps' },
];

function formatPropertiesTitle(type) {
  return type ? `${type.charAt(0).toUpperCase()}${type.slice(1)} properties` : 'Properties';
}

function AttributesBar({
  selectedItem,
  onClose,
  onUpdateSettings,
  onChangeModel,
  onDeleteEquipment,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [iconError, setIconError] = useState('');

  const pickerRef = useRef(null);
  const swatchRef = useRef(null);
  const iconInputRef = useRef(null);

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
    if (showPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  useEffect(() => {
    setActiveTab(0);
    setShowPicker(false);
    setIconError('');
  }, [selectedItem?.id]);

  if (!selectedItem) return null;

  const currentFovColor = selectedItem.fovColor ?? DEFAULT_FOV_COLOR;
  const currentOpacity = selectedItem.fovOpacity ?? DEFAULT_FOV_OPACITY;
  const isPreset = PRESET_COLORS.includes(currentFovColor);

  function handleIconUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!ALLOWED_ICON_TYPES.includes(file.type)) {
      setIconError('Unsupported file type. Use PNG, JPG, SVG, WEBP, or GIF.');
      return;
    }

    if (file.size > MAX_ICON_BYTES) {
      setIconError('Image is too large. Please choose a file under 1 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setIconError('');
      updateSetting('customIcon', reader.result);
    };
    reader.onerror = () => setIconError('Failed to read the selected file.');
    reader.readAsDataURL(file);
  }

  function handleResetIcon() {
    setIconError('');
    updateSetting('customIcon', null);
  }

  const attrs = selectedItem.attributes ?? {};
  const isCamera = selectedItem.type === 'camera';
  const isDevice = !isCamera;
  const brandName = attrs.brand ?? '';
  const modelName =
    attrs.cameraModel ?? attrs.modelName ?? selectedItem.name ?? '';
  const costPerUnit = attrs.costPerUnit;
  const propertiesTitle = formatPropertiesTitle(selectedItem.type ?? '');
  const deviceSpecifications = attrs.deviceSpecifications ?? {};

  function updateSetting(field, value) {
    onUpdateSettings(selectedItem.id, field, value);
  }

  function updateAttributes(updates) {
    updateSetting('attributes', { ...attrs, ...updates });
  }

  function updateDeviceSpecification(field, value) {
    updateAttributes({
      deviceSpecifications: {
        ...deviceSpecifications,
        [field]: value ?? 0,
      },
    });
  }

  const sensorOptions = [
    { label: '1/3"', value: '1/3' },
    { label: '1/2.8"', value: '1/2.8' },
    { label: '1/2.7"', value: '1/2.7' },
    { label: '1/2"', value: '1/2' },
    { label: '2/3"', value: '2/3' },
    { label: '1"', value: '1' },
  ];

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

        <TabView
          className="attributes-tabview"
          scrollable
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
        >
          <TabPanel header="Settings" leftIcon="pi pi-cog mr-2">

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

            {onChangeModel && (
              <div className="attributes-change-model-section">
                <Button
                  type="button"
                  label="Change model"
                  icon="pi pi-sync"
                  outlined
                  onClick={() => onChangeModel(selectedItem)}
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
                    if (
                      window.confirm('Remove this equipment from the layout?')
                    ) {
                      onDeleteEquipment(selectedItem.id);
                    }
                  }}
                />
              </div>
            )}

            <h3 className="section-subtitle">General</h3>
            <div className="section-box">
              <div className="field">
                <label>Name</label>
                <InputText
                  value={selectedItem.name || ''}
                  onChange={(e) => updateSetting('name', e.target.value)}
                />
              </div>

              {isCamera && (
                <div className="field">
                  <label>Resolution</label>
                  <InputText
                    value={attrs.resolution ?? ''}
                    onChange={(e) => updateAttributes({ resolution: e.target.value })}
                  />
                </div>
              )}
            </div>

            {isCamera && (
              <>
                <h3 className="section-subtitle">Placement</h3>
                <div className="section-box">
                  <div className="field slider-field">
                    <label>Rotation (°)</label>
                    <Slider
                      value={selectedItem.rotation || 0}
                      onChange={(e) => updateSetting('rotation', e.value)}
                      min={0}
                      max={360}
                    />
                    <span className="slider-value">
                      {selectedItem.rotation || 0}°
                    </span>
                  </div>

                  <div className="field">
                    <label>Camera Height (m)</label>
                    <InputNumber
                      value={selectedItem.height || 3}
                      onValueChange={(e) => updateSetting('height', e.value)}
                      min={1}
                      max={20}
                    />
                  </div>

                  <div className="field slider-field">
                    <label>Tilt (°)</label>
                    <Slider
                      value={selectedItem.tilt || 0}
                      onChange={(e) => updateSetting('tilt', e.value)}
                      min={-90}
                      max={90}
                    />
                    <span className="slider-value">
                      {selectedItem.tilt || 0}°
                    </span>
                  </div>
                </div>

                <h3 className="section-subtitle">Lens & Optics</h3>
                <div className="section-box">
                  <div className="field">
                    <label>Focal Length (mm)</label>
                    <InputNumber
                      value={selectedItem.focalLength || 2.8}
                      onValueChange={(e) => updateSetting('focalLength', e.value)}
                      min={1}
                      max={50}
                    />
                  </div>

                  <div className="field">
                    <label>Sensor Type</label>
                    <Dropdown
                      value={selectedItem.sensorType || '1/2.8'}
                      options={sensorOptions}
                      onChange={(e) =>
                        onUpdateSettings(
                          selectedItem.id,
                          'sensorType',
                          e.value
                        )
                      }
                      placeholder="Select sensor size"
                    />
                  </div>

                  <div className="field">
                    <label>Corridor Mode</label>
                    <InputSwitch
                      checked={selectedItem.corridorMode || false}
                      onChange={(e) =>
                        onUpdateSettings(
                          selectedItem.id,
                          'corridorMode',
                          e.value
                        )
                      }
                    />
                  </div>
                </div>

                <h3 className="section-subtitle">Infrared</h3>
                <div className="section-box">
                  <div className="field">
                    <label>IR Range (m)</label>
                    <InputNumber
                      value={selectedItem.irRange || 30}
                      onValueChange={(e) => updateSetting('irRange', e.value)}
                      min={0}
                      max={200}
                    />
                  </div>
                </div>
              </>
            )}
          </TabPanel>

          {isDevice && (
            <TabPanel header="Specifications" leftIcon="pi pi-list-check mr-2">
              <div className="section-box device-specifications-card">
                <div className="device-specifications-header">
                  <i className="pi pi-cog device-specifications-icon" aria-hidden />
                  <div>
                    <h3>Basic Specifications</h3>
                    <p>Core device specifications and capabilities</p>
                  </div>
                </div>

                {DEVICE_SPECIFICATION_FIELDS.map(({ field, label, unit }) => (
                  <div className="field" key={field}>
                    <label>{label}</label>
                    {unit ? (
                      <div className="specification-input-row">
                        <InputNumber
                          value={deviceSpecifications[field] ?? 0}
                          onValueChange={(e) => updateDeviceSpecification(field, e.value)}
                          min={0}
                          useGrouping={false}
                        />
                        <span className="specification-unit">{unit}</span>
                      </div>
                    ) : (
                      <InputNumber
                        value={deviceSpecifications[field] ?? 0}
                        onValueChange={(e) => updateDeviceSpecification(field, e.value)}
                        min={0}
                        useGrouping={false}
                      />
                    )}
                  </div>
                ))}
              </div>
            </TabPanel>
          )}

          <TabPanel header="Appearance" leftIcon="pi pi-palette mr-2">
            {isCamera && (
              <>
                <h3 className="section-subtitle">FOV Appearance</h3>
                <div className="section-box">
                  <div className="field">
                    <label>Preset Colours</label>
                    <div className="fov-swatches">
                      {PRESET_COLORS.map((color, index) => (
                        <div
                          key={index}
                          className={`fov-swatch ${color === currentFovColor ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setShowPicker(false);
                            updateSetting('fovColor', color);
                          }}
                        />
                      ))}

                      <div
                        ref={swatchRef}
                        className={`fov-swatch custom ${!isPreset ? 'selected' : ''}`}
                        style={{ backgroundColor: currentFovColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPicker((prev) => !prev);
                        }}
                      >
                        <span className="edit-indicator">✎</span>
                      </div>
                    </div>

                    {showPicker && (
                      <div ref={pickerRef} className="picker-inline">
                        <ColorPicker
                          value={currentFovColor}
                          format="hex"
                          inline
                          onChange={(e) => {
                            updateSetting('fovColor', `#${e.value.replace('#', '')}`);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="field slider-field">
                    <label>Opacity</label>
                    <Slider
                      value={currentOpacity}
                      onChange={(e) => updateSetting('fovOpacity', e.value)}
                      min={0.05}
                      max={1}
                      step={0.05}
                    />
                    <span className="slider-value">
                      {currentOpacity.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}

            <h3 className="section-subtitle">Custom Icon</h3>
            <div className="section-box">
              <div className="field">
                <label>Icon</label>

                <div className="custom-icon-row">
                  <div className="custom-icon-preview">
                    {selectedItem.customIcon ? (
                      <img
                        src={selectedItem.customIcon}
                        alt="Custom icon preview"
                      />
                    ) : (
                      <span className="custom-icon-placeholder">Default</span>
                    )}
                  </div>

                  <div className="custom-icon-actions">
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={handleIconUpload}
                    />

                    <Button
                      type="button"
                      label={
                        selectedItem.customIcon ? 'Replace icon' : 'Upload icon'
                      }
                      icon="pi pi-upload"
                      outlined
                      onClick={() => iconInputRef.current?.click()}
                    />

                    {selectedItem.customIcon && (
                      <Button
                        type="button"
                        label="Reset to default"
                        icon="pi pi-refresh"
                        severity="secondary"
                        text
                        onClick={handleResetIcon}
                      />
                    )}
                  </div>
                </div>

                <p className="custom-icon-hint">
                  PNG, JPG, SVG, WEBP or GIF. Max 1 MB.
                </p>

                {iconError && (
                  <p className="custom-icon-error">{iconError}</p>
                )}
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </Sidebar>
  );
}

export default AttributesBar;