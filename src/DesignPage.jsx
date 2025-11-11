import React, { useState } from 'react';


const CameraIcon = ({ x, y }) => (
  <div 
    className="camera-icon" 
    style={{ left: x, top: y }}
    title={`Camera at (${Math.round(x)}, ${Math.round(y)})`}
  >
    📷
  </div>
);

function DesignPage({ imageSrc, onBack }) {

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


  if (!imageSrc) {
    return (
      <div>
        <p>No image found. Please go back and upload one.</p>
        <button onClick={onBack} className="back-button">
          Back
        </button>
      </div>
    );
  }

  return (
        <div className="design-page-container">
            <p>ddd</p>
            <button onClick={onBack} className="back-button">
                &larr; Back to Upload
            </button>
            
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