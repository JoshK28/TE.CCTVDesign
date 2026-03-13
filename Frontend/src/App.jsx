import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ImageUploader from './pages/ImageUploader';
import DesignPage from './pages/DesignPage';
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/home_page';
import './styles.css';



/*The App component is the Main root component of the CCTV Design Tool frontend pages. It manages the state of the current user view to navigate between jsx pages.
*/

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
        <ImageUploader
          onImageUpload={handleUploadSuccess}
          currentImageSrc={imageSrc}
          onLogout={onLogout}
          onNavigateToDesign={handleNavigateToDesign}
        />
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

        {/*testing purposes only, to be removed in final version*/}
        <Route path="/imageUploader" element={<ImageUploader onImageUpload={() => {}} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 