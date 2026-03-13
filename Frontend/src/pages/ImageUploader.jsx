import React, { useState, useEffect } from 'react';


/*
The ImageUploader component allows users to upload a floor plan image in .png or .jpg format, before it is then passed to the DesignPage component for further interaction.
*/

function ImageUploader({onImageUpload}) {

  const [imageSrc, setImageSrc] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      alert('Please select a .png file or .jpg file only.');

      setImageSrc(null); 
      event.target.value = null; 
      return;
    }

    const newImageSrc = URL.createObjectURL(file);
    onImageUpload(newImageSrc);
  };



  return (
    <div className="image-uploader">
      <input
        type="file"
        id="imageUpload"
        accept="image/png, image/jpeg"
        onChange={handleImageChange}
        className="hidden-input"
      />
      <label htmlFor="pngUpload" className="upload-button">
        Select .PNG or .JPG Image
      </label>

      {imageSrc && (
        <div className="image-preview-container">
          <p>Here is your uploaded image:</p>
          <img src={imageSrc} alt="Uploaded preview" className="image-preview" />
        </div>
      )}
    </div>
  );
}

export default ImageUploader;