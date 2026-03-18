import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toolbar from '../Components/Toolbar.jsx';
import CameraIcon from '../Components/cameraIcon.jsx';

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

  const [activeTool, setActiveTool] = useState(null);
  const [cameras, setCameras] = useState([]);

  const handleImageClick = (event) => {
    if (activeTool !== 'camera') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newCamera = {
      id: Date.now(), 
      x: x,
      y: y,
    };

    setCameras(prevCameras => [...prevCameras, newCamera]);
    setActiveTool(null);
  };

  if (!imageSrc) return null;

  const cursorStyle = activeTool === 'camera' 
    ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' style='font-size:24px'><text y='20'>📷</text></svg>") 12 12, crosshair`
    : 'default';

  return (
    <div className="design-page-container">

      <div className="design-topbar">
        <button onClick={() => navigate('/app/upload')} className="back-button">
          &larr; Back to Upload
        </button>
        <p className="camera-count">Cameras Placed: {cameras.length}</p>
      </div>

      <div className="design-workspace">
        
        {/* Left Toolbar */}
        <div className="toolbar-sidebar">
          <Toolbar onSelectTool={setActiveTool} />
        </div>
        
        {/* Image area */}
        <div 
          className="image-fullscreen-wrapper"
          onClick={handleImageClick} 
          style={{ cursor: cursorStyle }}
        >
            <img 
              src={imageSrc} 
              alt="Full-screen design layout" 
              className="fullscreen-image" 
            />

            {cameras.map(camera => (
              <CameraIcon key={camera.id} x={camera.x} y={camera.y} />
              
            ))}
        </div>
    </div>
    </div>
  );
}

export default DesignPage;