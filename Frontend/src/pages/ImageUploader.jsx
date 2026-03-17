import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";

/*
The ImageUploader component allows users to upload a floor plan image in .png or .jpg format, before it is then passed to the DesignPage component for further interaction.
*/

function ImageUploader({ onLogout }) {

  const [imageSrc, setImageSrc] = useState(null);
  const navigate = useNavigate();

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      alert('Please select a .png file or .jpg file only.');
      setImageSrc(null);
      event.target.value = null; 
      return;
    }

    const newImageSrc = URL.createObjectURL(file);
    setImageSrc(newImageSrc);
  };

  const handleProceedToDesign = () => {
    // This routes the user AND secretly passes the imageSrc in memory
    navigate("/app/design", { state: { imageSrc } });
  };

  return (
    <div className="upload-view">
      <header className="App-header">
        <h1>CCTV Design Tool</h1>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
        <p>Step 1: Upload your site layout (.png)</p>
      </header>
      <div className="image-uploader">
        <input
          type="file"
          id="imageUpload"
          accept="image/png, image/jpeg"
          onChange={handleImageChange}
          className="hidden-input"
        />
        <label htmlFor="imageUpload" className="upload-button">
          Select .PNG or .JPG Image
        </label>

        {imageSrc && (
          <div className="image-preview-container">
            <p>Here is your uploaded image:</p>
            <img src={imageSrc} 
            alt="Uploaded preview" 
            className="image-preview" 
            style={{ maxWidth: '800px', width: '150%', height: 'auto' }} />
          </div>
        )}
      </div>
      {imageSrc && (
        <button onClick={handleProceedToDesign} style={{ padding: "10px 30px", fontSize: "16px" }}>
          Go to Design Process
        </button>
      )}
    </div>
  );
}

export default ImageUploader;