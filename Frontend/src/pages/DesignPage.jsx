import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toolbar from '../Components/Toolbar.jsx';
import Equipment from '../Components/Equipment.jsx';
import AttributesBar from '../Components/AttributesBar.jsx';
import api from '../services/api';

function Workspace({ imageSrc }) {
  const [activeTool, setActiveTool] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [itemSelected, setSelectedItem] = useState(null);

  const handleNewItem = (event) => {
    event.preventDefault();

    const toolToPlace = event.dataTransfer ? event.dataTransfer.getData('tool') : activeTool;

    if (!toolToPlace) {
      setSelectedItem(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newId = Date.now();
    setEquipment(prev => [...prev, { id: newId, type: toolToPlace, x, y }]);
    setActiveTool(null);
  };

  const handleUpdatePosition = (id, newX, newY) => {
    setEquipment(prev => prev.map(item =>
      item.id === id ? { ...item, x: newX, y: newY } : item
    ));
  };

  return (
    <div className="design-workspace">
      {/* Left Toolbar */}
      <div className="toolbar-sidebar">
        <Toolbar onSelectTool={setActiveTool} />
      </div>

      <div
        className="image-fullscreen-wrapper"
        onClick={handleNewItem}
        onDrop={handleNewItem}
        onDragOver={(e) => { e.preventDefault(); }}
      >
        <img
          src={imageSrc}
          alt="Full-screen design layout"
          className="fullscreen-image"
          draggable="false"
        />
        {equipment.map(equipment => (
          <Equipment
            key={equipment.id}
            id={equipment.id}
            type={equipment.type}
            x={equipment.x}
            y={equipment.y}
            isSelected={itemSelected === equipment.id}
            onSelect={setSelectedItem}
            onUpdatePosition={handleUpdatePosition}
          />
        ))}
        <p className="item-count">Items Placed: {equipment.length}</p>
      </div>

      <AttributesBar
        selectedItemId={itemSelected}
        equipment={equipment}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

/*
The DesignPage component is the main project page interface allowing users to place equipment such as cameras to uploaded floor plans.
*/
function DesignPage({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const projectId = location.state?.projectId;
  const imageSrcFromState = location.state?.imageSrc;

  const [floorLayouts, setFloorLayouts] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (imageSrcFromState) {
      setLoading(false);
      return;
    }

    if (!projectId) {
      navigate('/app/upload');
      return;
    }

    const fetchFloorLayouts = async () => {
      try {
        const res = await api.get(`/api/floorlayouts/${projectId}`);
        setFloorLayouts(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch floor layouts", err);
        setLoading(false);
      }
    };

    fetchFloorLayouts();
  }, [projectId, imageSrcFromState, navigate]);

  if (loading) return <p>Loading floor layouts...</p>;

  const currentImageSrc = imageSrcFromState
    ? imageSrcFromState
    : floorLayouts.length > 0
      ? `http://localhost:5113/api/floorlayouts/image/${floorLayouts[selectedLayer]?.floorID}`
      : null;

  if (!currentImageSrc) return <p>No floor layouts found for this project.</p>;

  return (
    <div className="design-page-container">

      {/* top bar with back button */}
      <div className="design-topbar">
        <button onClick={() => navigate('/app/projects')} className="back-button">
          &larr; Back to Project List
        </button>
      </div>

      {/* image workspace area */}
      <Workspace imageSrc={currentImageSrc} />

      {/* layer selector at bottom center - only shows if multiple layers NEEDS TO BE PUT INTO A CSS FILE I'VE ONLY INLINE CODE FOR NOW TO SEE AND TEST*/} 
      {floorLayouts.length > 1 && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "10px",
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "10px 20px",
          borderRadius: "30px",
          zIndex: 1000
        }}>
          {floorLayouts.map((layout, index) => (
            <button
              key={layout.floorID}
              onClick={() => setSelectedLayer(index)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                cursor: "pointer",
                backgroundColor: selectedLayer === index ? "#007bff" : "#fff",
                color: selectedLayer === index ? "#fff" : "#000",
                fontWeight: selectedLayer === index ? "bold" : "normal"
              }}
            >
              Layer {layout.layer}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DesignPage;