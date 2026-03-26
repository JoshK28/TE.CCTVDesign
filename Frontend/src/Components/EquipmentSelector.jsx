import { Sidebar } from 'primereact/sidebar';
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function EquipmentSelector({ visible }) {

    const [testCamera, setTestCamera] = useState(null); // 2. State for your DB camera
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchFirstCamera = async () => {
            try {
                const res = await api.get("/api/cameras");
                console.log("Full res.data payload:", res.data);
                if (res.data && res.data.length > 0) {
                    setTestCamera(res.data[0]); 
                }
            } catch (err) {
                console.error("Error fetching cameras:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFirstCamera();
    }, []);

    return (
        <div>
            <Sidebar 
                visible={visible} 
                position="center" 
                onHide={() => {}}
                style={{ width: '300px' }}
            >
                <div className="test-section" style={{ marginTop: '20px', color: 'blue' }}>
                    <h3>DB Test (First Camera)</h3>
                    {loading ? (
                        <p>Loading DB data...</p>
                    ) : testCamera ? (
                        <div>
                            <p><strong>DB ID:</strong> {testCamera.id}</p>
                            <p><strong>DB Name:</strong> {testCamera.type || 'N/A'}</p>

                            
                        </div>
                    ) : (
                        <p>No cameras found in DB.</p>
                    )}
                </div>
            </Sidebar>
            
        </div>
    )
}
