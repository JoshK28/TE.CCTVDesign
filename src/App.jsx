import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import DesignPage from './DesignPage';
import './styles.css'; // Import the styles

function App() {
  const [view, setView] = useState('upload');
  

  const [imageSrc, setImageSrc] = useState(null);


  const handleUploadSuccess = (src) => {
    setImageSrc(src);
  };


  const handleNavigateToDesign = () => {
    setView('design');
  };


  const handleNavigateBack = () => {
    setView('upload');
  };

  return (
    <div className="App">

      {view === 'upload' && (
        <div className="upload-view">
          <header className="App-header">
            <h1>CCTV Design Tool</h1>
            <p>Step 1: Upload your site layout (.png)</p>
          </header>
          <ImageUploader 
            onImageUpload={handleUploadSuccess} 
            currentImageSrc={imageSrc}
          />
          
          {imageSrc && (
            <button 
              className="nav-button" 
              onClick={handleNavigateToDesign}
            >
              Go to Design Process
            </button>
          )}
        </div>
      )}

      {view === 'design' && (
        <DesignPage 
          imageSrc={imageSrc} 
          onBack={handleNavigateBack} 
        />
      )}
    </div>
  );
}

export default App;