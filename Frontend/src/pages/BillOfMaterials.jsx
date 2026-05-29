import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../services/api";
import AppLayout from "../Components/AppLayout";
import "../page_styling/bom.css";

const TAX_RATE = 0.1;
const SERVICES_RATE = 0.05;
const CATEGORY_COLORS = {
  Camera: "#245d91",
  Networking: "#2e7d32",
};
const DEFAULT_CATEGORY_COLOR = "#7b1fa2";

/*
The BillOfMaterials page summarises every placed item for the active project
as a quote-style document. It pulls placements from the backend, lets the
user switch currency (AUD ↔ PGK via live exchange rates), computes subtotal,
10% tax and 5% services, and supports exporting the BOM to PDF (jsPDF +
jspdf-autotable) or Excel (SheetJS).
*/
function BillOfMaterials({ onLogout }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const projectId = state?.projectId;

  const [currency, setCurrency] = useState("AUD");
  const [rates, setRates] = useState({ AUD: 1, PGK: 2.45 });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/AUD")
      .then((r) => r.json())
      .then((d) => setRates({ AUD: 1, PGK: d.rates.PGK }))
      .catch((err) => console.error("Failed to fetch exchange rates", err));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setError("No project selected");
      setLoading(false);
      return;
    }
    api
      .get(`/api/camerplacements/project/${projectId}`)
      .then((res) => setProducts(res.data))
      .catch(() => setError("Failed to load project data"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const rate = rates[currency];
  const { subtotal, tax, services, total } = useMemo(() => {
    const sub = products.reduce((s, p) => s + p.unitPrice * p.quantity, 0) * rate;
    const t = sub * TAX_RATE;
    const sv = sub * SERVICES_RATE;
    return { subtotal: sub, tax: t, services: sv, total: sub + t + sv };
  }, [products, rate]);

  const format = (v) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(v);
  const fixed = (v) => v.toFixed(2);

  // Builds a styled PDF report (header + product table + totals block) using
  // jsPDF/autoTable and triggers a download.
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(36, 93, 145);
    doc.text("Bill of Materials Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Category", "Product", "Type", "Qty", "Unit Price", `Total (${currency})`]],
      body: products.map((p) => [
        p.category,
        `${p.name} (${p.manufacturer})`,
        p.type,
        p.quantity,
        fixed(p.unitPrice * rate),
        fixed(p.unitPrice * p.quantity * rate),
      ]),
      headStyles: { fillColor: [36, 93, 145] },
    });

    const y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${fixed(subtotal)} ${currency}`, 140, y);
    doc.text(`Tax (10%): ${fixed(tax)} ${currency}`, 140, y + 7);
    doc.text(`Services (5%): ${fixed(services)} ${currency}`, 140, y + 14);
    doc.setFont(undefined, "bold");
    doc.text(`Grand Total: ${fixed(total)} ${currency}`, 140, y + 24);

    doc.save(`BOM_Export_${Date.now()}.pdf`);
  };

  // Writes the same product list to a single-sheet .xlsx workbook so users
  // can edit or import the BOM elsewhere.
  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      products.map((p) => ({
        Category: p.category,
        Manufacturer: p.manufacturer,
        Product: p.name,
        Type: p.type,
        Quantity: p.quantity,
        [`Unit Price (${currency})`]: fixed(p.unitPrice * rate),
        [`Total (${currency})`]: fixed(p.unitPrice * p.quantity * rate),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BOM");
    XLSX.writeFile(wb, `BOM_Export_${Date.now()}.xlsx`);
  };

  const nav = [
    {
      label: "← Back to Project",
      onClick: () =>
        navigate(projectId ? "/app/design" : "/app/projects", {
          state: projectId ? { projectId } : undefined,
        }),
    },
  ];

  return (
    <AppLayout className="bom-page" nav={nav} onLogout={onLogout} mainClassName="bom-main">
      <h1>Bill of Materials</h1>

      {loading && <p>Loading project data...</p>}
      {error && <p className="bom-error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="currency-box">
            <label>Project Currency:</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {Object.keys(rates).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {products.length === 0 ? (
            <p>No equipment placed in this project yet.</p>
          ) : (
            products.map((p, i) => (
              <div className="bom-card" key={i}>
                <span
                  className="bom-category"
                  style={{ backgroundColor: CATEGORY_COLORS[p.category] ?? DEFAULT_CATEGORY_COLOR }}
                >
                  {p.category}
                </span>
                <div className="bom-details">
                  <b>{p.manufacturer}</b>
                  <p>{p.name}</p>
                  <p className="bom-type">{p.type}</p>
                </div>
                <div className="bom-qty">Qty: {p.quantity}</div>
                <div className="bom-price">{format(p.unitPrice * rate)}</div>
                <div className="bom-total">{format(p.unitPrice * p.quantity * rate)}</div>
              </div>
            ))
          )}

          <div className="bom-summary">
            <p><span>Subtotal:</span> <span>{fixed(subtotal)} {currency}</span></p>
            <p><span>Tax (10%):</span> <span>{fixed(tax)} {currency}</span></p>
            <p><span>Services:</span> <span>{fixed(services)} {currency}</span></p>
            <h3><span>Grand Total:</span> <span>{fixed(total)} {currency}</span></h3>

            <div className="bom-actions">
              <button onClick={handleExportPDF} className="export-btn">Export PDF</button>
              <button onClick={handleExportExcel} className="export-btn export-btn--excel">Export Excel</button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}

export default BillOfMaterials;
