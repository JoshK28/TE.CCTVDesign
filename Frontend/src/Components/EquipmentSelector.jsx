import { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import api from '../services/api';

export default function EquipmentSelector({ visible , onHide}) {
    const [cameras, setCameras  ] = useState([]); // 2. State camera DB data
    const [loading, setLoading] = useState(true);
    const [searching, setSearch] = useState(false);
    const [filters, setFilters] = useState({
        searchQuery: '',
        manufacturer: null
    });

    const manufacturerOptions = [...new Set(cameras.map(c => c.brand))];


    const fetchCameras = async (overrideFilters = null) => {
        setLoading(true);

        const activeFilters = overrideFilters || filters;
        try {
            const res = await api.get("/api/cameras", {
                params: { 
                    search: activeFilters.searchQuery,
                    brand: activeFilters.manufacturer
                }
            });
            console.log("Fetched cameras:", res);
            setCameras(res.data);
        } catch (err) {
            console.error("Fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const resetParams = async () => {

        const emptyFilters = { searchQuery: '', manufacturer: null };

        setFilters(emptyFilters);
        setSearch(false);
        setCameras([]);

        await fetchCameras(emptyFilters); 
    };

    useEffect(() => {
    fetchCameras(); 
    }, []);

    return (
        <Sidebar 
            visible={visible} 
            position="center" 
            onHide={() => {
                onHide(); 
                resetParams();}
            }
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

                <button className="p-button p-component p-button-outlined w-full mt-2" onClick={resetParams}>
                    Clear Filters
                </button>

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
                <br />
                <button className="p-button p-component w-full" onClick={() => {fetchCameras(); setSearch(true)}}
                >
                    Fetch Equipment
                </button>
                

                
                <hr style={{ margin: '20px 0' }} />
                 {/* Display camera data */}
            </div>
                {!searching ? (
                    // 1. Initial State: User hasn't clicked search yet
                    <p className="text-center text-500">
                        Enter search terms above to browse the catalog.
                    </p>
                ) :loading ? (
                    <p>Loading DB data...</p>
                ) : cameras.length > 0 ? (
                    <div>
                        {/* We take only top 5 results */}
                        {cameras.slice(0, 5).map(camera => (
                            <div key={camera.id} style = {{ padding: '5px', borderBottom: '1px solid #ccc'}}>
                                <p><strong>Camera Code:</strong> {camera.modelNumber}</p>
                                <p >Brand: {camera.brand}</p>
                                <p><strong>Camera Type:</strong> {camera.type || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No cameras found in DB.</p>
                )}
        </Sidebar>
    )
}
