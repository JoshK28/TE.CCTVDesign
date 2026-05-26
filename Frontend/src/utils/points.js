export const getImagePoint = (event, target = event.currentTarget, imageSize) => {
  if (!target) return { x: 0, y: 0 };

  const rect = target.getBoundingClientRect();
  const naturalWidth = imageSize?.naturalWidth ?? rect.width;
  const naturalHeight = imageSize?.naturalHeight ?? rect.height;
  const scaleX = rect.width ? naturalWidth / rect.width : 1;
  const scaleY = rect.height ? naturalHeight / rect.height : 1;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};
