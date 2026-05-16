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
  const isCamera = placementType === 'camera';
  const isDevice = placementType === 'device';

  const [brands, setBrands] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedType, setSelectedType] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [modelName, setModelName] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    if (!visible) return;

    setMainTab(0);
    setFilters(EMPTY_FILTERS);
    setSearchResults(null);
    setSelectedType('');
    setManufacturer('');
    setModelName('');
    setCostPerUnit('');

    if (!isCamera) {
      setBrands([]);
      return;
    }

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
  }, [visible, placementType, isCamera]);

  const runSearch = async () => {
    if (!isCamera) return;

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

  const renderFilterGroup = ({ icon, title, value, options, onChange }) => (
    <div className="equipment-selector-filter-group">
      <div className="equipment-selector-filter-heading">
        <i className={`${icon} equipment-selector-filter-icon`} aria-hidden />
        <span className="equipment-selector-filter-title">{title}</span>
        {value.length > 0 ? <span className="equipment-selector-filter-count">{value.length}</span> : null}
      </div>
      <MultiSelect
        value={value}
        options={options}
        onChange={(e) => onChange(e.value ?? [])}
        placeholder={title}
        filter={false}
        showClear
        showSelectAll={false}
        maxSelectedLabels={0}
        selectedItemsLabel="{0} selected"
        panelClassName="equipment-selector-multiselect-panel"
      />
      {value.length > 0 ? (
        <div className="equipment-selector-selected-chips">
          {value.map((item) => (
            <Chip
              key={item}
              label={item}
              removable
              onRemove={() => onChange(value.filter((x) => x !== item))}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  const renderAddNewPanel = () => (
    <div className="equipment-selector-stack">
      <div>
        <label htmlFor="eq-type" style={{ display: 'block', marginBottom: '0.35rem' }}>
          {isCamera ? 'Camera type' : 'Device type'}
        </label>
        <Dropdown
          id="eq-type"
          value={selectedType}
          options={isCamera ? CAMERA_TYPE_OPTIONS : DEVICE_TYPE_OPTIONS}
          placeholder={isCamera ? 'Select a camera type' : 'Select a device type'}
          onChange={(e) => setSelectedType(e.value ?? '')}
          showClear
        />
      </div>
      <div>
        <label htmlFor="eq-manufacturer" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Manufacturer
        </label>
        <InputText
          id="eq-manufacturer"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="eq-model-name" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Model name
        </label>
        <InputText id="eq-model-name" value={modelName} onChange={(e) => setModelName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="eq-cost-per-unit" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Cost per unit
        </label>
        <InputText
          id="eq-cost-per-unit"
          value={costPerUnit}
          onChange={(e) => setCostPerUnit(e.target.value)}
        />
      </div>
      <Button
        type="button"
        label="Place on layout"
        disabled={!selectedType}
        onClick={() => {
          const normalizedManufacturer = manufacturer.trim();
          const normalizedModelName = modelName.trim();
          const parsedCost = Number.parseFloat(costPerUnit.trim());

          onConfirmSelection?.({
            subtype: selectedType,
            manufacturer: normalizedManufacturer || undefined,
            modelName: normalizedModelName || undefined,
            costPerUnit: Number.isFinite(parsedCost) ? parsedCost : undefined,
          });
          onHide();
        }}
      />
    </div>
  );

  const renderSearchPanel = () => {
    if (isDevice) {
      return (
        <p className="equipment-selector-muted equipment-selector-tab-placeholder">
          Device catalog search is not available yet. Use &quot;Add new device&quot; to place equipment manually.
        </p>
      );
    }

    return (
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

          {renderFilterGroup({
            icon: 'pi pi-building',
            title: 'Manufacturer',
            value: filters.manufacturers,
            options: brands,
            onChange: (manufacturers) => setFilters({ ...filters, manufacturers }),
          })}

          {renderFilterGroup({
            icon: 'pi pi-video',
            title: 'Camera type',
            value: filters.cameraTypes,
            options: CAMERA_TYPE_OPTIONS,
            onChange: (cameraTypes) => setFilters({ ...filters, cameraTypes }),
          })}

          {renderFilterGroup({
            icon: 'pi pi-chart-bar',
            title: 'Resolution',
            value: filters.resolutions,
            options: CAMERA_RESOLUTION_OPTIONS,
            onChange: (resolutions) => setFilters({ ...filters, resolutions }),
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
  };

  const renderBody = () => {
    if (!isCamera && !isDevice) {
      return <p className="equipment-selector-muted">Unknown equipment type.</p>;
    }

    return (
      <TabView
        className="equipment-selector-tabview"
        activeIndex={mainTab}
        onTabChange={(e) => setMainTab(e.index)}
      >
        <TabPanel header={isCamera ? 'Search camera' : 'Search device'}>{renderSearchPanel()}</TabPanel>
        <TabPanel header="Add new device">{renderAddNewPanel()}</TabPanel>
      </TabView>
    );
  };

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
