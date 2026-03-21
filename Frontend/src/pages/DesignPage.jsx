import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toolbar from '../Components/Toolbar.jsx';
import Equipment from '../Components/Equipment.jsx';
        
function Workspace({ imageSrc}) {

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

        <div className="image-fullscreen-wrapper"
          onClick={handleNewItem} 
          onDrop={handleNewItem}
          onDragOver={(e) => {e.preventDefault();}}
        >
          <img 
            src={imageSrc} 
            alt="Full-screen design layout" 
            className="fullscreen-image" 
            draggable="false" 
          />
          {equipment.map(equipment => (
            <Equipment key={equipment.id} 
            id = {equipment.id}
            type={equipment.type} 
            x={equipment.x} 
            y={equipment.y} 
            isSelected={itemSelected === equipment.id}
            onSelect={setSelectedItem}
            onUpdatePosition={handleUpdatePosition} />
          ))}
          <p className="item-count">Items Placed: {equipment.length} </p>
      </div>
    </div>
  );
 }
/*
The DesignPage component is the main project page interface allowing users to place equipment such as cameras to uploaded floor plans.
*/

function DesignPage({ onLogout }) {

  const location = useLocation();
  const navigate = useNavigate();
  const imageSrc = location.state?.imageSrc;


  useEffect(() => {
    if (!imageSrc) {navigate('/app/upload');}
  }, [imageSrc, navigate]);


  if (!imageSrc) return null;

  return (
    <div className="design-page-container">

      <div className="design-topbar">
        <button onClick={() => navigate('/app/upload')} className="back-button">
          &larr; Back to Upload
        </button>
      </div>

      {/* Image area */}
      <Workspace imageSrc={imageSrc}/>
    </div>
  );
}
export default DesignPage;