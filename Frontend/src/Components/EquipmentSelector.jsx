import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import api from '../services/api';
import './EquipmentSelector.css';

const HEADER_TITLES = {
  camera: 'Camera',
  router: 'Router',
  sensor: 'Sensor',
  alarm: 'Alarm',
};

const TYPE_HINTS = {
  router: 'Choose an optional label, then add the router to the floor plan.',
  sensor: 'Choose an optional label, then add the sensor to the floor plan.',
  alarm: 'Choose an optional label, then add the alarm device to the floor plan.',
};

const toOptions = (values) =>
  values.map((v) => ({ label: v, value: v }));

export default function EquipmentSelector({ visible, placementType, onHide, onConfirmSelection }) {
  const [allCameras, setAllCameras] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraResultsRequested, setCameraResultsRequested] = useState(false);
  /** TabView: 0 = Catalog, 1 = Create new */
  const [catalogTabIndex, setCatalogTabIndex] = useState(0);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [filters, setFilters] = useState({
    searchQuery: '',
    manufacturer: null,
    model: null,
  });
  const [otherLabel, setOtherLabel] = useState('');

  const manufacturerOptions = useMemo(() => {
    const brands = [...new Set(allCameras.map((c) => c.brand).filter(Boolean))];
    brands.sort((a, b) => a.localeCompare(b));
    return toOptions(brands);
  }, [allCameras]);

  const modelOptions = useMemo(() => {
    const list = filters.manufacturer
      ? allCameras.filter((c) => c.brand === filters.manufacturer)
      : allCameras;
    const models = [...new Set(list.map((c) => c.modelNumber).filter(Boolean))];
    models.sort((a, b) => a.localeCompare(b));
    return toOptions(models);
  }, [allCameras, filters.manufacturer]);

  const resetCameraPanel = useCallback(() => {
    setFilters({ searchQuery: '', manufacturer: null, model: null });
    setCameras([]);
    setCameraResultsRequested(false);
    setSelectedCamera(null);
  }, []);

  const closeSelector = () => {
    setOtherLabel('');
    setCatalogTabIndex(0);
    if (placementType === 'camera') {
      resetCameraPanel();
      setAllCameras([]);
    }
    onHide();
  };

  const runCatalogSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/cameras', {
        params: {
          search: filters.searchQuery.trim() || undefined,
          brand: filters.manufacturer || undefined,
        },
      });
      let rows = res.data ?? [];
      if (filters.model) rows = rows.filter((c) => c.modelNumber === filters.model);
      setCameras(rows);
      setCameraResultsRequested(true);
      setSelectedCamera(null);
    } catch (err) {
      console.error('Fetch failed:', err);
      setCameras([]);
      setCameraResultsRequested(true);
      setSelectedCamera(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!visible || placementType !== 'camera') return;
    resetCameraPanel();
    setCatalogTabIndex(0);
    let cancelled = false;
    void api
      .get('/api/cameras')
      .then((res) => {
        if (!cancelled) setAllCameras(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setAllCameras([]);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, placementType, resetCameraPanel]);

  useEffect(() => {
    if (visible) setOtherLabel('');
  }, [visible, placementType]);

  const headerTitle = placementType ? HEADER_TITLES[placementType] ?? 'Equipment' : 'Equipment';

  const confirmSelectedCamera = () => {
    if (!selectedCamera) return;
    onConfirmSelection?.({ camera: selectedCamera });
    closeSelector();
  };

  const renderCameraCatalog = () => (
    <TabView activeIndex={catalogTabIndex} onTabChange={(e) => setCatalogTabIndex(e.index)}>
      <TabPanel header="Catalog">
        <div className="equipment-selector-stack">
          <div style={{ position: 'relative' }}>
            <InputText
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void runCatalogSearch();
                }
              }}
              placeholder="Type to search..."
            />
            <i
              className="pi pi-search"
              aria-hidden
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-color-secondary)',
                pointerEvents: 'none',
              }}
            />
          </div>

          <p className="equipment-selector-or">or select from the list:</p>

          <Dropdown
            value={filters.manufacturer}
            options={manufacturerOptions}
            onChange={(e) =>
              setFilters({
                ...filters,
                manufacturer: e.value,
                model: null,
              })
            }
            placeholder="Manufacturers"
            showClear
          />
          <Dropdown
            value={filters.model}
            options={modelOptions}
            onChange={(e) => setFilters({ ...filters, model: e.value })}
            placeholder="Models"
            showClear
          />

          <div className="equipment-selector-actions">
            <Button type="button" label="Clear filters" outlined onClick={resetCameraPanel} />
            <Button
              type="button"
              label="Add"
              icon="pi pi-plus"
              disabled={!selectedCamera}
              onClick={confirmSelectedCamera}
            />
          </div>
        </div>

        {!cameraResultsRequested ? (
          <p className="equipment-selector-muted">
            Press Enter in the search field to load results, or use the dropdowns then Enter.
          </p>
        ) : loading ? (
          <p className="equipment-selector-muted">Loading…</p>
        ) : cameras.length > 0 ? (
          <div>
            {cameras.slice(0, 12).map((camera) => (
              <div
                key={camera.id}
                role="button"
                tabIndex={0}
                className={`equipment-selector-cam-row ${
                  selectedCamera?.id === camera.id ? 'equipment-selector-cam-row--selected' : ''
                }`}
                onClick={() => setSelectedCamera(camera)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCamera(camera);
                  }
                }}
              >
                <p style={{ margin: '0 0 0.35rem' }}>
                  <strong>Model:</strong> {camera.modelNumber}
                </p>
                <p style={{ margin: '0 0 0.35rem' }}>
                  <strong>Brand:</strong> {camera.brand}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Type:</strong> {camera.type || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="equipment-selector-muted">No cameras match these filters. Adjust and search again.</p>
        )}
      </TabPanel>

      <TabPanel header="Create new">
        <div className="equipment-selector-stack">
          <p className="equipment-selector-muted" style={{ textAlign: 'left', marginTop: 0 }}>
            Add a labelled camera without picking from the catalog.
          </p>
          <div>
            <label htmlFor="eq-create-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
              Label (optional)
            </label>
            <InputText
              id="eq-create-label"
              value={otherLabel}
              onChange={(e) => setOtherLabel(e.target.value)}
              placeholder="e.g. Front entrance"
            />
          </div>
          <Button
            type="button"
            label="Place on layout"
            onClick={() => {
              onConfirmSelection?.({ displayName: otherLabel.trim() || undefined });
              closeSelector();
            }}
          />
        </div>
      </TabPanel>
    </TabView>
  );

  const renderSimplePanel = (hint) => (
    <div className="equipment-selector-stack">
      <p className="equipment-selector-muted" style={{ textAlign: 'left', marginTop: 0 }}>
        {hint}
      </p>
      <div>
        <label htmlFor="eq-simple-label" style={{ display: 'block', marginBottom: '0.35rem' }}>
          Label (optional)
        </label>
        <InputText
          id="eq-simple-label"
          value={otherLabel}
          onChange={(e) => setOtherLabel(e.target.value)}
          placeholder="e.g. Front entrance"
        />
      </div>
      <Button
        type="button"
        label="Place on layout"
        onClick={() => {
          onConfirmSelection?.({ displayName: otherLabel.trim() || undefined });
          closeSelector();
        }}
      />
    </div>
  );

  const renderBody = () => {
    switch (placementType) {
      case 'camera':
        return renderCameraCatalog();
      case 'router':
        return renderSimplePanel(TYPE_HINTS.router);
      case 'sensor':
        return renderSimplePanel(TYPE_HINTS.sensor);
      case 'alarm':
        return renderSimplePanel(TYPE_HINTS.alarm);
      default:
        return <p className="equipment-selector-muted">Unknown equipment type.</p>;
    }
  };

  return (
    <Sidebar
      visible={visible}
      position="center"
      onHide={closeSelector}
      style={{ width: 'min(480px, 94vw)' }}
      header={headerTitle}
      dismissable
      modal
    >
      <div>{visible && placementType ? renderBody() : null}</div>
    </Sidebar>
  );
}
