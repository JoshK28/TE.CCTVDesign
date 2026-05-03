import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import api from '../services/api';

const TYPE_TITLES = {
  camera: 'Select a camera',
  router: 'Add a router',
  sensor: 'Add a sensor',
  alarm: 'Add an alarm',
};

export default function EquipmentSelector({
  visible,
  placementType,
  onHide,
  onConfirmSelection,
}) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    searchQuery: '',
    manufacturer: null,
  });
  const [otherLabel, setOtherLabel] = useState('');

  const manufacturerOptions = [...new Set(cameras.map((c) => c.brand))];

  const fetchCameras = useCallback(
    async (overrideFilters = null) => {
      setLoading(true);
      const activeFilters = overrideFilters || filters;
      try {
        const res = await api.get('/api/cameras', {
          params: {
            search: activeFilters.searchQuery,
            brand: activeFilters.manufacturer,
          },
        });
        setCameras(res.data);
      } catch (err) {
        console.error('Fetch failed:', err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const resetCameraPanel = () => {
    const emptyFilters = { searchQuery: '', manufacturer: null };
    setFilters(emptyFilters);
    setCameras([]);
  };

  const closeSelector = () => {
    setOtherLabel('');
    if (placementType === 'camera') resetCameraPanel();
    onHide();
  };

  useEffect(() => {
    if (!visible || placementType !== 'camera') return;
    fetchCameras();
  }, [visible, placementType, fetchCameras]);

  useEffect(() => {
    if (visible) setOtherLabel('');
  }, [visible, placementType]);

  const title = placementType ? TYPE_TITLES[placementType] ?? 'Add equipment' : 'Equipment';

  const renderCameraPanel = () => (
    <>
      <div className="test-section" style={{ marginTop: '20px' }}>
        <label className="font-bold text-sm">Search</label>
        <InputText
          value={filters.searchQuery}
          onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
          placeholder="Search equipment..."
          className="w-full"
        />
        <button type="button" className="p-button p-component p-button-outlined w-full mt-2" onClick={resetCameraPanel}>
          Clear filters
        </button>
        <label className="font-bold text-sm mt-3 block">Manufacturer</label>
        <Dropdown
          value={filters.manufacturer}
          options={manufacturerOptions}
          onChange={(e) => setFilters({ ...filters, manufacturer: e.value })}
          placeholder="Select brand"
          showClear
          className="w-full"
        />
        <button
          type="button"
          className="p-button p-component p-button-outlined w-full mt-2"
          onClick={() => fetchCameras()}
        >
          Fetch equipment
        </button>
        <hr style={{ margin: '20px 0' }} />
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : cameras.length > 0 ? (
        <div>
          {cameras.slice(0, 5).map((camera) => (
            <div key={camera.id} style={{ padding: '5px', borderBottom: '1px solid #ccc' }}>
              <p>
                <strong>Camera code:</strong> {camera.modelNumber}
              </p>
              <p>
                <strong>Brand:</strong> {camera.brand}
              </p>
              <p>
                <strong>Type:</strong> {camera.type || 'N/A'}
              </p>
              <Button
                type="button"
                className="p-button p-component p-button-outlined w-full mt-2"
                onClick={() => {
                  onConfirmSelection?.({ camera });
                  closeSelector();
                }}
                label="Select"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-500">Use filters and fetch equipment, or close to cancel placement.</p>
      )}
    </>
  );

  const renderSimplePanel = (hint) => (
    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p className="text-600" style={{ margin: 0, lineHeight: 1.5 }}>
        {hint}
      </p>
      <div>
        <label className="font-bold text-sm">Label (optional)</label>
        <InputText value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} className="w-full" placeholder="e.g. Front entrance" />
      </div>
      <Button
        type="button"
        label="Place on layout"
        className="w-full"
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
        return renderCameraPanel();
      case 'router':
        return renderSimplePanel('Choose an optional label, then add the router to the floor plan.');
      case 'sensor':
        return renderSimplePanel('Choose an optional label, then add the sensor to the floor plan.');
      case 'alarm':
        return renderSimplePanel('Choose an optional label, then add the alarm device to the floor plan.');
      default:
        return <p className="text-500">Unknown equipment type.</p>;
    }
  };

  return (
    <Sidebar visible={visible} position="center" onHide={closeSelector} style={{ width: '500px' }}>
      <div style={{ marginTop: '12px', padding: '0 8px' }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {visible && placementType ? renderBody() : null}
      </div>
    </Sidebar>
  );
}
