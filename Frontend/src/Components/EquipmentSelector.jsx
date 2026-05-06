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

export default function EquipmentSelector({ visible, placementType, onHide, onConfirmSelection }) {
  const [brands, setBrands] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedDeviceType, setSelectedDeviceType] = useState('');
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    if (!visible) return;

    setMainTab(0);
    setFilters(EMPTY_FILTERS);
    setSearchResults(null);
    setSelectedDeviceType('');

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
      <Button
        type="button"
        label="Place on layout"
        disabled={!selectedDeviceType}
        onClick={() => {
          onConfirmSelection?.({ equipmentType: selectedDeviceType.toLowerCase() });
          onHide();
        }}
      />
    </div>
  );

  const renderBody = () => {
    if (placementType === 'camera' || placementType === 'device' || placementType === 'router' || placementType === 'sensor' || placementType === 'alarm') {
      
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
          <TabPanel header="Add new device"> </TabPanel>
        </TabView>
      );
    }
    return <p className="equipment-selector-muted">Unknown equipment type.</p>;
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
            onChange={(e) => setFilters({ ...filters, modelContains: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch();
              }
            }}
          />
        </div>

        <div className="equipment-selector-filter-group">
          <div className="equipment-selector-filter-heading">
            <i className="pi pi-building equipment-selector-filter-icon" aria-hidden />
            <span className="equipment-selector-filter-title">Manufacturer</span>
            {filters.manufacturers.length > 0 ? (
              <span className="equipment-selector-filter-count">{filters.manufacturers.length}</span>
            ) : null}
          </div>
          <MultiSelect
            value={filters.manufacturers}
            options={brands}
            onChange={(e) => setFilters({ ...filters, manufacturers: e.value ?? [] })}
            placeholder="Manufacturer"
            filter={false}
            showClear
            showSelectAll={false}
            maxSelectedLabels={0}
            selectedItemsLabel="{0} selected"
            className="equipment-selector-multiselect"
            panelClassName="equipment-selector-multiselect-panel"
          />
          {filters.manufacturers.length > 0 ? (
            <div className="equipment-selector-selected-chips">
              {filters.manufacturers.map((m) => (
                <Chip
                  key={m}
                  label={m}
                  removable
                  onRemove={() =>
                    setFilters({
                      ...filters,
                      manufacturers: filters.manufacturers.filter((x) => x !== m),
                    })
                  }
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="equipment-selector-filter-group">
          <div className="equipment-selector-filter-heading">
            <i className="pi pi-video equipment-selector-filter-icon" aria-hidden />
            <span className="equipment-selector-filter-title">Camera type</span>
            {filters.cameraTypes.length > 0 ? (
              <span className="equipment-selector-filter-count">{filters.cameraTypes.length}</span>
            ) : null}
          </div>
          <MultiSelect
            value={filters.cameraTypes}
            options={CAMERA_TYPE_OPTIONS}
            onChange={(e) => setFilters({ ...filters, cameraTypes: e.value ?? [] })}
            placeholder="Camera type"
            filter={false}
            showClear
            showSelectAll={false}
            maxSelectedLabels={0}
            selectedItemsLabel="{0} selected"
            className="equipment-selector-multiselect"
            panelClassName="equipment-selector-multiselect-panel"
          />
          {filters.cameraTypes.length > 0 ? (
            <div className="equipment-selector-selected-chips">
              {filters.cameraTypes.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  removable
                  onRemove={() =>
                    setFilters({
                      ...filters,
                      cameraTypes: filters.cameraTypes.filter((x) => x !== t),
                    })
                  }
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="equipment-selector-filter-group">
          <div className="equipment-selector-filter-heading">
            <i className="pi pi-chart-bar equipment-selector-filter-icon" aria-hidden />
            <span className="equipment-selector-filter-title">Resolution</span>
            {filters.resolutions.length > 0 ? (
              <span className="equipment-selector-filter-count">{filters.resolutions.length}</span>
            ) : null}
          </div>
          <MultiSelect
            value={filters.resolutions}
            options={CAMERA_RESOLUTION_OPTIONS}
            onChange={(e) => setFilters({ ...filters, resolutions: e.value ?? [] })}
            placeholder="Resolution"
            filter={false}
            showClear
            showSelectAll={false}
            maxSelectedLabels={0}
            selectedItemsLabel="{0} selected"
            className="equipment-selector-multiselect"
            panelClassName="equipment-selector-multiselect-panel"
          />
          {filters.resolutions.length > 0 ? (
            <div className="equipment-selector-selected-chips">
              {filters.resolutions.map((res) => (
                <Chip
                  key={res}
                  label={res}
                  removable
                  onRemove={() =>
                    setFilters({
                      ...filters,
                      resolutions: filters.resolutions.filter((x) => x !== res),
                    })
                  }
                />
              ))}
            </div>
          ) : null}
        </div>

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
