export const getLocalPoint = (event, target = event.currentTarget) => {
  const rect = target.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
};
