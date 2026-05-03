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
  /** Snapshot applied when user clicks Search; drives the results list. */
  const [committedFilters, setCommittedFilters] = useState(null);
  const [customLabel, setCustomLabel] = useState('');

  useEffect(() => {
    if (!visible) return;

    setFilters(EMPTY_FILTERS);
    setCommittedFilters(null);
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
    if (!committedFilters) return [];
    const query = committedFilters.searchQuery.trim().toLowerCase();
    return catalog.filter((camera) => {
      if (committedFilters.manufacturer && camera.brand !== committedFilters.manufacturer) return false;
      if (committedFilters.model && camera.modelNumber !== committedFilters.model) return false;
      if (!query) return true;
      return (
        String(camera.modelNumber ?? '').toLowerCase().includes(query) ||
        String(camera.brand ?? '').toLowerCase().includes(query) ||
        String(camera.type ?? '').toLowerCase().includes(query)
      );
    });
  }, [catalog, committedFilters]);

  const runSearch = () => {
    setCommittedFilters({ ...filters, searchQuery: filters.searchQuery.trim() });
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
        <InputText
          value={filters.searchQuery}
          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="Search cameras..."
        />

        <Dropdown
          value={filters.manufacturer}
          options={manufacturerOptions}
          onChange={(e) => {
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
              setCommittedFilters(null);
            }}
          />
          <Button type="button" label="Search" icon="pi pi-search" onClick={runSearch} />
        </div>
      </div>

      <Divider layout="vertical" className="equipment-selector-catalog-divider" />

      <div className="equipment-selector-catalog-results">
        {loading ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">Loading...</p>
        ) : !committedFilters ? (
          <p className="equipment-selector-muted equipment-selector-catalog-results-msg">
            Click Search to view results (optional text + filters). Click a result to add it to the layout.
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
