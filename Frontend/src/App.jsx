import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ImageUploader from './pages/ImageUploader';
import DesignPage from './pages/DesignPage';
import Login from './pages/login';
import Register from './pages/register';
import Home from './pages/home_page';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/Project_list';
import StorageCalculator from './pages/StorageCalculator';
import UPSCalculator from './pages/UPSCalculator';
import BillOfMaterials from './pages/BillOfMaterials';

import './styles.css';
import "primereact/resources/themes/lara-light-cyan/theme.css";

/*The App component is the Main root component of the CCTV Design Tool frontend pages. It manages the state of the current user view to navigate between jsx pages.
*/
function App() {
  const isLoggedIn = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    // Use replace so browser back does not re-open protected pages.
    window.location.replace("/");
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        

        {/* protected routes - require login */}
        <Route path="/app/calculator" element={isLoggedIn ? <StorageCalculator onLogout={handleLogout} />: <Navigate to="/login" replace />} />
        <Route path="/app/ups" element={isLoggedIn ? <UPSCalculator onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/app/bom" element={isLoggedIn ? <BillOfMaterials onLogout={handleLogout} />: <Navigate to="/login" replace />} />


        <Route
          path="/app/dashboard"
          element={isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/app/upload"
          element={isLoggedIn ? <ImageUploader onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/app/design"
          element={isLoggedIn ? <DesignPage onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/app/projects"
          element={isLoggedIn ? <ProjectList onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />


        {/* catch-all: redirect /app to dashboard */}
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;