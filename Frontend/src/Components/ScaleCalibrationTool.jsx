import { useState, useCallback, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

import { getImagePoint } from '../utils/points';
import { getDistancePx } from '../utils/scale';

import '../page_styling/designPage.css';

const INITIAL_CALIBRATION = {
    start: null,
    end: null,
    cursor: null,
};

/*
Scale calibration for the design workspace: two-click line measurement on the
floor plan, SVG overlay, modal for real-world distance, and ESC to clear/exit.
*/
export function useScaleCalibration({ active, imageSize, onApply, onDeactivate }) {
    const [calibration, setCalibration] = useState(INITIAL_CALIBRATION);
    const { start, end, cursor } = calibration;

    const showModal = Boolean(start && end);
    const distancePx = getDistancePx(start, end);

    const reset = useCallback(() => {
        setCalibration(INITIAL_CALIBRATION);
    }, []);

    useEffect(() => {
        if (!active) reset();
    }, [active, reset]);

    const handleClick = useCallback(
        (event) => {
            if (!active || !imageSize) return false;

            const { x, y } = getImagePoint(event, event.currentTarget, imageSize);

            if (!start) {
                setCalibration({ start: { x, y }, end: null, cursor: null });
                return true;
            }

            if (!end) {
                setCalibration((prev) => ({ ...prev, end: { x, y }, cursor: null }));
                return true;
            }

            return true;
        },
        [active, imageSize, start, end]
    );

    const handlePointerMove = useCallback(
        (event) => {
            if (!active || !imageSize) return;
            setCalibration((prev) => {
                if (prev.end) return prev.cursor ? { ...prev, cursor: null } : prev;
                return { ...prev, cursor: getImagePoint(event, event.currentTarget, imageSize) };
            });
        },
        [active, imageSize]
    );

    const handleEscape = useCallback(() => {
        if (!active) return false;

        if (start || end || cursor) {
            reset();
            return true;
        }

        onDeactivate?.();
        return true;
    }, [active, start, end, cursor, reset, onDeactivate]);

    const applyCalibration = useCallback(
        (newPPM) => {
            onApply?.(newPPM);
            reset();
            onDeactivate?.();
        },
        [onApply, onDeactivate, reset]
    );

    const cancelCalibration = useCallback(() => {
        reset();
        onDeactivate?.();
    }, [reset, onDeactivate]);

    return {
        start,
        end,
        cursor,
        showModal,
        distancePx,
        reset,
        handleClick,
        handlePointerMove,
        handleEscape,
        preventContextMenu: active,
        applyCalibration,
        cancelCalibration,
    };
}

export function ScaleCalibrationOverlay({ viewBox, start, end, cursor, handleRadius = 8 }) {
    if (!viewBox) return null;

    const lineEnd = end || (start && cursor);

    if (!start && !end && cursor) {
        return (
            <svg className="scale-overlay" viewBox={viewBox} preserveAspectRatio="none">
                <circle
                    cx={cursor.x}
                    cy={cursor.y}
                    r={handleRadius}
                    className="scale-handle"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        );
    }

    if (start && lineEnd) {
        return (
            <svg className="scale-overlay" viewBox={viewBox} preserveAspectRatio="none">
                <line
                    x1={start.x}
                    y1={start.y}
                    x2={lineEnd.x}
                    y2={lineEnd.y}
                    className="scale-line"
                    vectorEffect="non-scaling-stroke"
                />
                <circle
                    cx={start.x}
                    cy={start.y}
                    r={handleRadius}
                    className="scale-handle"
                    vectorEffect="non-scaling-stroke"
                />
                <circle
                    cx={lineEnd.x}
                    cy={lineEnd.y}
                    r={handleRadius}
                    className="scale-handle"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        );
    }

    return null;
}

function ScaleCalibrationModal({ visible, pixelDistance, onApply, onCancel }) {
    const [meters, setMeters] = useState(null);

    const handleApply = () => {
        if (!meters || meters <= 0) return;
        onApply(pixelDistance / meters);
    };

    return (
        <Dialog
            header="Scale Calibration"
            visible={visible}
            onHide={onCancel}
            modal
            style={{ width: '420px' }}
            className="scale-dialog"
        >
            <div className="scale-dialog-content">
                <div className="scale-summary">
                    <p className="scale-summary-text">
                        You measured:
                        <strong className="scale-summary-value">
                            {pixelDistance?.toFixed(2)} px
                        </strong>
                    </p>
                </div>

                <div className="scale-input-group">
                    <label className="scale-input-label">Real‑world distance (meters)</label>
                    <InputNumber
                        value={meters}
                        onValueChange={(e) => setMeters(e.value)}
                        min={0.01}
                        step={0.1}
                        placeholder="Enter meters"
                        className="scale-input"
                        inputStyle={{ width: '100%' }}
                    />
                </div>

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

export default function ScaleCalibrationTool({ calibration, viewBox, handleRadius }) {
    const { start, end, cursor, showModal, distancePx, applyCalibration, cancelCalibration } =
        calibration;

    return (
        <>
            <ScaleCalibrationOverlay
                viewBox={viewBox}
                start={start}
                end={end}
                cursor={cursor}
                handleRadius={handleRadius}
            />
            <ScaleCalibrationModal
                visible={showModal}
                pixelDistance={distancePx || 0}
                onApply={applyCalibration}
                onCancel={cancelCalibration}
            />
        </>
    );
}
