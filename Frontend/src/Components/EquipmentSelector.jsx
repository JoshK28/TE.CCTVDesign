import { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import api from '../services/api';

export default function EquipmentSelector({ visible , onHide}) {

    const [cameras, setCameras  ] = useState([]); // 2. State camera DB data
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        searchQuery: '',
        manufacturer: null
    });

    const manufacturerOptions = [...new Set(cameras.map(c => c.brand))];

    useEffect(() => {
        const fetchCameras = async () => {
            setLoading(true);
            try {
                const res = await api.get("/api/cameras", {
                    params: { 
                        search: filters.searchQuery,
                        manufacturer: filters.manufacturer
                    }
                });
                setCameras(res.data);
            } catch (err) {
                console.error("Fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCameras();
    }, [filters]);

    return (
        <Sidebar 
            visible={visible} 
            position="center" 
            onHide={onHide}
            style={{ width: '500px' }}
        >
            <div className="test-section" style={{ marginTop: '20px', color: 'blue' }}>
                <h3>Equipment Catalog</h3>
                
                <br />
                <label className="font-bold text-sm"> Search : </label>
                <InputText 
                    value={filters.searchQuery} 
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })} 
                    placeholder="Search equipment..." 
                    className="w-full"
                />
                <br />
                <label className="font-bold text-sm">Manufacturer : </label>
                <Dropdown 
                    value={filters.manufacturer} 
                    options={manufacturerOptions} 
                    onChange={(e) => setFilters({ ...filters, manufacturer: e.value })} 
                    placeholder="Select Brand" 
                    showClear 
                    className="w-full"
                />
                
            </div>
                {/*
                {loading ? (
                    <p>Loading DB data...</p>
                ) : testCameras.length > 0 ? (
                    <div>
                        {testCameras.map(camera => (
                            <div key={camera.id}>
                                <p><strong>DB ID:</strong> {camera.id}</p>
                                <p><strong>DB Name:</strong> {camera.type || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No cameras found in DB.</p>
                )}
                */}
        </Sidebar>
    )
}
