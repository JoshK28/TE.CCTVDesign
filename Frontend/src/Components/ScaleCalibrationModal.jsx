import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

import "../page_styling/designPage.css";

export default function ScaleCalibrationModal({
    visible,
    pixelDistance,
    onApply,
    onCancel
}) {
    const [meters, setMeters] = useState(null);

    const handleApply = () => {
        if (!meters || meters <= 0) return;
        const newPPM = pixelDistance / meters;
        onApply(newPPM);
    };

    return (
        <Dialog
            header="Scale Calibration"
            visible={visible}
            onHide={onCancel}
            modal
            style={{ width: "420px" }}
            className="scale-dialog"
        >
            <div className="scale-dialog-content">

                {/* Summary */}
                <div className="scale-summary">
                    <p className="scale-summary-text">
                        You measured:
                        <strong className="scale-summary-value">
                            {pixelDistance?.toFixed(2)} px
                        </strong>
                    </p>
                </div>

                {/* Input */}
                <div className="scale-input-group">
                    <label className="scale-input-label">
                        Real‑world distance (meters)
                    </label>

                    <InputNumber
                        value={meters}
                        onValueChange={(e) => setMeters(e.value)}
                        min={0.01}
                        step={0.1}
                        placeholder="Enter meters"
                        className="scale-input"
                        inputStyle={{ width: "100%" }}
                    />
                </div>

                {/* Actions */}
                <div className="scale-actions">
                    <Button
                        label="Cancel"
                        className="p-button-text scale-btn-cancel"
                        onClick={onCancel}
                    />
                    <Button
                        label="Apply"
                        icon="pi pi-check"
                        className="scale-btn-apply"
                        onClick={handleApply}
                    />
                </div>
            </div>
        </Dialog>
    );
}