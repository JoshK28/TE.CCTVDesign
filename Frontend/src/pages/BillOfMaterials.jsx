import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../services/api";
import "../page_styling/bom.css";
import tePNGLogo from "../assets/logo.png";

function BillOfMaterials({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // get projectId passed from design page
  const projectId = location.state?.projectId;

  const [currency, setCurrency] = useState("USD");
  const rate = { USD: 1, EUR: 0.93, AUD: 1.5, PGK: 3.5, ZAR: 18.2 };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // fetch placements from backend when page loads
  useEffect(() => {
    if (!projectId) {
      setError("No project selected");
      setLoading(false);
      return;
    }

    const fetchBomData = async () => {
      try {
        const res = await api.get(`/api/camerplacements/project/${projectId}`);
        setProducts(res.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load project data");
        setLoading(false);
      }
    };

    fetchBomData();
  }, [projectId]);

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
      p.category,
      `${p.name} (${p.manufacturer})`,
      p.type,
      p.quantity,
      `${(p.unitPrice * currentRate).toFixed(2)}`,
      `${(p.unitPrice * p.quantity * currentRate).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Category", "Product", "Type", "Qty", "Unit Price", `Total (${currency})`]],
      body: tableRows,
      headStyles: { fillColor: [36, 93, 145] },
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
      Category: p.category,
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
          <button
            onClick={() =>
              projectId ? navigate("/app/design", { state: { projectId } }) : navigate("/app/projects")
              }
            className="sidebar-btn"
          >
            ← Back to Project
          </button>
        </nav>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </aside>

      <main className="bom-main">
        <h1>Bill of Materials</h1>

        {loading && <p>Loading project data...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <>
            <div className="currency-box">
              <label>Project Currency:</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {Object.keys(rate).map((curr) => <option key={curr} value={curr}>{curr}</option>)}
              </select>
            </div>

            {products.length === 0 && (
              <p>No equipment placed in this project yet.</p>
            )}

            {products.map((p, index) => (
              <div className="bom-card" key={index} style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 100px 120px 150px',
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '15px',
                alignItems: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
              }}>
                {/* category badge */}
                <div style={{
                  backgroundColor: p.category === 'Camera' ? '#245d91' :
                                   p.category === 'Networking' ? '#2e7d32' : '#7b1fa2',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  textAlign: 'center'
                }}>
                  {p.category}
                </div>
                <div className="details">
                  <b style={{ color: '#245d91' }}>{p.manufacturer}</b>
                  <p style={{ margin: 0 }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{p.type}</p>
                </div>
                <div className="qty">Qty: {p.quantity}</div>
                <div className="price">
                  {(p.unitPrice * currentRate).toFixed(2)} {currency}
                </div>
                <div className="total" style={{ textAlign: 'right', fontWeight: 'bold', color: '#245d91' }}>
                  {(p.unitPrice * p.quantity * currentRate).toFixed(2)} {currency}
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
          </>
        )}
      </main>
    </div>
  );
}

export default BillOfMaterials;