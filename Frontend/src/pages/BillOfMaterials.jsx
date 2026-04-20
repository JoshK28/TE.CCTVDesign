import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../page_styling/bom.css";
import tePNGLogo from "../assets/logo.png";

import photo1 from '../assets/photo1.jpg';

function BillOfMaterials({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // CURRENCY
  const [currency, setCurrency] = useState("USD");
  const rate = { USD: 1, EUR: 0.93, AUD: 1.5, PGK: 3.5, ZAR: 18.2 };

  // SAMPLE PRODUCT DATA – you can replace with API data
  const [products, setProducts] = useState([
    {
      id: 1,
      img: photo1,
      manufacturer: "AXIS",
      name: "Q1798-LE 4K Camera",
      type: "Fixed Bullet",
      quantity: 2,
      unitPrice: 480,
    },
    {
      id: 2,
      img: null,
      manufacturer: "HikVision",
      name: "DS-2CD2142FWD",
      type: "Dome Camera",
      quantity: 1,
      unitPrice: 120,
    },
    {
      id: 3,
      img: null,
      manufacturer: "UNV",
      name: "IPC324LR3",
      type: "Vandal Dome",
      quantity: 2,
      unitPrice: 150,
    },
  ]);

  const handleImageUpload = (id, file) => {
    const preview = URL.createObjectURL(file);
    const updated = products.map((p) =>
      p.id === id ? { ...p, img: preview } : p
    );
    setProducts(updated);
  };

  const subtotal = products.reduce(
    (sum, p) => sum + p.unitPrice * p.quantity,
    0
  );

  const convertedSubtotal = (subtotal * rate[currency]).toFixed(2);

  const tax = (convertedSubtotal * 0.1).toFixed(2); // 10% example tax
  const services = (convertedSubtotal * 0.05).toFixed(2); // 5% example
  const finalTotal = (
    Number(convertedSubtotal) +
    Number(tax) +
    Number(services)
  ).toFixed(2);

  return (
    <div className="bom-layout">
      {/* Sidebar */}
      <aside className="bom-sidebar">
        <img src={tePNGLogo} className="bom-logo" alt="Logo" />

        <nav className="sidebar-nav">
          <button
            onClick={() => navigate("/app/storage")}
            className={`sidebar-btn ${
              location.pathname === "/app/storage" ? "active" : ""
            }`}
          >
            💾 Storage Calculator
          </button>
          <button
            onClick={() => navigate("/app/ups")}
            className={`sidebar-btn ${
              location.pathname === "/app/ups" ? "active" : ""
            }`}
          >
            🔋 UPS Calculator
          </button>
          <button
            onClick={() => navigate("/app/bom")}
            className={`sidebar-btn ${
              location.pathname === "/app/bom" ? "active" : ""
            }`}
          >
            📦 Bill of Materials
          </button>
        </nav>

        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="bom-main">
        <h1>Bill of Materials</h1>

        {/* Currency Selector */}
        <div className="currency-box">
          <label>Currency:</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option>USD</option>
            <option>EUR</option>
            <option>AUD</option>
            <option>PGK</option>
            <option>ZAR</option>
          </select>
        </div>

        {/* Product Cards */}
        {products.map((p) => (
          <div className="bom-card" key={p.id}>
            {/* IMAGE */}
            <div className="bom-imagebox">
              {p.img ? (
                <img src={p.img} alt="Product" className="bom-image" />
              ) : (
                <div className="placeholder">
                  <label htmlFor={`img-${p.id}`}>Upload Image</label>
                </div>
              )}
              <input
                type="file"
                id={`img-${p.id}`}
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleImageUpload(p.id, e.target.files[0])}
              />
            </div>

            {/* DETAILS */}
            <div className="bom-details">
              <p><b>{p.manufacturer}</b></p>
              <p>{p.name}</p>
              <p>{p.type}</p>
            </div>

            {/* Pricing */}
            <div className="bom-qty">{p.quantity}</div>
            <div className="bom-unit">
              {(p.unitPrice * rate[currency]).toFixed(2)} {currency}
            </div>
            <div className="bom-total">
              {(p.unitPrice * p.quantity * rate[currency]).toFixed(2)} {currency}
            </div>
          </div>
        ))}

        {/* SUMMARY */}
        <div className="bom-summary">
          <p>Total Products: {convertedSubtotal} {currency}</p>
          <p>Total Tax: {tax} {currency}</p>
          <p>Total Services: {services} {currency}</p>
          <h3>Total: {finalTotal} {currency}</h3>

          <button className="export-btn">Export List of BOM</button>
        </div>
      </main>
    </div>
  );
}

export default BillOfMaterials;
