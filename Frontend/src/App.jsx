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
          path="/app/upload" 
          element={isLoggedIn ? <ImageUploader onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/app/design" 
          element={isLoggedIn ? <DesignPage onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        
        {/* Catch-all: Redirect a basic /app request to the upload screen */}
        <Route path="/app" element={<Navigate to="/app/upload" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 