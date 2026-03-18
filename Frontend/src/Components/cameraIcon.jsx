import React from 'react';

export default function CameraIcon({ x, y }) {
  return (
    <div
      className="camera-icon"
      style={{ left: x, top: y }}
      title={`Camera at (${Math.round(x)}, ${Math.round(y)})`}
    >
      📷
    </div>
  );
}