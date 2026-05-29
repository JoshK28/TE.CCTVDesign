/*
Shared SVG primitive for the draft-line UX used by measure, scale calibration,
and wall drawing. It renders the optional connecting line, any endpoint/cursor
handles, and an optional label passed as children. Callers own their <svg>
wrapper and CSS classes so tool-specific styling stays explicit.

handles is an array of { point, className, radius?, key? }. Omitting radius
leaves the circle's size to CSS (measure), while a numeric radius sizes it
directly (scale). vectorEffect applies "non-scaling-stroke" to the line and
handles when true.
*/
export default function DraftLine({
    from = null,
    to = null,
    lineClassName,
    handles = [],
    vectorEffect = false,
    children = null,
}) {
    const stroke = vectorEffect ? 'non-scaling-stroke' : undefined;

    return (
        <>
            {from && to && (
                <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={lineClassName}
                    vectorEffect={stroke}
                />
            )}
            {handles.map((handle, index) =>
                handle?.point ? (
                    <circle
                        key={handle.key ?? index}
                        cx={handle.point.x}
                        cy={handle.point.y}
                        {...(handle.radius != null ? { r: handle.radius } : {})}
                        className={handle.className}
                        vectorEffect={stroke}
                    />
                ) : null
            )}
            {children}
        </>
    );
}
