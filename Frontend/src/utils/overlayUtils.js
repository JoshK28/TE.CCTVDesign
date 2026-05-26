// Build the SVG viewBox string ("0 0 W H") that matches the floor image's
// natural dimensions, so overlays (FOV, walls, obstacles) line up with the
// image regardless of how the browser scales it. Returns undefined when the
// image hasn't loaded yet so SVGs can defer rendering.
export const getViewBox = (imageSize) =>
  imageSize?.naturalWidth && imageSize?.naturalHeight
    ? `0 0 ${imageSize.naturalWidth} ${imageSize.naturalHeight}`
    : undefined;
