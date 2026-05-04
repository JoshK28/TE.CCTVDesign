import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../page_styling/upsCalculator.css";
import tePNGLogo from "../assets/logo.png";
import api from "../services/api";

function UPSCalculator({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const fallbackLibrary = [
    { name: "AXIS QD536 8MP Dome", powerWatts: 15, defaultUnits: 1 },
    { name: "HikVision DS-2CD2142FWD", powerWatts: 12, defaultUnits: 1 },
    { name: "NVR 16CH 4K", powerWatts: 40, defaultUnits: 1 },
    { name: "Network Switch PoE 8-port", powerWatts: 60, defaultUnits: 1 },
  ];

  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState("");

  const [rows, setRows] = useState([{ id: 1, product: "", power: 0, units: 1 }]);
  const [batterySize, setBatterySize] = useState(100);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/ups/devices");
        setCatalog(res.data ?? []);
        setCatalogError("");
      } catch {
        setCatalog(fallbackLibrary);
        setCatalogError("Could not load UPS catalog from API; using offline defaults.");
      }
    };
    load();
  }, []);

  const addRow = () => setRows([...rows, { id: Date.now(), product: "", power: 0, units: 1 }]);
  const removeRow = () => { if (rows.length > 1) setRows(rows.slice(0, -1)); };

  const totalPower = rows.reduce((sum, r) => sum + r.power * r.units, 0);
  const predictedUptime = ((batterySize * 12 * 0.8) / (totalPower || 1)).toFixed(2);

  return (
    <div className="ups-layout">
      <aside className="ups-sidebar">
        <img src={tePNGLogo} alt="Logo" className="ups-logo" />

        <nav className="sidebar-nav">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="sidebar-btn"
          >
            ⬅ Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/app/calculator")}
            className={`sidebar-btn ${location.pathname === "/app/calculator" ? "active" : ""}`}
          >
            💾 Storage Calculator
          </button>
          <button
            onClick={() => navigate("/app/ups")}
            className={`sidebar-btn ${location.pathname === "/app/ups" ? "active" : ""}`}
          >
            🔋 UPS Calculator
          </button>
        </nav>

        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </aside>

      <main className="ups-main">
        <h1>UPS Calculator</h1>
        {catalogError && <p style={{ color: "tomato" }}>{catalogError}</p>}

        <div className="controls">
          <button className="add-btn" onClick={addRow}>+</button>
          <button className="remove-btn" onClick={removeRow}>−</button>
        </div>

        <table className="ups-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Power (W)</th>
              <th>Units</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <select
                    value={r.product}
                    onChange={(e) => {
                      const selected = catalog.find((p) => p.name === e.target.value);
                      const updated = [...rows];
                      updated[i].product = e.target.value;
                      updated[i].power = selected ? selected.powerWatts : 0;
                      updated[i].units = selected?.defaultUnits ?? 1;
                      setRows(updated);
                    }}
                  >
                    <option value="">Select Device</option>
                    {catalog.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={r.power}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[i].power = Number(e.target.value);
                      setRows(updated);
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={r.units}
                    onChange={(e) => {
                      const updated = [...rows];
                      updated[i].units = Number(e.target.value);
                      setRows(updated);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="power-summary">
          <p><strong>Overall Power Consumption:</strong> {totalPower} W</p>

          <div className="battery-input">
            <label>Battery Size (Ah): </label>
            <input
              type="number"
              value={batterySize}
              onChange={(e) => setBatterySize(e.target.value)}
            />
          </div>

          <div className="result-box-ups">
            <div>
              <h4>Battery Size</h4>
              <p>{batterySize} Ah</p>
            </div>
            <div>
              <h4>Predicted Uptime</h4>
              <p>{predictedUptime} Hours</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UPSCalculator;
