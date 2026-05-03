import { useEffect, useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import api from '../services/api';
import './EquipmentSelector.css';

const EMPTY_FILTERS = { manufacturer: null, cameraType: null, modelContains: '' };

const CAMERA_TYPE_FILTER_OPTIONS = ['Bullet', 'Dome', 'PTZ', 'Box'];

export default function EquipmentSelector({ visible, placementType, onHide, onConfirmSelection }) {
  const [brands, setBrands] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  /** True after Search finishes at least once this open (distinguishes “no results yet” vs “search returned nothing”). */
  const [hasSearched, setHasSearched] = useState(false);
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    if (!visible) return;

    setFilters(EMPTY_FILTERS);
    setHasSearched(false);
    setSearchResults([]);
    setCustomLabel('');

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
      const params = { limit: 500 };
      if (modelQ) params.search = modelQ;
      if (filters.manufacturer) params.brand = filters.manufacturer;
      if (filters.cameraType) params.type = filters.cameraType;
      const res = await api.get('/api/cameras', { params });
      setSearchResults(res.data ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
      setHasSearched(true);
    }
  };

  const placeCustomLabel = () => {
    onConfirmSelection?.({ displayName: customLabel.trim() || undefined });
    onHide();
  };

  const placeCameraFromRow = (camera) => {
    onConfirmSelection?.({ camera });
    onHide();
  };

  const renderLabelPlacement = (inputId) => (
    <div className="equipment-selector-stack">
      <div>
        <label htmlFor={inputId} style={{ display: 'block', marginBottom: '0.35rem' }}>
          Label (optional)
        </label>
        <InputText
          id={inputId}
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder="e.g. Front entrance"
        />
      </div>
      <Button type="button" label="Place on layout" onClick={placeCustomLabel} />
    </div>
  );

  const renderCameraPanel = () => (
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

        <Dropdown
          value={filters.manufacturer}
          options={brands.map((value) => ({ label: value, value }))}
          onChange={(e) => setFilters({ ...filters, manufacturer: e.value })}
          placeholder="Manufacturer"
          showClear
        />

        <Dropdown
          value={filters.cameraType}
          options={CAMERA_TYPE_FILTER_OPTIONS.map((value) => ({ label: value, value }))}
          onChange={(e) => setFilters({ ...filters, cameraType: e.value })}
          placeholder="Camera type"
          showClear
        />

        <div className="equipment-selector-actions">
          <Button
            type="button"
            label="Clear filters"
            outlined
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setHasSearched(false);
              setSearchResults([]);
            }}
          />
          <Button type="button" label="Search" icon="pi pi-search" onClick={() => void runSearch()} />
        </div>
      </div>

      <Divider layout="vertical" className="equipment-selector-catalog-divider" />

      <div className="equipment-selector-catalog-results">
        {searchLoading ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">Searching...</p>
        ) : !hasSearched ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">
            Select filters and click Search. Click a result to add it to the layout.
          </p>
        ) : searchResults.length === 0 ? (
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
                onClick={() => placeCameraFromRow(camera)}
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
                </span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBody = () => {
    if (placementType === 'camera') return renderCameraPanel();
    if (placementType === 'router' || placementType === 'sensor' || placementType === 'alarm') {
      return renderLabelPlacement(`eq-label-${placementType}`);
    }
    return <p className="equipment-selector-muted">Unknown equipment type.</p>;
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
      <div>{visible && placementType ? renderBody() : null}</div>
    </Sidebar>
  );
}
