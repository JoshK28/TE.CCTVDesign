export const getViewBox = (imageSize) =>
  imageSize?.naturalWidth && imageSize?.naturalHeight
    ? `0 0 ${imageSize.naturalWidth} ${imageSize.naturalHeight}`
    : undefined;
