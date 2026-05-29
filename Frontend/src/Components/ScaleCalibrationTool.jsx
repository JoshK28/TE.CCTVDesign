/* eslint-disable react-refresh/only-export-components -- co-located hook + overlay */
import { useCallback, useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

import useDraftLine from '../hooks/useDraftLine';
import { getDistancePx, ppmFromDistance } from '../utils/scale';
import DraftLine from './DraftLine';

import '../page_styling/designPage.css';

export function useScaleCalibration({ active, imageSize, onApply, onDeactivate }) {
    const {
        start,
        end,
        preview,
        cursor,
        hasDraft,
        reset,
        handleClick,
        handlePointerMove,
    } = useDraftLine({ active, imageSize });

    const showModal = Boolean(start && end);
    const distancePx = getDistancePx(start, end);

    useEffect(() => {
        if (!active) reset();
    }, [active, reset]);

    const handleEscape = useCallback(() => {
        if (!active) return false;

        if (hasDraft) {
            reset();
            return true;
        }

        onDeactivate?.();
        return true;
    }, [active, hasDraft, reset, onDeactivate]);

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
        preview,
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

export function ScaleCalibrationOverlay({ viewBox, start, end, preview, cursor, handleRadius = 8 }) {
    if (!viewBox) return null;

    const lineEnd = end || preview || (start && cursor);

    let from = null;
    let to = null;
    let handles = [];

    if (!start && !end && cursor) {
        handles = [{ point: cursor, className: 'scale-handle', radius: handleRadius }];
    } else if (start && lineEnd) {
        from = start;
        to = lineEnd;
        handles = [
            { point: start, className: 'scale-handle', radius: handleRadius },
            { point: lineEnd, className: 'scale-handle', radius: handleRadius },
        ];
    } else {
        return null;
    }

    return (
        <svg className="scale-overlay" viewBox={viewBox} preserveAspectRatio="none">
            <DraftLine from={from} to={to} lineClassName="scale-line" handles={handles} vectorEffect />
        </svg>
    );
}

function ScaleCalibrationModal({ visible, pixelDistance, onApply, onCancel }) {
    const [meters, setMeters] = useState(null);

    const handleApply = () => {
        const ppm = ppmFromDistance(pixelDistance, meters);
        if (ppm == null) return;
        onApply(ppm);
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
    const { start, end, preview, cursor, showModal, distancePx, applyCalibration, cancelCalibration } =
        calibration;

    return (
        <>
            <ScaleCalibrationOverlay
                viewBox={viewBox}
                start={start}
                end={end}
                preview={preview}
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
