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

/*
The StorageNetworkCalculator page lets the user estimate CCTV storage and
bandwidth requirements. Channels (one per camera) define resolution, encoding
and frame rate; the page then calculates one of three things depending on the
selected mode:
  - "saving":    how long a given disk lasts at the configured channel bitrates
  - "disk":      how much disk is needed for a given retention period
  - "bandwidth": total Mbps/Gbps and a recommended switch capacity (+20%)
If opened with a projectId in router state, channels are pre-populated from
the project's placed cameras.
*/
function StorageNetworkCalculator({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const projectId = location.state?.projectId;
  const fromDesign = !!projectId;

  const nav = [
    fromDesign
      ? {
          label: "⬅ Back to Design",
          onClick: () => navigate("/app/design", { state: { projectId } }),
        }
      : { label: "⬅ Back to Dashboard", to: "/app/dashboard" },
    { label: "📂 View Projects", to: "/app/projects" },
    { label: "📊 Storage Calculator", to: "/app/calculator" },
    { label: "🔋 UPS Calculator", to: "/app/ups" },
  ];

  const [channels, setChannels] = useState([
    { id: 1, name: "Channel 1", ...DEFAULT_CHANNEL },
  ]);

  const BASE_BITRATES = {
    "12MP (4000x3000)": 20480,
    "8MP (3840x2160)": 16384,
    "5MP (2560x1920)": 8192,
    "1080p (1920x1080)": 4096,
    "720p (1280x720)": 2048,
  };

  const [diskSpaceTB, setDiskSpaceTB] = useState(4);
  const [diskUnit, setDiskUnit] = useState("TB");
  const [recordHours, setRecordHours] = useState(24);
  const [retentionDays, setRetentionDays] = useState(30);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("saving");
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDevices = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/camerplacements/project/${projectId}/devices`);
        if (res.data.storageChannels.length > 0) {
          setChannels(res.data.storageChannels);
        }

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

  // Patch one channel row. When resolution/encoding/fps changes the channel
  // bitrate is recomputed from the resolution baseline (H.265 halves the
  // bitrate vs H.264, and fps scales linearly relative to 25 fps).
  const updateChannel = (index, patch) => {
    setChannels((prev) =>
      prev.map((ch, i) => {
        if (i !== index) return ch;

        const updated = { ...ch, ...patch };

        if (patch.resolution || patch.encoding || patch.fps) {
          const base = BASE_BITRATES[updated.resolution] ?? 20480;
          const encodingMultiplier = updated.encoding === "H.265" ? 0.5 : 1;
          const fpsMultiplier = Number(updated.fps) / 25;
          updated.bitrate = Math.round(base * encodingMultiplier * fpsMultiplier);
        }

        return updated;
      })
    );
  };

  // Runs the calculation for the currently selected mode and writes the
  // result into state for display.
  const calculate = () => {
    const totalBitrateKbps = channels.reduce((acc, ch) => acc + Number(ch.bitrate), 0);
    const bytesPerSecond = (totalBitrateKbps * 1000) / 8;

    if (mode === "saving") {
      const multiplier = diskUnit === "TB" ? 1024 ** 4 : 1024 ** 3;
      const totalStorageBytes = diskSpaceTB * multiplier;
      const totalSeconds = totalStorageBytes / bytesPerSecond;
      const totalDays = (totalSeconds / 3600 / recordHours).toFixed(1);
      const totalWeeks = (totalDays / 7).toFixed(1);
      const totalMonths = (totalDays / 30).toFixed(1);
      setResult({ mode: "saving", days: totalDays, weeks: totalWeeks, months: totalMonths });

    } else if (mode === "disk") {
      const totalSeconds = retentionDays * recordHours * 3600;
      const totalBytes = bytesPerSecond * totalSeconds;
      const totalGB = (totalBytes / 1024 ** 3).toFixed(2);
      const totalTB = (totalBytes / 1024 ** 4).toFixed(2);
      setResult({ mode: "disk", gb: totalGB, tb: totalTB });

    } else if (mode === "bandwidth") {
      const totalMbps = (totalBitrateKbps / 1000).toFixed(2);
      const totalGbps = (totalBitrateKbps / 1000000).toFixed(4);
      const recommended = (totalMbps * 1.2).toFixed(2);
      setResult({ mode: "bandwidth", mbps: totalMbps, gbps: totalGbps, recommended });
    }
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
        <p style={{ color: '#245d91', fontWeight: 'bold' }}>Project: {projectName}</p>
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
            <button
              className={mode === "saving" ? "active-mode" : ""}
              onClick={() => { setMode("saving"); setResult(null); }}
            >
              Calculate Saving Time
            </button>
            <button
              className={mode === "disk" ? "active-mode" : ""}
              onClick={() => { setMode("disk"); setResult(null); }}
            >
              Calculate Disk Space
            </button>
            <button
              className={mode === "bandwidth" ? "active-mode" : ""}
              onClick={() => { setMode("bandwidth"); setResult(null); }}
            >
              Calculate Bandwidth
            </button>
          </div>

          <div className="inputs">
            {mode === "saving" && (
              <>
                <label>
                  Disk Space:
                  <input
                    type="number"
                    value={diskSpaceTB}
                    onChange={(e) => setDiskSpaceTB(e.target.value)}
                  />
                  <select value={diskUnit} onChange={(e) => setDiskUnit(e.target.value)}>
                    <option>TB</option>
                    <option>GB</option>
                  </select>
                </label>
                <label>
                  Recording Time per Day:
                  <input
                    type="number"
                    value={recordHours}
                    onChange={(e) => setRecordHours(e.target.value)}
                  /> h
                </label>
              </>
            )}

            {mode === "disk" && (
              <>
                <label>
                  Desired Retention:
                  <input
                    type="number"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                  /> days
                </label>
                <label>
                  Recording Time per Day:
                  <input
                    type="number"
                    value={recordHours}
                    onChange={(e) => setRecordHours(e.target.value)}
                  /> h
                </label>
              </>
            )}

            {mode === "bandwidth" && (
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                Bandwidth is calculated automatically from your channel bitrates above.
              </p>
            )}
          </div>

          <button className="calculate-btn" onClick={calculate}>Calculate</button>
        </div>

        {result && result.mode === "saving" && (
          <div className="results">
            <div className="result-box"><h3>{result.days}</h3><p>Days</p></div>
            <div className="result-box"><h3>{result.weeks}</h3><p>Weeks</p></div>
            <div className="result-box"><h3>{result.months}</h3><p>Months</p></div>
          </div>
        )}

        {result && result.mode === "disk" && (
          <div className="results">
            <div className="result-box"><h3>{result.gb} GB</h3><p>Required Storage</p></div>
            <div className="result-box"><h3>{result.tb} TB</h3><p>Required Storage</p></div>
          </div>
        )}

        {result && result.mode === "bandwidth" && (
          <div className="results">
            <div className="result-box"><h3>{result.mbps} Mbps</h3><p>Total Bandwidth</p></div>
            <div className="result-box"><h3>{result.gbps} Gbps</h3><p>Total Bandwidth</p></div>
            <div className="result-box"><h3>{result.recommended} Mbps</h3><p>Recommended Switch Capacity</p></div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default StorageNetworkCalculator;