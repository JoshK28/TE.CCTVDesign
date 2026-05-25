import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../Components/AppLayout";
import "../page_styling/storageCalculator.css";
import api from "../services/api";

const DEFAULT_CHANNEL = {
  standard: "PAL",
  encoding: "H.264",
  resolution: "12MP (4000x3000)",
  fps: 25,
  bitrate: 20480,
};

function StorageNetworkCalculator({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  // get projectId if coming from design page
  const projectId = location.state?.projectId;
  const nav = [
    projectId
      ? {
          label: "← Back to Project",
          onClick: () => navigate("/app/design", { state: { projectId } }),
        }
      : { label: "⬅ Back to Dashboard", to: "/app/dashboard" },
    { label: "📂 View Projects", to: "/app/projects" },
    { label: "📊 Storage Calculator", to: "/app/calculator" },
  ];

  const [channels, setChannels] = useState([
    { id: 1, name: "Channel 1", ...DEFAULT_CHANNEL },
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

  const addChannel = () =>
    setChannels((prev) => [
      ...prev,
      { id: Date.now(), name: `Channel ${prev.length + 1}`, ...DEFAULT_CHANNEL },
    ]);

  const deleteChannel = (id) =>
    setChannels((prev) => prev.filter((ch) => ch.id !== id));

  const updateChannel = (index, patch) =>
    setChannels((prev) => prev.map((ch, i) => (i === index ? { ...ch, ...patch } : ch)));

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
    <AppLayout
      className="calc-page"
      nav={nav}
      onLogout={onLogout}
      mainClassName="calc-main"
    >
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
                      <select
                        value={ch.standard}
                        onChange={(e) => updateChannel(i, { standard: e.target.value })}
                      >
                        <option>PAL</option>
                        <option>NTSC</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={ch.encoding}
                        onChange={(e) => updateChannel(i, { encoding: e.target.value })}
                      >
                        <option>H.264</option>
                        <option>H.265</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={ch.resolution}
                        onChange={(e) => updateChannel(i, { resolution: e.target.value })}
                      >
                        <option>12MP (4000x3000)</option>
                        <option>8MP (3840x2160)</option>
                        <option>5MP (2560x1920)</option>
                        <option>1080p (1920x1080)</option>
                        <option>720p (1280x720)</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={ch.fps}
                        onChange={(e) => updateChannel(i, { fps: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={ch.bitrate}
                        onChange={(e) => updateChannel(i, { bitrate: e.target.value })}
                      />
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
    </AppLayout>
  );
}

export default StorageNetworkCalculator;