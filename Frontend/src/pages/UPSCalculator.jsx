import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../Components/AppLayout";
import "../page_styling/upsCalculator.css";
import api from "../services/api";

function UPSCalculator({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const projectId = location.state?.projectId;
  const nav = [
    projectId
      ? {
          label: "← Back to Project",
          onClick: () => navigate("/app/design", { state: { projectId } }),
        }
      : { label: "⬅ Back to Dashboard", to: "/app/dashboard" },
    { label: "📊 Storage Calculator", to: "/app/calculator" },
    { label: "🔋 UPS Calculator", to: "/app/ups" },
  ];

  const [rows, setRows] = useState([{ id: 1, product: "", power: 0, units: 1 }]);
  const [batterySize, setBatterySize] = useState(100);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");

  // auto populate rows if projectId is provided
  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDevices = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/camerplacements/project/${projectId}/devices`);

        if (res.data.upsDevices.length > 0) {
          // group devices by name and count units
          const grouped = res.data.upsDevices.reduce((acc, device) => {
            const existing = acc.find(d => d.product === device.name);
            if (existing) {
              existing.units += 1;
            } else {
              acc.push({
                id: Date.now() + Math.random(),
                product: device.name,
                power: device.power,
                units: 1,
                category: device.category
              });
            }
            return acc;
          }, []);

          setRows(grouped);
        }

        // get project name
        const projectRes = await api.get(`/api/projects/${projectId}`);
        setProjectName(projectRes.data.title);
      } catch (err) {
        console.error("Failed to load project devices", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDevices();
  }, [projectId]);

  const addRow = () =>
    setRows((prev) => [...prev, { id: Date.now(), product: "", power: 0, units: 1 }]);
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (index, patch) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const totalPower = rows.reduce((sum, r) => sum + r.power * r.units, 0);
  const predictedUptime = ((batterySize * 12 * 0.8) / (totalPower || 1)).toFixed(2);

  return (
    <AppLayout
      className="ups-page"
      nav={nav}
      onLogout={onLogout}
      mainClassName="ups-main"
    >
        <h1>UPS Calculator</h1>
        {projectId && projectName && (
          <p style={{ color: '#245d91', fontWeight: 'bold' }}>
            Project: {projectName}
          </p>
        )}
        
        {loading && <p>Loading project devices...</p>}

        <div className="controls">
          <button className="add-btn" onClick={addRow}>+ Add Device</button>
        </div>

        <table className="ups-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Power (W)</th>
              <th>Units</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <input
                    type="text"
                    value={r.product}
                    onChange={(e) => updateRow(i, { product: e.target.value })}
                    placeholder="Device name"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={r.category ?? ""}
                    onChange={(e) => updateRow(i, { category: e.target.value })}
                    placeholder="Category"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={r.power}
                    min="0"
                    onChange={(e) => updateRow(i, { power: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={r.units}
                    onChange={(e) => updateRow(i, { units: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <button className="delete-btn" onClick={() => removeRow(r.id)}>🗑</button>
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
              min="0"
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
    </AppLayout>
  );
}

export default UPSCalculator;