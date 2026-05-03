import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import api from '../services/api';
import './EquipmentSelector.css';

const EMPTY_FILTERS = { searchQuery: '', manufacturer: null, model: null };

export default function EquipmentSelector({ visible, placementType, onHide, onConfirmSelection }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    if (!visible) return;

    setFilters(EMPTY_FILTERS);
    setSelectedCameraId(null);
    setCustomLabel('');

    if (placementType !== 'camera') return;

    let cancelled = false;
    setLoading(true);

    void api
      .get('/api/cameras')
      .then((res) => {
        if (!cancelled) setCatalog(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, placementType]);

  const manufacturerOptions = useMemo(() => {
    const values = [...new Set(catalog.map((camera) => camera.brand).filter(Boolean))];
    values.sort((a, b) => a.localeCompare(b));
    return values.map((value) => ({ label: value, value }));
  }, [catalog]);

  const modelOptions = useMemo(() => {
    const source = filters.manufacturer
      ? catalog.filter((camera) => camera.brand === filters.manufacturer)
      : catalog;
    const values = [...new Set(source.map((camera) => camera.modelNumber).filter(Boolean))];
    values.sort((a, b) => a.localeCompare(b));
    return values.map((value) => ({ label: value, value }));
  }, [catalog, filters.manufacturer]);

  const filteredCameras = useMemo(() => {
    const query = filters.searchQuery.trim().toLowerCase();
    return catalog.filter((camera) => {
      if (filters.manufacturer && camera.brand !== filters.manufacturer) return false;
      if (filters.model && camera.modelNumber !== filters.model) return false;
      if (!query) return false;
      return (
        String(camera.modelNumber ?? '').toLowerCase().includes(query) ||
        String(camera.brand ?? '').toLowerCase().includes(query) ||
        String(camera.type ?? '').toLowerCase().includes(query)
      );
    });
  }, [catalog, filters]);

  const selectedCamera = useMemo(
    () => catalog.find((camera) => camera.id === selectedCameraId) ?? null,
    [catalog, selectedCameraId],
  );


  const placeCustomLabel = () => {
    onConfirmSelection?.({ displayName: customLabel.trim() || undefined });
    onHide();
  };

  const placeSelectedCamera = () => {
    if (!selectedCamera) return;
    onConfirmSelection?.({ camera: selectedCamera });
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
        <InputText
          value={filters.searchQuery}
          onChange={(e) => {
            setSelectedCameraId(null);
            setFilters({ ...filters, searchQuery: e.target.value });
          }}
          placeholder="Search cameras..."
        />

        <Dropdown
          value={filters.manufacturer}
          options={manufacturerOptions}
          onChange={(e) => {
            setSelectedCameraId(null);
            setFilters({ ...filters, manufacturer: e.value, model: null });
          }}
          placeholder="Manufacturer"
          showClear
        />

        <Dropdown
          value={filters.model}
          options={modelOptions}
          onChange={(e) => {
            const model = e.value;
            setFilters({ ...filters, model });
            if (!model) {
              setSelectedCameraId(null);
              return;
            }
            const match = catalog.find((camera) => camera.modelNumber === model);
            setSelectedCameraId(match?.id ?? null);
          }}
          placeholder="Model"
          showClear
        />

        <div className="equipment-selector-actions">
          <Button
            type="button"
            label="Clear filters"
            outlined
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setSelectedCameraId(null);
            }}
          />
          <Button
            type="button"
            label="Add object"
            icon="pi pi-plus"
            severity="success"
            disabled={!selectedCamera}
            onClick={placeSelectedCamera}
          />
        </div>
      </div>

      <Divider layout="vertical" className="equipment-selector-catalog-divider" />

      <div className="equipment-selector-catalog-results">
        {loading ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">Loading...</p>
        ) : !filters.searchQuery.trim() ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">
            Type a search term to view matching cameras.
          </p>
        ) : filteredCameras.length === 0 ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">
            No cameras match these filters.
          </p>
        ) : (
          <div className="equipment-selector-cam-list">
            {filteredCameras.map((camera) => (
              <Button
                key={camera.id}
                type="button"
                text
                className={`equipment-selector-cam-row${
                  selectedCameraId === camera.id ? ' equipment-selector-cam-row--selected' : ''
                }`}
                onClick={() => setSelectedCameraId(camera.id)}
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
