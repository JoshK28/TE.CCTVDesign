import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "../page_styling/StorageCalculator.css";
import tePNGLogo from "../assets/logo.png";

function StorageNetworkCalculator({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const initialChannels = [
    { id: 1, name: "Channel 1", standard: "PAL", encoding: "H.264", resolution: "12MP (4000x3000)", fps: 25, bitrate: 20480 }
  ];

  const [channels, setChannels] = useState(initialChannels);
  const [diskSpaceTB, setDiskSpaceTB] = useState(4);
  const [recordHours, setRecordHours] = useState(24);
  const [retentionDays, setRetentionDays] = useState(30);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("saving");

  const handleClear = () => {
    setChannels(initialChannels);
    setDiskSpaceTB(4);
    setRecordHours(24);
    setRetentionDays(30);
    setResult(null);
    setMode("saving");
  };

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
    const totalBitrateKbps = channels.reduce((acc, ch) => acc + Number(ch.bitrate), 0);
    if (!totalBitrateKbps || totalBitrateKbps <= 0) {
      setResult({ error: "Total bitrate must be greater than 0" });
      return;
    }

    const hoursPerDay = Math.max(Number(recordHours) || 0, 0.1);
    const bytesPerSecond = (totalBitrateKbps * 1000) / 8;

    if (mode === "saving") {
      const tb = Math.max(Number(diskSpaceTB) || 0, 0);
      const totalSeconds = (tb * 1024 ** 4) / bytesPerSecond;
      const totalDays = (totalSeconds / 3600 / hoursPerDay).toFixed(1);
      setResult({ 
        mode, 
        days: totalDays, 
        weeks: (totalDays / 7).toFixed(1), 
        months: (totalDays / 30).toFixed(1), 
        totalBitrateKbps 
      });
    } else if (mode === "disk") {
      const days = Math.max(Number(retentionDays) || 0, 0);
      const requiredBytes = bytesPerSecond * (days * hoursPerDay * 3600);
      setResult({ 
        mode, 
        tb: (requiredBytes / 1024 ** 4).toFixed(3), 
        gb: (requiredBytes / 1024 ** 3).toFixed(1), 
        totalBitrateKbps 
      });
    } else {
      const mbps = totalBitrateKbps / 1000;
      setResult({ 
        mode, 
        mbps: mbps.toFixed(2), 
        gbps: (mbps / 1000).toFixed(3), 
        mbPerSecond: (mbps / 8).toFixed(2), 
        totalBitrateKbps 
      });
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(36, 93, 145);
    doc.text("Storage & Network Calculation Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Mode: ${mode.toUpperCase()}`, 14, 28);
    doc.text(`Total System Bitrate: ${result.totalBitrateKbps} Kbps`, 14, 33);

    autoTable(doc, {
      startY: 40,
      head: [["Channel", "Standard", "Encoding", "Resolution", "FPS", "Bitrate (Kbps)"]],
      body: channels.map(ch => [ch.name, ch.standard, ch.encoding, ch.resolution, ch.fps, ch.bitrate]),
      headStyles: { fillColor: [36, 93, 145] }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text("Calculation Results:", 14, finalY);
    
    doc.setFontSize(10);
    if (mode === "saving") {
      doc.text(`Retention: ${result.days} Days (${result.weeks} Weeks)`, 14, finalY + 8);
    } else if (mode === "disk") {
      doc.text(`Required Storage: ${result.tb} TB (${result.gb} GB)`, 14, finalY + 8);
    } else {
      doc.text(`Bandwidth: ${result.mbps} Mbps`, 14, finalY + 8);
    }

    doc.save(`Storage_Report_${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(channels.map(ch => ({
      Channel: ch.name, Standard: ch.standard, Encoding: ch.encoding,
      Resolution: ch.resolution, FPS: ch.fps, "Bitrate (Kbps)": ch.bitrate
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `Storage_Calculation_${Date.now()}.xlsx`);
  };

  return (
    <div className="calc-layout">
      <aside className="calc-sidebar">
        <div className="logo-container">
          <img src={tePNGLogo} alt="Logo" className="calc-logo" />
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => navigate("/app/dashboard")} className="sidebar-btn">← Back to Dashboard</button>
          <button onClick={() => navigate("/app/calculator")} className={`sidebar-btn ${location.pathname.includes("calculator") ? "active" : ""}`}>📊 Storage Calculator</button>
          <button onClick={() => navigate("/app/ups")} className="sidebar-btn">🔋 UPS Calculator</button>
          <button onClick={() => navigate("/app/bom")} className="sidebar-btn">📦 Bill of Materials</button>
        </nav>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </aside>

      <main className="calc-main">
        <h1>Storage & Network Calculator</h1>

        <section className="device-section">
          <h2>Add Devices</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Channel</th><th>Standard</th><th>Encoding</th><th>Resolution</th><th>FPS</th><th>Bitrate (Kbps)</th><th>Op.</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch, i) => (
                  <tr key={ch.id}>
                    <td>{ch.name}</td>
                    <td>
                      <select value={ch.standard} onChange={(e) => {
                        const updated = [...channels]; updated[i].standard = e.target.value; setChannels(updated);
                      }}>
                        <option>PAL</option><option>NTSC</option>
                      </select>
                    </td>
                    <td>
                      <select value={ch.encoding} onChange={(e) => {
                        const updated = [...channels]; updated[i].encoding = e.target.value; setChannels(updated);
                      }}>
                        <option>H.264</option><option>H.265</option>
                      </select>
                    </td>
                    <td>
                      <select value={ch.resolution} onChange={(e) => {
                        const updated = [...channels]; updated[i].resolution = e.target.value; setChannels(updated);
                      }}>
                        <option>12MP (4000x3000)</option><option>8MP (3840x2160)</option><option>1080p (1920x1080)</option>
                      </select>
                    </td>
                    <td><input type="number" value={ch.fps} onChange={(e) => { const updated = [...channels]; updated[i].fps = e.target.value; setChannels(updated); }} /></td>
                    <td><input type="number" value={ch.bitrate} onChange={(e) => { const updated = [...channels]; updated[i].bitrate = e.target.value; setChannels(updated); }} /></td>
                    <td><button className="delete-btn" onClick={() => deleteChannel(ch.id)}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="add-btn" onClick={addChannel}>+ Add Channel</button>
        </section>

        <section className="calc-section">
          <h2>Calculation Parameters</h2>
          <div className="calc-controls">
            <div className="radio-buttons">
              <button className={mode === "saving" ? "active-mode" : ""} onClick={() => setMode("saving")}>Saving Time</button>
              <button className={mode === "disk" ? "active-mode" : ""} onClick={() => setMode("disk")}>Disk Space</button>
              <button className={mode === "bandwidth" ? "active-mode" : ""} onClick={() => setMode("bandwidth")}>Bandwidth</button>
            </div>

            <div className="inputs-row">
              {(mode === "saving" || mode === "disk") && (
                <div className="input-group">
                  <label>Record Time (h/day)</label>
                  <input type="number" value={recordHours} onChange={(e)=> setRecordHours(e.target.value)} />
                </div>
              )}
              {mode === "saving" && (
                <div className="input-group">
                  <label>Storage Space (TB)</label>
                  <input type="number" value={diskSpaceTB} onChange={(e)=> setDiskSpaceTB(e.target.value)} />
                </div>
              )}
              {mode === "disk" && (
                <div className="input-group">
                  <label>Retention Days</label>
                  <input type="number" value={retentionDays} onChange={(e)=> setRetentionDays(e.target.value)} />
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button className="calculate-btn" onClick={calculate}>Calculate Results</button>
              <button className="clear-btn" onClick={handleClear}>Clear Form</button>
            </div>
          </div>

          {result && !result.error && (
            <div className="results-wrapper">
              <div className="results-display">
                {result.mode === "saving" && (
                  <>
                    <div className="res-card"><h3>{result.days}</h3><p>Days</p></div>
                    <div className="res-card"><h3>{result.weeks}</h3><p>Weeks</p></div>
                  </>
                )}
                {result.mode === "disk" && (
                  <>
                    <div className="res-card"><h3>{result.tb}</h3><p>TB Required</p></div>
                    <div className="res-card"><h3>{result.gb}</h3><p>GB Required</p></div>
                  </>
                )}
                {result.mode === "bandwidth" && (
                  <div className="res-card"><h3>{result.mbps}</h3><p>Total Mbps</p></div>
                )}
              </div>
              <div className="export-container">
                <button onClick={handleExportPDF} className="export-btn pdf">📄 Export PDF</button>
                <button onClick={handleExportExcel} className="export-btn excel">📊 Export Excel</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StorageNetworkCalculator;