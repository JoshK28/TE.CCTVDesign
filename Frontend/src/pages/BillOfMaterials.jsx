import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "../page_styling/bom.css";
import tePNGLogo from "../assets/logo.png";
import photo1 from '../assets/photo1.jpg';

function BillOfMaterials({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [currency, setCurrency] = useState("USD");
  const rate = { USD: 1, EUR: 0.93, AUD: 1.5, PGK: 3.5, ZAR: 18.2 };

  const [products, setProducts] = useState([
    { id: 1, img: photo1, manufacturer: "AXIS", name: "Q1798-LE 4K Camera", type: "Fixed Bullet", quantity: 2, unitPrice: 480 },
    { id: 2, img: null, manufacturer: "HikVision", name: "DS-2CD2142FWD", type: "Dome Camera", quantity: 1, unitPrice: 120 },
    { id: 3, img: null, manufacturer: "UNV", name: "IPC324LR3", type: "Vandal Dome", quantity: 2, unitPrice: 150 },
  ]);

  const handleImageUpload = (id, file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setProducts(products.map((p) => p.id === id ? { ...p, img: preview } : p));
  };

  const currentRate = rate[currency];
  const subtotal = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  const convertedSubtotal = (subtotal * currentRate).toFixed(2);
  const tax = (convertedSubtotal * 0.1).toFixed(2);
  const services = (convertedSubtotal * 0.05).toFixed(2);
  const finalTotal = (Number(convertedSubtotal) + Number(tax) + Number(services)).toFixed(2);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(36, 93, 145);
    doc.text("Bill of Materials Report", 14, 20);
    
    const tableRows = products.map((p) => [
      "", 
      `${p.name} (${p.manufacturer})`,
      p.type,
      p.quantity,
      `${(p.unitPrice * currentRate).toFixed(2)}`,
      `${(p.unitPrice * p.quantity * currentRate).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Image", "Product", "Type", "Qty", "Unit Price", `Total (${currency})`]],
      body: tableRows,
      headStyles: { fillColor: [36, 93, 145] },
      didDrawCell: (data) => {
        if (data.column.index === 0 && data.cell.section === "body") {
          const product = products[data.row.index];
          if (product.img) {
            doc.addImage(product.img, "JPEG", data.cell.x + 2, data.cell.y + 2, 10, 10);
          }
        }
      },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${convertedSubtotal} ${currency}`, 140, finalY);
    doc.text(`Tax (10%): ${tax} ${currency}`, 140, finalY + 7);
    doc.text(`Services (5%): ${services} ${currency}`, 140, finalY + 14);
    doc.setFont(undefined, "bold");
    doc.text(`Grand Total: ${finalTotal} ${currency}`, 140, finalY + 24);

    doc.save(`BOM_Export_${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheetData = products.map((p) => ({
      Manufacturer: p.manufacturer,
      Product: p.name,
      Type: p.type,
      Quantity: p.quantity,
      [`Unit Price (${currency})`]: (p.unitPrice * currentRate).toFixed(2),
      [`Total (${currency})`]: (p.unitPrice * p.quantity * currentRate).toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BOM");
    XLSX.writeFile(workbook, `BOM_Export_${Date.now()}.xlsx`);
  };

  return (
    <div className="bom-layout">
      <aside className="bom-sidebar">
        <img src={tePNGLogo} className="bom-logo" alt="Logo" />
        <nav className="sidebar-nav">
          <button onClick={() => navigate("/app/dashboard")} className="sidebar-btn">← Back to Dashboard</button>
          <button onClick={() => navigate("/app/calculator")} className={`sidebar-btn ${location.pathname.includes("calculator") ? "active" : ""}`}>📊 Storage Calculator</button>
          <button onClick={() => navigate("/app/ups")} className={`sidebar-btn ${location.pathname.includes("ups") ? "active" : ""}`}>🔋 UPS Calculator</button>
          <button onClick={() => navigate("/app/bom")} className={`sidebar-btn ${location.pathname.includes("bom") ? "active" : ""}`}>📦 Bill of Materials</button>
        </nav>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </aside>

      <main className="bom-main">
        <h1>Bill of Materials</h1>

        <div className="currency-box">
          <label>Project Currency:</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {Object.keys(rate).map((curr) => <option key={curr} value={curr}>{curr}</option>)}
          </select>
        </div>

        {products.map((p) => (
          <div className="bom-card" key={p.id} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 100px 120px 150px',
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '15px',
            alignItems: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}>
            <div className="image-box" style={{ width: '100px', height: '80px', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={p.img || 'placeholder.png'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="details">
              <b style={{ color: '#245d91' }}>{p.manufacturer}</b>
              <p style={{ margin: 0 }}>{p.name}</p>
            </div>
            <div className="qty">Qty: {p.quantity}</div>
            <div className="price">{p.unitPrice}</div>
            <div className="total" style={{ textAlign: 'right', fontWeight: 'bold', color: '#245d91' }}>
              {(p.unitPrice * p.quantity).toFixed(2)} {currency}
            </div>
          </div>
          ))}

        <div className="bom-summary">
          <p><span>Subtotal:</span> <span>{convertedSubtotal} {currency}</span></p>
          <p><span>Tax (10%):</span> <span>{tax} {currency}</span></p>
          <p><span>Services:</span> <span>{services} {currency}</span></p>
          <h3><span>Grand Total:</span> <span>{finalTotal} {currency}</span></h3>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button onClick={handleExportPDF} className="export-btn">Export PDF</button>
            <button onClick={handleExportExcel} className="export-btn" style={{ backgroundColor: "#2e7d32" }}>Export Excel</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BillOfMaterials;