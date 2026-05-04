import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../page_styling/StorageCalculator.css";
import tePNGLogo from "../assets/logo.png";

function StorageNetworkCalculator({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Channel data
  const [channels, setChannels] = useState([
    { id: 1, name: "Channel 1", standard: "PAL", encoding: "H.264", resolution: "12MP (4000x3000)", fps: 25, bitrate: 20480 }
  ]);
  
  const [diskSpaceTB, setDiskSpaceTB] = useState(4);
  const [recordHours, setRecordHours] = useState(24);
  const [retentionDays, setRetentionDays] = useState(30);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("saving");

  // Add new channel
  const addChannel = () => {
    const newChannel = {
      id: Date.now(),
      name: `Channel ${channels.length + 1}`,
      standard: "PAL",
      encoding: "H.264",
      resolution: "12MP (4000x3000)",
      fps: 25,
      bitrate: 20480,
    };
    setChannels([...channels, newChannel]);
  };

  // Delete channel
  const deleteChannel = (id) => {
    setChannels(channels.filter((ch) => ch.id !== id));
  };

  // Main calculation logic
  const calculate = () => {
    const totalBitrateKbps = channels.reduce((acc, ch) => acc + Number(ch.bitrate), 0);
    if (!totalBitrateKbps || totalBitrateKbps <= 0) {
      setResult({ error: "Total bitrate must be greater than 0" });
      return;
    }

    const hoursPerDay = Math.max(Number(recordHours) || 0, 0.1);
    const bytesPerSecond = (totalBitrateKbps * 1000) / 8;

    if (mode === "saving") {
      const tb = Math.max(Number(diskSpaceTB) || 0, 0);
      if (tb <= 0) {
        setResult({ error: "Disk space must be greater than 0" });
        return;
      }
      const totalStorageBytes = tb * 1024 ** 4;
      const totalSeconds = totalStorageBytes / bytesPerSecond;
      const totalDays = (totalSeconds / 3600 / hoursPerDay).toFixed(1);
      const totalWeeks = (Number(totalDays) / 7).toFixed(1);
      const totalMonths = (Number(totalDays) / 30).toFixed(1);
      setResult({ mode, days: totalDays, weeks: totalWeeks, months: totalMonths });
      return;
    }

    if (mode === "disk") {
      const days = Math.max(Number(retentionDays) || 0, 0);
      if (days <= 0) {
        setResult({ error: "Retention days must be greater than 0" });
        return;
      }
      const secondsRecorded = days * hoursPerDay * 3600;
      const requiredBytes = bytesPerSecond * secondsRecorded;
      const requiredTb = requiredBytes / 1024 ** 4;
      const requiredGb = requiredBytes / 1024 ** 3;
      setResult({
        mode,
        tb: requiredTb.toFixed(3),
        gb: requiredGb.toFixed(1),
      });
      return;
    }

    // bandwidth
    const mbps = totalBitrateKbps / 1000;
    const gbps = mbps / 1000;
    const mbPerSecond = mbps / 8;
    setResult({
      mode,
      mbps: mbps.toFixed(2),
      gbps: gbps.toFixed(3),
      mbPerSecond: mbPerSecond.toFixed(2),
    });
  };

  return (
    <div className="calc-layout">
      {/* Sidebar */}
      <aside className="calc-sidebar">
        <img src={tePNGLogo} alt="Logo" className="calc-logo" />

        <nav className="sidebar-nav">
          
          <button
            onClick={() => navigate("/app/dashboard")}
            className="sidebar-btn"
          >
            ⬅ Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/app/projects")}
            className={`sidebar-btn ${location.pathname === "/app/projects" ? "active" : ""}`}
          >
            📂 View Projects
          </button>

          <button
            onClick={() => navigate("/app/calculator")}
            className={`sidebar-btn ${location.pathname === "/app/calculator" ? "active" : ""}`}
          >
            📊 Storage Calculator
          </button>

        </nav>

        <button onClick={onLogout} className="logout-button">Logout</button>
      </aside>

      {/* Main Content */}
      <main className="calc-main">
        <h1>Storage and Network Calculator</h1>

        <section className="device-section">
          <h2>Add Device</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Video Standard</th>
                  <th>Encoding</th>
                  <th>Resolution</th>
                  <th>Frame Rate (fps)</th>
                  <th>Bitrate (Kbps)</th>
                  <th>Operation</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch, i) => (
                  <tr key={ch.id}>
                    <td>{ch.name}</td>
                    <td>
                      <select value={ch.standard} onChange={(e) => {
                        const updated = [...channels];
                        updated[i].standard = e.target.value;
                        setChannels(updated);
                      }}>
                        <option>PAL</option>
                        <option>NTSC</option>
                      </select>
                    </td>
                    <td>
                      <select value={ch.encoding} onChange={(e) => {
                        const updated = [...channels];
                        updated[i].encoding = e.target.value;
                        setChannels(updated);
                      }}>
                        <option>H.264</option>
                        <option>H.265</option>
                      </select>
                    </td>
                    <td>
                      <select value={ch.resolution} onChange={(e) => {
                        const updated = [...channels];
                        updated[i].resolution = e.target.value;
                        setChannels(updated);
                      }}>
                        <option>12MP (4000x3000)</option>
                        <option>8MP (3840x2160)</option>
                        <option>5MP (2560x1920)</option>
                        <option>1080p (1920x1080)</option>
                        <option>720p (1280x720)</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" value={ch.fps} onChange={(e) => {
                        const updated = [...channels];
                        updated[i].fps = e.target.value;
                        setChannels(updated);
                      }} />
                    </td>
                    <td>
                      <input type="number" value={ch.bitrate} onChange={(e) => {
                        const updated = [...channels];
                        updated[i].bitrate = e.target.value;
                        setChannels(updated);
                      }} />
                    </td>
                    <td>
                      <button className="delete-btn" onClick={() => deleteChannel(ch.id)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="add-btn" onClick={addChannel}>+ Add Channel</button>
        </section>

        <section className="calc-section">
          <h2>Calculate</h2>
          <div className="calc-controls">
            <div className="radio-buttons">
              <button className={mode === "saving" ? "active-mode" : ""} onClick={() => setMode("saving")}>Calculate Saving Time</button>
              <button className={mode === "disk" ? "active-mode" : ""} onClick={() => setMode("disk")}>Calculate Disk Space</button>
              <button className={mode === "bandwidth" ? "active-mode" : ""} onClick={() => setMode("bandwidth")}>Calculate Bandwidth</button>
            </div>

            <div className="inputs">
              {(mode === "saving" || mode === "disk") && (
                <label>
                  Recording Time per Day:
                  <input type="number" value={recordHours} onChange={(e)=> setRecordHours(e.target.value)} /> h
                </label>
              )}
              {mode === "saving" && (
                <label>
                  Set Disk Space:
                  <input type="number" value={diskSpaceTB} onChange={(e)=> setDiskSpaceTB(e.target.value)} /> TB
                </label>
              )}
              {mode === "disk" && (
                <label>
                  Retention (days):
                  <input type="number" value={retentionDays} onChange={(e)=> setRetentionDays(e.target.value)} /> days
                </label>
              )}
              {mode === "bandwidth" && (
                <p style={{ margin: 0, opacity: 0.85 }}>
                  Bandwidth is calculated from the summed bitrate of all channels (Kbps → Mbps).
                </p>
              )}
            </div>

            <button className="calculate-btn" onClick={calculate}>Calculate</button>
          </div>

          {result?.error && (
            <p style={{ color: "tomato", marginTop: "12px" }}>{result.error}</p>
          )}
          {result && !result.error && result.mode === "saving" && (
            <div className="results">
              <div className="result-box"><h3>{result.days}</h3><p>Days</p></div>
              <div className="result-box"><h3>{result.weeks}</h3><p>Weeks</p></div>
              <div className="result-box"><h3>{result.months}</h3><p>Months</p></div>
            </div>
          )}
          {result && !result.error && result.mode === "disk" && (
            <div className="results">
              <div className="result-box"><h3>{result.tb}</h3><p>Required TB</p></div>
              <div className="result-box"><h3>{result.gb}</h3><p>Required GB</p></div>
            </div>
          )}
          {result && !result.error && result.mode === "bandwidth" && (
            <div className="results">
              <div className="result-box"><h3>{result.mbps}</h3><p>Total Mbps</p></div>
              <div className="result-box"><h3>{result.gbps}</h3><p>Total Gbps</p></div>
              <div className="result-box"><h3>{result.mbPerSecond}</h3><p>MB/s (payload)</p></div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StorageNetworkCalculator;
