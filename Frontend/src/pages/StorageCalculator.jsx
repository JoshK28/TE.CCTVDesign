import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../Components/AppLayout";
import "../page_styling/storageCalculator.css";
import api from "../services/api";

const RESOLUTIONS = [
  { label: "12MP (4000x3000)", bitrate: 20480 },
  { label: "8MP (3840x2160)", bitrate: 16384 },
  { label: "5MP (2560x1920)", bitrate: 8192 },
  { label: "1080p (1920x1080)", bitrate: 4096 },
  { label: "720p (1280x720)", bitrate: 2048 },
];

const DEFAULT_RESOLUTION = RESOLUTIONS[3];
const TB_BYTES = 1024 ** 4;
const GB_BYTES = 1024 ** 3;

const DEFAULT_CHANNEL = {
  encoding: "H.264",
  resolution: DEFAULT_RESOLUTION.label,
  fps: 25,
  bitrate: DEFAULT_RESOLUTION.bitrate,
};

const MODES = [
  { id: "saving", label: "Calculate Saving Time" },
  { id: "disk", label: "Calculate Disk Space" },
  { id: "bandwidth", label: "Calculate Bandwidth" },
];

const getBaseBitrate = (resolution) =>
  RESOLUTIONS.find((r) => r.label === resolution)?.bitrate ?? DEFAULT_RESOLUTION.bitrate;

const computeBitrate = (resolution, encoding, fps) => {
  const base = getBaseBitrate(resolution);
  const encodingMultiplier = encoding === "H.265" ? 0.5 : 1;
  return Math.round(base * encodingMultiplier * (Number(fps) / 25));
};

const DEFAULT_CALC = {
  mode: "saving",
  result: null,
  diskSpace: 4,
  diskUnit: "TB",
  recordHours: 24,
  retentionDays: 30,
};

const calculateResults = (mode, { channels, diskSpace, diskUnit, recordHours, retentionDays }) => {
  const totalBitrateKbps = channels.reduce((acc, ch) => acc + Number(ch.bitrate), 0);
  const bytesPerSecond = (totalBitrateKbps * 1000) / 8;

  if (mode === "saving") {
    const totalStorageBytes = diskSpace * (diskUnit === "TB" ? TB_BYTES : GB_BYTES);
    const totalDays = (totalStorageBytes / bytesPerSecond / 3600 / recordHours).toFixed(1);
    return { days: totalDays };
  }

  if (mode === "disk") {
    const totalBytes = bytesPerSecond * retentionDays * recordHours * 3600;
    const useTb = totalBytes >= TB_BYTES;
    return {
      storage: (totalBytes / (useTb ? TB_BYTES : GB_BYTES)).toFixed(2),
      unit: useTb ? "TB" : "GB",
    };
  }

  const totalMbps = (totalBitrateKbps / 1000).toFixed(2);
  return {
    mbps: totalMbps,
    gbps: (totalBitrateKbps / 1_000_000).toFixed(4),
    recommended: (totalMbps * 1.2).toFixed(2),
  };
};

