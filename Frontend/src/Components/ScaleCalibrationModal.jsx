import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

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
            style={{ width: "400px" }}
            modal
        >
            <p>You measured: <strong>{pixelDistance?.toFixed(2)} px</strong></p>

            <div className="p-field">
                <label>Real-world distance (meters):</label>
                <InputNumber
                    value={meters}
                    onValueChange={(e) => setMeters(e.value)}
                    min={0.01}
                    step={0.1}
                    placeholder="Enter meters"
                    style={{ width: "100%" }}
                />
            </div>

            <div style={{ marginTop: "1rem", textAlign: "right" }}>
                <Button
                    label="Cancel"
                    className="p-button-text"
                    onClick={onCancel}
                    style={{ marginRight: "0.5rem" }}
                />
                <Button
                    label="Apply"
                    icon="pi pi-check"
                    onClick={handleApply}
                />
            </div>
        </Dialog>
    );
}