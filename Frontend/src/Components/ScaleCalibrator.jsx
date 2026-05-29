import { useEffect, useRef, useState } from "react";

const INITIAL_LINE = { a: { x: 0.25, y: 0.5 }, b: { x: 0.75, y: 0.5 } };

/*
ScaleCalibrator is the second step of the project-creation flow. The user
drags two endpoints across a known distance on the first floor image and
types in the real-world length of that distance in metres. The component
computes pixels-per-metre from the on-screen line length and reports the
result up to its parent as a "1:N" string via onScaleChange.
*/
function ScaleCalibrator({ layer, scale, onScaleChange }) {
  const [line, setLine] = useState(INITIAL_LINE);
  const [dragPoint, setDragPoint] = useState(null);
  const [knownLength, setKnownLength] = useState("10");
  const previewRef = useRef(null);

  useEffect(() => {
    if (!dragPoint) return undefined;
    const onMove = ({ clientX, clientY }) => {
      const rect = previewRef.current?.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      const nx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      setLine((prev) => ({ ...prev, [dragPoint]: { x: nx, y: ny } }));
    };
    const onUp = () => setDragPoint(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragPoint]);

  useEffect(() => {
    if (typeof onScaleChange !== "function") return;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const length = Number(knownLength);
    if (!Number.isFinite(length) || length <= 0) return;
    const px = Math.hypot((line.b.x - line.a.x) * rect.width, (line.b.y - line.a.y) * rect.height);
    onScaleChange(`1:${(px / length).toFixed(2)}`);
  }, [line, knownLength, onScaleChange]);

  const setDrag = (point) => (e) => {
    e.preventDefault();
    setDragPoint(point);
  };

  return (
    <div className="scaling-section">
      <h3>Scaling</h3>
      {layer?.preview ? (
        <div className="scaling-preview" ref={previewRef}>
          <img src={layer.preview} alt="First layer for scaling" style={{ width: `${layer.imageWidth ?? 80}%` }} />
          <svg className="scale-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1={line.a.x * 100} y1={line.a.y * 100} x2={line.b.x * 100} y2={line.b.y * 100} className="scale-line" />
            <circle
              cx={line.a.x * 100}
              cy={line.a.y * 100}
              r="1.7"
              className="scale-handle"
              onPointerDown={setDrag("a")}
            />
            <circle
              cx={line.b.x * 100}
              cy={line.b.y * 100}
              r="1.7"
              className="scale-handle"
              onPointerDown={setDrag("b")}
            />
          </svg>
        </div>
      ) : (
        <p className="scaling-help">First layer image is missing.</p>
      )}
      <div className="scaling-known-length">
        <input
          type="number"
          min="0.01"
          step="0.1"
          value={knownLength}
          onChange={(e) => setKnownLength(e.target.value)}
        />
        <span>meters</span>
      </div>
      <p className="scaling-help">
        Drag endpoints over a known distance. Scale: <strong>{scale}</strong>
      </p>
    </div>
  );
}

export default ScaleCalibrator;
