import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../page_styling/StorageCalculator.css";
import tePNGLogo from "../assets/logo.png";
import api from "../services/api";

function StorageNetworkCalculator({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // get projectId if coming from design page
  const projectId = location.state?.projectId;

  const [channels, setChannels] = useState([
    { id: 1, name: "Channel 1", standard: "PAL", encoding: "H.264", resolution: "12MP (4000x3000)", fps: 25, bitrate: 20480 }
  ]);

  const [diskSpaceTB, setDiskSpaceTB] = useState(4);
  const [recordHours, setRecordHours] = useState(24);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("saving");
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");

  // auto populate channels if projectId is provided
  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDevices = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/camerplacements/project/${projectId}/devices`);
        if (res.data.storageChannels.length > 0) {
          setChannels(res.data.storageChannels);
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

  const deleteChannel = (id) => {
    setChannels(channels.filter((ch) => ch.id !== id));
  };

  const calculate = () => {
    const totalBitrate = channels.reduce((acc, ch) => acc + Number(ch.bitrate), 0);
    const totalStorageBytes = diskSpaceTB * 1024 ** 4;
    const bytesPerSecond = (totalBitrate * 1000) / 8;
    const totalSeconds = totalStorageBytes / bytesPerSecond;
    const totalDays = (totalSeconds / 3600 / recordHours).toFixed(1);
    const totalWeeks = (totalDays / 7).toFixed(1);
    const totalMonths = (totalDays / 30).toFixed(1);

    setResult({ days: totalDays, weeks: totalWeeks, months: totalMonths });
  };

  return (
    <div className="calc-layout">
      <aside className="calc-sidebar">
        <img src={tePNGLogo} alt="Logo" className="calc-logo" />
        <nav className="sidebar-nav">
          <button onClick={() => navigate("/app/dashboard")} className="sidebar-btn">
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

      <main className="calc-main">
        <h1>Storage and Network Calculator</h1>
        {projectId && projectName && (
          <p style={{ color: '#245d91', fontWeight: 'bold' }}>
            Project: {projectName}
          </p>
        )}
        {loading && <p>Loading project devices...</p>}

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
              <label>
                Set Disk Space:
                <input type="number" value={diskSpaceTB} onChange={(e) => setDiskSpaceTB(e.target.value)} /> TB
              </label>
              <label>
                Recording Time per Day:
                <input type="number" value={recordHours} onChange={(e) => setRecordHours(e.target.value)} /> h
              </label>
            </div>

            <button className="calculate-btn" onClick={calculate}>Calculate</button>
          </div>

          {result && (
            <div className="results">
              <div className="result-box"><h3>{result.days}</h3><p>Days</p></div>
              <div className="result-box"><h3>{result.weeks}</h3><p>Weeks</p></div>
              <div className="result-box"><h3>{result.months}</h3><p>Months</p></div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StorageNetworkCalculator;