const getResultItems = (mode, result) => {
  if (mode === "saving") return [{ key: "days", value: result.days, label: "Days of retention" }];
  if (mode === "disk") return [{ key: "storage", value: `${result.storage} ${result.unit}`, label: "Required Storage" }];
  return [
    { key: "mbps", value: `${result.mbps} Mbps`, label: "Total Bandwidth" },
    { key: "gbps", value: `${result.gbps} Gbps`, label: "Total Bandwidth" },
    { key: "recommended", value: `${result.recommended} Mbps`, label: "Recommended Switch Capacity" },
  ];
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

  const nav = [
    projectId
      ? {
          label: "⬅ Back to Design",
          onClick: () => navigate("/app/design", { state: { projectId } }),
        }
      : { label: "⬅ Back to Dashboard", to: "/app/dashboard" },
    { label: "📂 View Projects", to: "/app/projects" },
    { label: "📊 Storage Calculator", to: "/app/calculator" },
    { label: "🔋 UPS Calculator", to: "/app/ups" },
  ];

  const [channels, setChannels] = useState([{ id: 1, name: "Channel 1", ...DEFAULT_CHANNEL }]);
  const [calc, setCalc] = useState(DEFAULT_CALC);
  const [project, setProject] = useState({ name: "", loading: false });

  const updateCalc = (patch) => setCalc((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDevices = async () => {
      setProject((prev) => ({ ...prev, loading: true }));
      try {
        const res = await api.get(`/api/camerplacements/project/${projectId}/devices`);
        if (res.data.storageChannels.length > 0) {
          setChannels(res.data.storageChannels);
        }
        const projectRes = await api.get(`/api/projects/${projectId}`);
        setProject({ name: projectRes.data.title, loading: false });
      } catch (err) {
        console.error("Failed to load project devices", err);
        setProject((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchProjectDevices();
  }, [projectId]);

  const addChannel = () =>
    setChannels((prev) => [
      ...prev,
      { id: Date.now(), name: `Channel ${prev.length + 1}`, ...DEFAULT_CHANNEL },
    ]);

  const deleteChannel = (id) => setChannels((prev) => prev.filter((ch) => ch.id !== id));

  const updateChannel = (index, patch) => {
    setChannels((prev) =>
      prev.map((ch, i) => {
        if (i !== index) return ch;
        const updated = { ...ch, ...patch };
        if (patch.resolution || patch.encoding || patch.fps) {
          updated.bitrate = computeBitrate(updated.resolution, updated.encoding, updated.fps);
        }
        return updated;
      })
    );
  };

  const selectMode = (mode) => updateCalc({ mode, result: null });

  const calculate = () =>
    setCalc((prev) => ({
      ...prev,
      result: calculateResults(prev.mode, { channels, ...prev }),
    }));

  return (
    <AppLayout className="calc-page" nav={nav} onLogout={onLogout} mainClassName="calc-main">
      <h1>Storage Calculator</h1>

      {projectId && project.name && (
        <p style={{ color: "#245d91", fontWeight: "bold" }}>Project: {project.name}</p>
      )}

      {project.loading && <p>Loading project devices...</p>}

      <section className="device-section">
        <h2>Device Channels</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Channel</th>
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
                      {RESOLUTIONS.map((r) => (
                        <option key={r.label} value={r.label}>{r.label}</option>
                      ))}
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
            {MODES.map(({ id, label }) => (
              <button
                key={id}
                className={calc.mode === id ? "active-mode" : ""}
                onClick={() => selectMode(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="inputs">
            {calc.mode === "saving" && (
              <label>
                Disk Space:
                <input
                  type="number"
                  value={calc.diskSpace}
                  onChange={(e) => updateCalc({ diskSpace: e.target.value })}
                />
                <select value={calc.diskUnit} onChange={(e) => updateCalc({ diskUnit: e.target.value })}>
                  <option>TB</option>
                  <option>GB</option>
                </select>
              </label>
            )}

            {calc.mode === "disk" && (
              <label>
                Desired Retention:
                <input
                  type="number"
                  value={calc.retentionDays}
                  onChange={(e) => updateCalc({ retentionDays: e.target.value })}
                /> days
              </label>
            )}

            {calc.mode !== "bandwidth" && (
              <label>
                Recording Time per Day:
                <input
                  type="number"
                  value={calc.recordHours}
                  onChange={(e) => updateCalc({ recordHours: e.target.value })}
                /> h
              </label>
            )}
          </div>

          <button className="calculate-btn" onClick={calculate}>Calculate</button>
        </div>

        {calc.result && (
          <div className="results">
            {getResultItems(calc.mode, calc.result).map(({ key, value, label }) => (
              <div key={key} className="result-box">
                <h3>{value}</h3>
                <p>{label}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default StorageNetworkCalculator;
