import { useCallback, useState } from 'react';
import { getImagePoint } from '../utils/points';

const emptyLine = {
    start: null,
    end: null,
    preview: null,
    cursor: null,
};

export default function useDraftLine({ active = true, imageSize } = {}) {
    const [line, setLine] = useState(emptyLine);
    const { start, end, preview, cursor } = line;

    const getPoint = useCallback(
        (event) => getImagePoint(event, event.currentTarget, imageSize),
        [imageSize]
    );

    const reset = useCallback(() => {
        setLine(emptyLine);
    }, []);

    const beginAt = useCallback((point, previewPoint = null) => {
        setLine({ start: point, end: null, preview: previewPoint, cursor: null });
    }, []);

    const endAt = useCallback((point) => {
        setLine((prev) => ({ ...prev, end: point, preview: null, cursor: null }));
    }, []);

    const handleClick = useCallback(
        (event) => {
            if (!active || !imageSize) return false;

            const point = getPoint(event);

            if (!start) {
                beginAt(point);
                return true;
            }

            if (!end) {
                endAt(point);
                return true;
            }

            return true;
        },
        [active, imageSize, getPoint, start, end, beginAt, endAt]
    );

    const handlePointerMove = useCallback(
        (event) => {
            if (!active || !imageSize) return null;

            const point = getPoint(event);

            setLine((prev) => {
                if (prev.end) return prev.cursor ? { ...prev, cursor: null } : prev;
                if (!prev.start) return { ...prev, cursor: point };
                return { ...prev, preview: point };
            });

            return point;
        },
        [active, imageSize, getPoint]
    );

    const completeWithPreview = useCallback(() => {
        if (!active || !start || end || !preview) return false;
        endAt(preview);
        return true;
    }, [active, start, end, preview, endAt]);

    return {
        start,
        end,
        preview,
        cursor,
        hasDraft: Boolean(start || end || preview || cursor),
        getPoint,
        beginAt,
        endAt,
        reset,
        handleClick,
        handlePointerMove,
        completeWithPreview,
    };
}
