import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ImageUploader from './pages/ImageUploader';
import DesignPage from './pages/DesignPage';
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/home_page';
import './styles.css';

function MainApp({ onLogout }) {
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
            <button onClick={onLogout} className="logout-button">
              Logout
            </button>
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app"
          element={isLoggedIn ? <MainApp onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 