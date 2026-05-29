import { useState, useCallback } from 'react';
import { getImagePoint } from '../utils/points';

/*
Measure tool for the design workspace: two-click distance measurement on the
floor plan with live preview, meter labels when scale is set, and ESC/Enter
keyboard shortcuts.
*/
export function useMeasure({ active, imageSize, onDeactivate }) {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [preview, setPreview] = useState(null);
    const [cursor, setCursor] = useState(null);
    const [escCount, setEscCount] = useState(0);

    const reset = useCallback(() => {
        setStart(null);
        setEnd(null);
        setPreview(null);
        setCursor(null);
        setEscCount(0);
    }, []);

    const handleClick = useCallback(
        (event) => {
            if (!active || !imageSize) return false;

            const { x, y } = getImagePoint(event, event.currentTarget, imageSize);

            if (!start) {
                setStart({ x, y });
                setCursor(null);
                return true;
            }

            if (!end) {
                setEnd({ x, y });
                setPreview(null);
                return true;
            }

            return true;
        },
        [active, imageSize, start, end]
    );

    const handlePointerMove = useCallback(
        (event) => {
            if (!active || !imageSize) return;

            const pt = getImagePoint(event, event.currentTarget, imageSize);

            if (!start) {
                setCursor(pt);
            }

            if (start && !end) {
                setPreview(pt);
            }
        },
        [active, imageSize, start, end]
    );

    const handleEscape = useCallback(() => {
        if (!active) return false;

        if (start || end || preview) {
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
    }, [active, start, end, preview, escCount, reset, onDeactivate]);

    const handleEnter = useCallback(() => {
        if (!active || !start || end || !preview) return false;
        setEnd(preview);
        setPreview(null);
        return true;
    }, [active, start, end, preview]);

    return {
        start,
        end,
        preview,
        cursor,
        reset,
        handleClick,
        handlePointerMove,
        handleEscape,
        handleEnter,
        preventContextMenu: active,
    };
}

const formatDistanceMeters = (from, to, ppm) => {
    if (!ppm || ppm <= 0) return null;
    return (Math.hypot(to.x - from.x, to.y - from.y) / ppm).toFixed(2);
};

function MeasureDistanceLabel({ from, to, ppm }) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const distMeters = formatDistanceMeters(from, to, ppm);

    return (
        <>
            <rect x={midX - 30} y={midY - 14} width="60" height="28" className="measure-label-bg" />
            <text x={midX} y={midY} className="measure-label-text">
                {distMeters != null ? `${distMeters} m` : 'N/A'}
            </text>
        </>
    );
}

function MeasureOverlay({ viewBox, active, start, end, preview, cursor, ppm }) {
    if (!viewBox) return null;

    if (active && !start && cursor) {
        return (
            <svg className="measure-overlay" viewBox={viewBox} preserveAspectRatio="none">
                <circle cx={cursor.x} cy={cursor.y} className="measure-point-start" />
            </svg>
        );
    }

    if (start && end) {
        return (
            <svg className="measure-overlay" viewBox={viewBox} preserveAspectRatio="none">
                <circle cx={start.x} cy={start.y} className="measure-point-start" />
                <circle cx={end.x} cy={end.y} className="measure-point-end" />
                <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="measure-line" />
                <MeasureDistanceLabel from={start} to={end} ppm={ppm} />
            </svg>
        );
    }

    if (start && !end && preview) {
        return (
            <svg className="measure-overlay" viewBox={viewBox} preserveAspectRatio="none">
                <circle cx={start.x} cy={start.y} className="measure-point-start" />
                <line
                    x1={start.x}
                    y1={start.y}
                    x2={preview.x}
                    y2={preview.y}
                    className="measure-line measure-line--preview"
                />
                <MeasureDistanceLabel from={start} to={preview} ppm={ppm} />
            </svg>
        );
    }

    return null;
}

export default function MeasureTool({ measure, viewBox, ppm, active }) {
    return (
        <MeasureOverlay
            viewBox={viewBox}
            active={active}
            start={measure.start}
            end={measure.end}
            preview={measure.preview}
            cursor={measure.cursor}
            ppm={ppm}
        />
    );
}
