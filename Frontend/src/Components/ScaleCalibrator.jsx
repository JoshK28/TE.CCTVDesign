import { useState } from "react";

import ScaleCalibrationTool, { useScaleCalibration } from "./ScaleCalibrationTool";
import { getViewBox } from "../utils/overlayUtils";
import { scaleStringFromPpm } from "../utils/scale";

/*
ScaleCalibrator is the scaling step of the project-creation flow. It is just a
host for the shared calibration tool: it owns the preview <img>, runs the same
click-two-points + modal UX as the design page, and — because a project stores
its scale as a "1:N" string — serialises the calibrated pixels-per-metre at this
persistence boundary via onScaleChange.
*/
function ScaleCalibrator({ layer, scale, onScaleChange }) {
    const [imageSize, setImageSize] = useState(null);

    const calibration = useScaleCalibration({
        active: Boolean(layer?.preview),
        imageSize,
        onApply: (ppm) => {
            const next = scaleStringFromPpm(ppm);
            if (next) onScaleChange(next);
        },
    });

    const handleImageLoad = ({ currentTarget: img }) => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        setImageSize({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    };

    const viewBox = getViewBox(imageSize);

    // Keep handles a consistent on-screen size despite the natural-pixel viewBox.
    const handleRadius = imageSize
        ? Math.max(imageSize.naturalWidth, imageSize.naturalHeight) / 120
        : 8;

    return (
        <div className="scaling-section">
            <h3>Scaling</h3>

            {layer?.preview ? (
                <div className="scaling-preview">
                    <div
                        className="scale-stage"
                        onClick={calibration.handleClick}
                        onPointerMove={calibration.handlePointerMove}
                        onContextMenu={(e) => calibration.preventContextMenu && e.preventDefault()}
                    >
                        <img
                            src={layer.preview}
                            alt="First layer for scaling"
                            onLoad={handleImageLoad}
                            draggable={false}
                        />
                        <ScaleCalibrationTool
                            calibration={calibration}
                            viewBox={viewBox}
                            handleRadius={handleRadius}
                        />
                    </div>
                </div>
            ) : (
                <p className="scaling-help">First layer image is missing.</p>
            )}

            <p className="scaling-help">
                Click the two ends of a known distance, then enter its length. Scale:{" "}
                <strong>{scale}</strong>
            </p>
        </div>
    );
}

export default ScaleCalibrator;
