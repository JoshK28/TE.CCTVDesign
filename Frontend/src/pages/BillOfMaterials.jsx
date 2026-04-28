import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../page_styling/bom.css";
import tePNGLogo from "../assets/logo.png";

function BillOfMaterials({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // CURRENCY
  const [currency, setCurrency] = useState("USD");
  const rate = { USD: 1, EUR: 0.93, AUD: 1.5, PGK: 3.5, ZAR: 18.2 };

  // SAMPLE PRODUCT DATA
  const [products, setProducts] = useState([
    {
      id: 1,
      img: null,
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

  // Calculations
  const currentRate = rate[currency];
  const subtotal = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  const convertedSubtotal = (subtotal * currentRate).toFixed(2);
  const tax = (convertedSubtotal * 0.1).toFixed(2);
  const services = (convertedSubtotal * 0.05).toFixed(2);
  const finalTotal = (
    Number(convertedSubtotal) +
    Number(tax) +
    Number(services)
  ).toFixed(2);

  // PDF EXPORT LOGIC
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(18);
    doc.text("Bill of Materials", 14, 20);
    doc.setFontSize(10);
    doc.text(`Currency: ${currency}`, 14, 28);

    // Prepare Table Data
    const tableRows = products.map((p) => [
      "", // Placeholder for Image column
      `${p.name}\n(${p.manufacturer})`,
      p.type,
      p.quantity,
      `${(p.unitPrice * currentRate).toFixed(2)} ${currency}`,
      `${(p.unitPrice * p.quantity * currentRate).toFixed(2)} ${currency}`,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Image", "Product", "Type", "Qty", "Unit Price", "Total"]],
      body: tableRows,
      didDrawCell: (data) => {
        // Render images in the first column if they exist
        if (data.column.index === 0 && data.cell.section === "body") {
          const product = products[data.row.index];
          if (product.img) {
            doc.addImage(product.img, "JPEG", data.cell.x + 2, data.cell.y + 2, 10, 10);
          }
        }
      },
      styles: { valign: "middle" },
      columnStyles: {
        0: { cellWidth: 15 }, // Image column width
      },
    });

    // Summary Section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${convertedSubtotal} ${currency}`, 140, finalY);
    doc.text(`Tax (10%): ${tax} ${currency}`, 140, finalY + 7);
    doc.text(`Services (5%): ${services} ${currency}`, 140, finalY + 14);
    
    doc.setFont(undefined, "bold");
    doc.text(`Total: ${finalTotal} ${currency}`, 140, finalY + 24);

    doc.save(`BOM_Export_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="bom-layout">
      {/* Sidebar */}
      <aside className="bom-sidebar">
        <img src={tePNGLogo} className="bom-logo" alt="Logo" />
        <nav className="sidebar-nav">
          <button onClick={() => navigate("/app/calculator")} className={`sidebar-btn ${location.pathname === "/app/calculator" ? "active" : ""}`}>
            💾 Storage Calculator
          </button>
          <button onClick={() => navigate("/app/ups")} className={`sidebar-btn ${location.pathname === "/app/ups" ? "active" : ""}`}>
            🔋 UPS Calculator
          </button>
          <button onClick={() => navigate("/app/bom")} className={`sidebar-btn ${location.pathname === "/app/bom" ? "active" : ""}`}>
            📦 Bill of Materials
          </button>
        </nav>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </aside>

      {/* Main */}
      <main className="bom-main">
        <h1>Bill of Materials</h1>

        <div className="currency-box">
          <label>Currency:</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {Object.keys(rate).map((curr) => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>

        {/* Product Cards */}
        {products.map((p) => (
          <div className="bom-card" key={p.id}>
            <div className="bom-imagebox">
              {p.img ? (
                <label htmlFor={`img-${p.id}`} style={{ cursor: "pointer" }}>
                  <img src={p.img} alt="Product" className="bom-image" />
                </label>
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

            <div className="bom-details">
              <p><b>{p.manufacturer}</b></p>
              <p>{p.name}</p>
              <p>{p.type}</p>
            </div>

            <div className="bom-qty">{p.quantity}</div>
            <div className="bom-unit">
              {(p.unitPrice * currentRate).toFixed(2)} {currency}
            </div>
            <div className="bom-total">
              {(p.unitPrice * p.quantity * currentRate).toFixed(2)} {currency}
            </div>
          </div>
        ))}

        {/* SUMMARY */}
        <div className="bom-summary">
          <p>Total Products: {convertedSubtotal} {currency}</p>
          <p>Total Tax: {tax} {currency}</p>
          <p>Total Services: {services} {currency}</p>
          <h3>Total: {finalTotal} {currency}</h3>

          <button onClick={handleExportPDF} className="export-btn">
            Export List of BOM
          </button>
        </div>
      </main>
    </div>
  );
}

export default BillOfMaterials;