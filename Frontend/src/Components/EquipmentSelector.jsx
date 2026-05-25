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

const EMPTY_FILTERS = {
  manufacturers: [],
  cameraTypes: [],
  resolutions: [],
  deviceTypes: [],
  modelContains: '',
};
const EMPTY_MANUAL = { subtype: '', manufacturer: '', modelName: '', costPerUnit: '' };

const CAMERA_TYPE_OPTIONS = ['Bullet', 'Dome', 'PTZ', 'Box'];
const CAMERA_RESOLUTION_OPTIONS = Array.from({ length: 16 }, (_, i) => `${i + 1}MP`);
const DEVICE_TYPE_OPTIONS = ['Access Point', 'Alarm', 'NVR', 'Router', 'Sensor', 'Server', 'Switch'];

export default function EquipmentSelector({ visible, placementType, onHide, onConfirmSelection }) {
  const isCamera = placementType === 'camera';
  const isDevice = placementType === 'device';

  const [brands, setBrands] = useState([]);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [manual, setManual] = useState(EMPTY_MANUAL);
  const [mainTab, setMainTab] = useState(0);

  useEffect(() => {
    if (!visible) return;

    setMainTab(0);
    setFilters(EMPTY_FILTERS);
    setManual(EMPTY_MANUAL);
    setSearchResults(null);

    if (!isCamera && !isDevice) {
      setBrands([]);
      return;
    }

    const endpoint = isCamera ? '/api/cameras/brands' : '/api/devices/manufacturers';

    let cancelled = false;
    void api
      .get(endpoint)
      .then((res) => {
        if (!cancelled) setBrands(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, isCamera, isDevice]);

  const runSearch = async () => {
    if (!isCamera && !isDevice) return;

    setSearchLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('limit', '500');
      const modelQ = filters.modelContains.trim();
      if (modelQ) qs.set('search', modelQ);

      if (isCamera) {
        for (const b of filters.manufacturers) qs.append('brand', b);
        for (const t of filters.cameraTypes) qs.append('type', t);
        for (const r of filters.resolutions) qs.append('resolution', r);
        const res = await api.get(`/api/cameras?${qs.toString()}`);
        setSearchResults(res.data ?? []);
      } else {
        for (const m of filters.manufacturers) qs.append('manufacturer', m);
        for (const t of filters.deviceTypes) qs.append('type', t);
        const res = await api.get(`/api/devices?${qs.toString()}`);
        setSearchResults(res.data ?? []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const confirmCatalog = (camera) => {
    onConfirmSelection?.({
      subtype: 'Camera',
      name: camera.modelNumber,
      attributes: {
        cameraId: camera.id,
        cameraModel: camera.modelNumber,
        brand: camera.brand,
        resolution: camera.resolution,
        cameraType: camera.type,
      },
    });
    onHide();
  };

  const confirmDeviceCatalog = (device) => {
    const source = (device.source ?? '').toLowerCase();
    onConfirmSelection?.({
      subtype: device.deviceType || 'Device',
      name: device.modelName,
      attributes: {
        ...(source === 'networking' ? { networkingId: device.id } : {}),
        ...(source === 'accesscontrol' ? { accessControlId: device.id } : {}),
        modelName: device.modelName,
        brand: device.manufacturer,
        deviceType: device.deviceType,
      },
    });
    onHide();
  };

  const confirmManual = () => {
    const manufacturer = manual.manufacturer.trim();
    const modelName = manual.modelName.trim();
    const parsedCost = Number.parseFloat(manual.costPerUnit.trim());

    const attributes = {
      ...(manufacturer ? { brand: manufacturer } : {}),
      ...(modelName ? { modelName } : {}),
      ...(isCamera && manual.subtype ? { cameraType: manual.subtype } : {}),
      ...(Number.isFinite(parsedCost) ? { costPerUnit: parsedCost } : {}),
    };

    onConfirmSelection?.({
      subtype: manual.subtype,
      name: modelName || undefined,
      attributes,
    });
    onHide();
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
          value={manual.subtype}
          options={isCamera ? CAMERA_TYPE_OPTIONS : DEVICE_TYPE_OPTIONS}
          placeholder={isCamera ? 'Select a camera type' : 'Select a device type'}
          onChange={(e) => setManual({ ...manual, subtype: e.value ?? '' })}
          showClear
        />
      </div>
      <div>
        <label htmlFor="eq-manufacturer" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Manufacturer
        </label>
        <InputText
          id="eq-manufacturer"
          value={manual.manufacturer}
          onChange={(e) => setManual({ ...manual, manufacturer: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="eq-model-name" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Model name
        </label>
        <InputText
          id="eq-model-name"
          value={manual.modelName}
          onChange={(e) => setManual({ ...manual, modelName: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="eq-cost-per-unit" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Cost per unit
        </label>
        <InputText
          id="eq-cost-per-unit"
          value={manual.costPerUnit}
          onChange={(e) => setManual({ ...manual, costPerUnit: e.target.value })}
        />
      </div>
      <Button
        type="button"
        label="Place on layout"
        disabled={!manual.subtype}
        onClick={confirmManual}
      />
    </div>
  );

  const renderSearchPanel = () => {
    if (!isCamera && !isDevice) return null;

    const modelLabel = isCamera ? 'Model Number contains' : 'Model Name contains';
    const emptyResultsMsg = isCamera
      ? 'No cameras match these filters.'
      : 'No devices match these filters.';

    return (
      <div className="equipment-selector-catalog-layout">
        <div className="equipment-selector-catalog-controls">
          <div>
            <label htmlFor="eq-model-contains" style={{ display: 'block', marginBottom: '0.35rem' }}>
              {modelLabel}
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

          {isCamera && renderFilterGroup({
            icon: 'pi pi-video',
            title: 'Camera type',
            value: filters.cameraTypes,
            options: CAMERA_TYPE_OPTIONS,
            onChange: (cameraTypes) => setFilters({ ...filters, cameraTypes }),
          })}

          {isCamera && renderFilterGroup({
            icon: 'pi pi-chart-bar',
            title: 'Resolution',
            value: filters.resolutions,
            options: CAMERA_RESOLUTION_OPTIONS,
            onChange: (resolutions) => setFilters({ ...filters, resolutions }),
          })}

          {isDevice && renderFilterGroup({
            icon: 'pi pi-sitemap',
            title: 'Device type',
            value: filters.deviceTypes,
            options: DEVICE_TYPE_OPTIONS,
            onChange: (deviceTypes) => setFilters({ ...filters, deviceTypes }),
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
              {emptyResultsMsg}
            </p>
          ) : isCamera ? (
            <div className="equipment-selector-cam-list">
              {searchResults.map((camera) => (
                <Button
                  key={camera.id}
                  type="button"
                  text
                  className="equipment-selector-cam-row"
                  onClick={() => confirmCatalog(camera)}
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
          ) : (
            <div className="equipment-selector-cam-list">
              {searchResults.map((device) => (
                <Button
                  key={`${device.source}-${device.id}`}
                  type="button"
                  text
                  className="equipment-selector-cam-row"
                  onClick={() => confirmDeviceCatalog(device)}
                >
                  <span className="equipment-selector-cam-row-body">
                    <span className="equipment-selector-cam-line">
                      <strong>Device type:</strong> {device.deviceType || 'N/A'}
                    </span>
                    <span className="equipment-selector-cam-line">
                      <strong>Model name:</strong> {device.modelName || 'N/A'}
                    </span>
                    <span className="equipment-selector-cam-line">
                      <strong>Manufacturer:</strong> {device.manufacturer || 'N/A'}
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
      <TabView
        className="equipment-selector-tabview"
        activeIndex={mainTab}
        onTabChange={(e) => setMainTab(e.index)}
      >
        <TabPanel header={isCamera ? 'Search camera' : 'Search device'}>{renderSearchPanel()}</TabPanel>
        <TabPanel header={isCamera ? 'Add new camera' : 'Add new device'}>{renderAddNewPanel()}</TabPanel>
      </TabView>
    </Sidebar>
  );
}
