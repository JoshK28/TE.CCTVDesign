import { useState, useCallback, useEffect } from 'react';
import { getImagePoint } from '../utils/points';
import ScaleCalibrationModal from './ScaleCalibrationModal';

/*
Scale calibration for the design workspace: two-click line measurement on the
floor plan, SVG overlay, modal for real-world distance, and ESC to clear/exit.
*/
export function useScaleCalibration({ active, imageSize, onApply, onDeactivate }) {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [cursor, setCursor] = useState(null);
    const [distancePx, setDistancePx] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [escCount, setEscCount] = useState(0);

    const reset = useCallback(() => {
        setStart(null);
        setEnd(null);
        setCursor(null);
        setDistancePx(null);
        setShowModal(false);
        setEscCount(0);
    }, []);

    useEffect(() => {
        if (!active) reset();
    }, [active, reset]);

    const handleClick = useCallback(
        (event) => {
            if (!active || !imageSize) return false;

            const { x, y } = getImagePoint(event, event.currentTarget, imageSize);

            if (!start) {
                setStart({ x, y });
                return true;
            }

            if (!end) {
                const endPoint = { x, y };
                setEnd(endPoint);
                setDistancePx(Math.hypot(endPoint.x - start.x, endPoint.y - start.y));
                setShowModal(true);
                return true;
            }

            return true;
        },
        [active, imageSize, start, end]
    );

    const handlePointerMove = useCallback(
        (event) => {
            if (!active || !imageSize) return;
            setCursor(getImagePoint(event, event.currentTarget, imageSize));
        },
        [active, imageSize]
    );

    const handleEscape = useCallback(() => {
        if (!active) return false;

        if (start || end || showModal) {
            reset();
            setEscCount(1);
            return true;
        }

        if (escCount === 1) {
            setEscCount(0);
            onDeactivate?.();
            return true;
        }

        return false;
    }, [active, start, end, showModal, escCount, reset, onDeactivate]);

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

function ScaleCalibrationOverlay({ viewBox, start, end, cursor }) {
    if (!viewBox) return null;

    if (!start && cursor) {
        return (
            <svg className="scale-overlay" viewBox={viewBox} preserveAspectRatio="none">
                <circle cx={cursor.x} cy={cursor.y} r="8" className="scale-handle" />
            </svg>
        );
    }

    if (start && !end && cursor) {
        return (
            <svg className="scale-overlay" viewBox={viewBox} preserveAspectRatio="none">
                <line
                    x1={start.x}
                    y1={start.y}
                    x2={cursor.x}
                    y2={cursor.y}
                    className="scale-line"
                />
                <circle cx={start.x} cy={start.y} r="8" className="scale-handle" />
                <circle cx={cursor.x} cy={cursor.y} r="8" className="scale-handle" />
            </svg>
        );
    }

    if (start && end) {
        return (
            <svg className="scale-overlay" viewBox={viewBox} preserveAspectRatio="none">
                <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    className="scale-line"
                />
                <circle cx={start.x} cy={start.y} r="8" className="scale-handle" />
                <circle cx={end.x} cy={end.y} r="8" className="scale-handle" />
            </svg>
        );
    }

    return null;
}

export default function ScaleCalibrationTool({ calibration, viewBox }) {
    const { start, end, cursor, showModal, distancePx, applyCalibration, cancelCalibration } =
        calibration;

    return (
        <>
            <ScaleCalibrationOverlay viewBox={viewBox} start={start} end={end} cursor={cursor} />
            <ScaleCalibrationModal
                visible={showModal}
                pixelDistance={distancePx || 0}
                onApply={applyCalibration}
                onCancel={cancelCalibration}
            />
        </>
    );
}
