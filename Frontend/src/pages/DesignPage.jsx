import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toolbar from '../Components/Toolbar.jsx';

/*
The DesignPage component is the main project page interface allowing users to place equipment such as cameras to uploaded floor plans.
*/

function CameraIcon({ x, y }) {
  return (
    <div
      className="camera-icon"
      style={{ left: x, top: y }}
      title={`Camera at (${Math.round(x)}, ${Math.round(y)})`}
    >
      📷
    </div>
  );
}

function DesignPage({ onLogout }) {

  const location = useLocation();
  const navigate = useNavigate();
  
  const imageSrc = location.state?.imageSrc;

  useEffect(() => {
    if (!imageSrc) {
      navigate('/app/upload');
    }
  }, [imageSrc, navigate]);

  if (!imageSrc) return null;

  const [cameras, setCameras] = useState([]);

  const handleImageClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newCamera = {
      id: Date.now(), 
      x: x,
      y: y,
    };

    setCameras(prevCameras => [...prevCameras, newCamera]);
  };

  return (
    <div className="design-page-container">

      <button onClick={() => navigate('/app/upload')} className="back-button">
        &larr; Back to Upload
      </button>
      
       <Toolbar />
      
      <div 
        className="image-fullscreen-wrapper"
        onClick={handleImageClick} 
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
      <p className="camera-count">Cameras Placed: {cameras.length}</p>
    </div>
  );
}

export default DesignPage;