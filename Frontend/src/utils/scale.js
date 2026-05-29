// Shared scale-calibration math used by both the project-setup scaling step
// (ScaleCalibrator) and the in-design calibration tool (ScaleCalibrationTool).
// All pixel values are expressed in the floor image's natural coordinate space.

// Straight-line distance in pixels between two { x, y } points.
export const getDistancePx = (start, end) =>
    start && end ? Math.hypot(end.x - start.x, end.y - start.y) : 0;

// Real-world distance in metres between two points at the given pixels-per-metre.
export const metersFromPoints = (start, end, ppm) =>
    ppm > 0 && start && end ? getDistancePx(start, end) / ppm : null;

// Pixels-per-metre from a measured pixel distance and its real-world length.
export const ppmFromDistance = (pixelDistance, meters) =>
    meters > 0 ? pixelDistance / meters : null;

// Serialise pixels-per-metre to the "1:N" scale string stored on a project.
export const scaleStringFromPpm = (ppm) =>
    Number.isFinite(ppm) && ppm > 0 ? `1:${ppm.toFixed(2)}` : null;

// Parse a "1:N" scale string back into pixels-per-metre (N).
export const ppmFromScaleString = (scaleString) => {
    if (typeof scaleString !== 'string') return null;
    const match = scaleString.trim().match(/^1\s*:\s*([\d.]+)$/);
    if (!match) return null;
    const ppm = Number.parseFloat(match[1]);
    return Number.isFinite(ppm) && ppm > 0 ? ppm : null;
};
