import React, { useState, useEffect } from 'react';


/*
The ImageUploader component allows users to upload a floor plan image in .png or .jpg format, before it is then passed to the DesignPage component for further interaction.
*/

function ImageUploader({ onImageUpload, currentImageSrc, onLogout, onNavigateToDesign }) {

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      alert('Please select a .png file or .jpg file only.');

      event.target.value = null; 
      return;
    }

    const newImageSrc = URL.createObjectURL(file);
    onImageUpload(newImageSrc);
  };



  return (
    <div className="upload-view">
      <header className="App-header">
        <h1>CCTV Design Tool</h1>
        <p>Step 1: Upload your site layout (.png)</p>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
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

        {currentImageSrc && (
          <div className="image-preview-container">
            <p>Here is your uploaded image:</p>
            <img src={currentImageSrc} alt="Uploaded preview" className="image-preview" />
          </div>
        )}
      </div>
      {currentImageSrc && (
        <button
          className="nav-button"
          onClick={onNavigateToDesign}
        >
          Go to Design Process
        </button>
      )}
    </div>
  );
}

export default ImageUploader;