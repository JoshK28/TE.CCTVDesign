import { useEffect, useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Chip } from 'primereact/chip';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import api from '../services/api';
import './EquipmentSelector.css';

const EMPTY_FILTERS = { manufacturers: [], cameraTypes: [], resolutions: [], modelContains: '' };

const CAMERA_TYPE_OPTIONS = ['Bullet', 'Dome', 'PTZ', 'Box'];
const CAMERA_RESOLUTION_OPTIONS = Array.from({ length: 16 }, (_, i) => `${i + 1}MP`);
const DEVICE_TYPE_OPTIONS = ['Router', 'Sensor', 'Alarm', 'NVR', 'Switch', 'Access Point'];
const SEARCHABLE_PLACEMENT_TYPES = new Set(['camera', 'device', 'router', 'sensor', 'alarm']);

export default function EquipmentSelector({ visible, placementType, onHide, onConfirmSelection }) {
  const [brands, setBrands] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [deviceManufacturer, setDeviceManufacturer] = useState('');
  const [deviceModelName, setDeviceModelName] = useState('');
  const [deviceCostPerUnit, setDeviceCostPerUnit] = useState('');
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    if (!visible) return;

    setMainTab(0);
    setFilters(EMPTY_FILTERS);
    setSearchResults(null);
    setSelectedDeviceType('');
    setDeviceManufacturer('');
    setDeviceModelName('');
    setDeviceCostPerUnit('');

    if (placementType !== 'camera') return;

    let cancelled = false;

    void api
      .get('/api/cameras/brands')
      .then((res) => {
        if (!cancelled) setBrands(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, placementType]);

  const runSearch = async () => {
    const modelQ = filters.modelContains.trim();
    setSearchLoading(true);

    try {
      const qs = new URLSearchParams();
      qs.set('limit', '500');
      if (modelQ) qs.set('search', modelQ);
      for (const b of filters.manufacturers) qs.append('brand', b);
      for (const t of filters.cameraTypes) qs.append('type', t);
      for (const r of filters.resolutions) qs.append('resolution', r);
      const res = await api.get(`/api/cameras?${qs.toString()}`);
      setSearchResults(res.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const removeFilterValue = (key, valueToRemove) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((value) => value !== valueToRemove),
    }));
  };

  const renderObjectPanel = () => (
    <div className="equipment-selector-stack">
      <Button
        type="button"
        label="Place on layout"
        onClick={() => {
          onConfirmSelection?.({});
          onHide();
        }}
      />
    </div>
  );

  const renderDeviceSearchPanel = () => (
    <p className="equipment-selector-muted equipment-selector-tab-placeholder">
      Device search will use the camera-style catalog flow. Use "Add new device" for now.
    </p>
  );

  const renderAddDevicePanel = () => (
    <div className="equipment-selector-stack">
      <div>
        <label htmlFor="eq-device-type" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Device type
        </label>
        <Dropdown
          id="eq-device-type"
          value={selectedDeviceType}
          options={DEVICE_TYPE_OPTIONS}
          placeholder="Select a device type"
          onChange={(e) => setSelectedDeviceType(e.value ?? '')}
          showClear
        />
      </div>
      <div>
        <label htmlFor="eq-device-manufacturer" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Manufacturer
        </label>
        <InputText
          id="eq-device-manufacturer"
          value={deviceManufacturer}
          onChange={(e) => setDeviceManufacturer(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="eq-device-model-name" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Model name
        </label>
        <InputText
          id="eq-device-model-name"
          value={deviceModelName}
          onChange={(e) => setDeviceModelName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="eq-device-cost-per-unit" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Cost per unit
        </label>
        <InputText
          id="eq-device-cost-per-unit"
          value={deviceCostPerUnit}
          onChange={(e) => setDeviceCostPerUnit(e.target.value)}
        />
      </div>
      <Button
        type="button"
        label="Place on layout"
        disabled={!selectedDeviceType}
        onClick={() => {
          const normalizedManufacturer = deviceManufacturer.trim();
          const normalizedModelName = deviceModelName.trim();
          const parsedCost = Number.parseFloat(deviceCostPerUnit.trim());

          onConfirmSelection?.({
            equipmentType: selectedDeviceType.toLowerCase(),
            manufacturer: normalizedManufacturer || undefined,
            modelName: normalizedModelName || undefined,
            costPerUnit: Number.isFinite(parsedCost) ? parsedCost : undefined,
          });
          onHide();
        }}
      />
    </div>
  );

  const renderBody = () => {
    if (SEARCHABLE_PLACEMENT_TYPES.has(placementType)) {
      return (
        <TabView
          className="equipment-selector-tabview"
          activeIndex={mainTab}
          onTabChange={(e) => setMainTab(e.index)}
        >
          <TabPanel header={`Search ${placementType}`}>
            {placementType === 'camera'
              ? renderCameraSearchPanel()
              : placementType === 'device'
                ? renderDeviceSearchPanel()
                : renderObjectPanel()}
          </TabPanel>
          <TabPanel header="Add new device">
            {placementType === 'device' ? renderAddDevicePanel() : null}
          </TabPanel>
        </TabView>
      );
    }
    return <p className="equipment-selector-muted">Unknown equipment type.</p>;
  };

  const renderFilterGroup = ({ icon, title, filterKey, options, placeholder }) => {
    const selectedValues = filters[filterKey];
    return (
      <div className="equipment-selector-filter-group">
        <div className="equipment-selector-filter-heading">
          <i className={`${icon} equipment-selector-filter-icon`} aria-hidden />
          <span className="equipment-selector-filter-title">{title}</span>
          {selectedValues.length > 0 ? (
            <span className="equipment-selector-filter-count">{selectedValues.length}</span>
          ) : null}
        </div>
        <MultiSelect
          value={selectedValues}
          options={options}
          onChange={(e) => updateFilter(filterKey, e.value ?? [])}
          placeholder={placeholder}
          filter={false}
          showClear
          showSelectAll={false}
          maxSelectedLabels={0}
          selectedItemsLabel="{0} selected"
          className="equipment-selector-multiselect"
          panelClassName="equipment-selector-multiselect-panel"
        />
        {selectedValues.length > 0 ? (
          <div className="equipment-selector-selected-chips">
            {selectedValues.map((value) => (
              <Chip
                key={value}
                label={value}
                removable
                onRemove={() => removeFilterValue(filterKey, value)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderCameraSearchPanel = () => (
    <div className="equipment-selector-catalog-layout">
      <div className="equipment-selector-catalog-controls">
        <div>
          <label htmlFor="eq-model-contains" style={{ display: 'block', marginBottom: '0.35rem' }}>
            Model Number contains
          </label>
          <InputText
            id="eq-model-contains"
            className="equipment-selector-model-input"
            value={filters.modelContains}
            onChange={(e) => updateFilter('modelContains', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch();
              }
            }}
          />
        </div>

        {renderFilterGroup({
          icon: 'pi pi-building',
          title: 'Manufacturer',
          filterKey: 'manufacturers',
          options: brands,
          placeholder: 'Manufacturer',
        })}

        {renderFilterGroup({
          icon: 'pi pi-video',
          title: 'Camera type',
          filterKey: 'cameraTypes',
          options: CAMERA_TYPE_OPTIONS,
          placeholder: 'Camera type',
        })}

        {renderFilterGroup({
          icon: 'pi pi-chart-bar',
          title: 'Resolution',
          filterKey: 'resolutions',
          options: CAMERA_RESOLUTION_OPTIONS,
          placeholder: 'Resolution',
        })}

        <div className="equipment-selector-actions">
          <Button
            type="button"
            label="Clear filters"
            outlined
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setSearchResults(null);
            }}
          />
          <Button type="button" label="Search" icon="pi pi-search" onClick={() => void runSearch()} />
        </div>
      </div>

      <Divider layout="vertical" className="equipment-selector-catalog-divider" />

      <div className="equipment-selector-catalog-results">
        {searchLoading ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">Searching...</p>
        ) : searchResults === null ? null : searchResults.length === 0 ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">
            No cameras match these filters.
          </p>
        ) : (
          <div className="equipment-selector-cam-list">
            {searchResults.map((camera) => (
              <Button
                key={camera.id}
                type="button"
                text
                className="equipment-selector-cam-row"
                onClick={() => {
                  onConfirmSelection?.({ camera });
                  onHide();
                }}
              >
                <span className="equipment-selector-cam-row-body">
                  <span className="equipment-selector-cam-line">
                    <strong>Model:</strong> {camera.modelNumber}
                  </span>
                  <span className="equipment-selector-cam-line">
                    <strong>Brand:</strong> {camera.brand}
                  </span>
                  <span className="equipment-selector-cam-line">
                    <strong>Type:</strong> {camera.type || 'N/A'}
                  </span>
                  <span className="equipment-selector-cam-line">
                    <strong>Price:</strong> {camera.price || 'N/A'}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Sidebar
      visible={visible}
      position="center"
      onHide={onHide}
      style={{ width: 'min(800px, 96vw)' }}
      header="Equipment"
      dismissable
      modal
    >
      <div>{renderBody()}</div>
    </Sidebar>
  );
}
