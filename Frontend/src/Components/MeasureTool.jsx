/* eslint-disable react-refresh/only-export-components -- co-located hook + overlay */
import { useCallback, useState } from 'react';
import useDraftLine from '../hooks/useDraftLine';
import { metersFromPoints } from '../utils/scale';
import DraftLine from './DraftLine';

export function useMeasure({ active, imageSize, onDeactivate }) {
    const [escCount, setEscCount] = useState(0);
    const {
        start,
        end,
        preview,
        cursor,
        hasDraft,
        reset: resetLine,
        handleClick,
        handlePointerMove,
        completeWithPreview,
    } = useDraftLine({ active, imageSize });

    const reset = useCallback(() => {
        resetLine();
        setEscCount(0);
    }, [resetLine]);

    const handleEscape = useCallback(() => {
        if (!active) return false;

        if (hasDraft) {
            reset();
            setEscCount(1);
            return true;
        }

        if (escCount === 1 || !hasDraft) {
            setEscCount(0);
            onDeactivate?.();
            return true;
        }

        return false;
    }, [active, hasDraft, escCount, reset, onDeactivate]);

    const handleEnter = useCallback(() => completeWithPreview(), [completeWithPreview]);

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

function MeasureDistanceLabel({ from, to, ppm }) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const meters = metersFromPoints(from, to, ppm);

    return (
        <>
            <rect x={midX - 30} y={midY - 14} width="60" height="28" className="measure-label-bg" />
            <text x={midX} y={midY} className="measure-label-text">
                {meters != null ? `${meters.toFixed(2)} m` : 'N/A'}
            </text>
        </>
    );
}

function MeasureOverlay({ viewBox, active, start, end, preview, cursor, ppm }) {
    if (!viewBox) return null;

    let from = null;
    let to = null;
    let lineClassName = null;
    let handles = [];
    let label = null;

    if (active && !start && cursor) {
        handles = [{ point: cursor, className: 'measure-point-start' }];
    } else if (start && end) {
        from = start;
        to = end;
        lineClassName = 'measure-line';
        handles = [
            { point: start, className: 'measure-point-start' },
            { point: end, className: 'measure-point-end' },
        ];
        label = <MeasureDistanceLabel from={start} to={end} ppm={ppm} />;
    } else if (start && !end && preview) {
        from = start;
        to = preview;
        lineClassName = 'measure-line measure-line--preview';
        handles = [{ point: start, className: 'measure-point-start' }];
        label = <MeasureDistanceLabel from={start} to={preview} ppm={ppm} />;
    } else {
        return null;
    }

    return (
        <svg className="measure-overlay" viewBox={viewBox} preserveAspectRatio="none">
            <DraftLine from={from} to={to} lineClassName={lineClassName} handles={handles}>
                {label}
            </DraftLine>
        </svg>
    );
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
