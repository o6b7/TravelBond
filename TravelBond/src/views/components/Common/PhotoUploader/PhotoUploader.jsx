import React, { useState, useCallback } from "react";
import { Form, Image, Button, Col, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudUploadAlt, faImage, faTrash } from "@fortawesome/free-solid-svg-icons";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import { storage } from "../../../../utils/firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import "./photoUploader.css";

const PhotoUploader = ({ 
  onUploadComplete, 
  onRemovePhoto, 
  existingPhotos = [], 
  isEditing,
  readOnly,
  storagePath = "uploads", // Default path if not specified
  maxFiles = 10, // Default maximum files
  maxFileSize = 5 // Default max file size in MB
}) => {
  const [tempPhotos, setTempPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { showAlert, showConfirmation } = useSweetAlert();

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (readOnly || !isEditing) return;
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') && file.size <= maxFileSize * 1024 * 1024
    );
    
    if (files.length > 0) {
      handlePhotoUpload(files);
    } else {
      showAlert("Invalid Files", `Please upload only image files under ${maxFileSize}MB`, "error", "OK");
    }
  }, [readOnly, isEditing, maxFileSize, showAlert]);

  const handlePhotoChange = (e) => {
    if (readOnly || !e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= maxFileSize * 1024 * 1024
    );
    
    if (validFiles.length !== files.length) {
      showAlert("Invalid Files", `Some files were skipped. Only image files under ${maxFileSize}MB are allowed.`, "warning", "OK");
    }
    
    if (validFiles.length > 0) {
      if (existingPhotos.length + tempPhotos.length + validFiles.length > maxFiles) {
        showAlert("Maximum Files Reached", `You can only upload up to ${maxFiles} photos.`, "error", "OK");
        return;
      }
      handlePhotoUpload(validFiles);
    }
  };

  const handlePhotoUpload = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls = await Promise.all(
        files.map((file) => {
          const uniqueFile = new File([file], `${uuidv4()}-${file.name}`, { type: file.type });
          const path = `${storagePath}/${uniqueFile.name}`;
          const uploadTask = uploadBytesResumable(ref(storage, path), uniqueFile);

          return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
              snapshot => {
                const progress = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
              },
              error => reject(error),
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
              }
            );
          });
        })
      );

      const newPhotos = [...tempPhotos, ...uploadedUrls];
      setTempPhotos(newPhotos);
      onUploadComplete(newPhotos);
    } catch (error) {
      console.error("Upload error:", error);
      showAlert("Upload Failed", "Could not upload all images. Try again.", "error", "OK");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveTempPhoto = async (index) => {
    if (readOnly) return;
    
    const result = await showConfirmation(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      'warning',
      'Yes, remove it',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      try {
        const photoUrl = tempPhotos[index];
        if (photoUrl.startsWith("https://")) {
          const decodedUrl = decodeURIComponent(photoUrl);
          const filePath = decodedUrl.split("/o/")[1].split("?")[0];
          const photoRef = ref(storage, filePath);
          await deleteObject(photoRef);
        }

        const updatedPhotos = [...tempPhotos];
        updatedPhotos.splice(index, 1);
        setTempPhotos(updatedPhotos);
        onRemovePhoto(updatedPhotos);
        showAlert('Removed', 'Photo has been removed.', 'success', 'OK');
      } catch (error) {
        console.error("Error deleting photo:", error);
        showAlert('Error', 'Failed to remove photo.', 'error', 'OK');
      }
    }
  };

  const handleRemoveExistingPhoto = async (index) => {
    if (readOnly) return;
    
    const result = await showConfirmation(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      'warning',
      'Yes, remove it',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      try {
        const updatedPhotos = [...existingPhotos];
        updatedPhotos.splice(index, 1);
        onRemovePhoto(updatedPhotos);
        showAlert('Removed', 'Photo has been removed.', 'success', 'OK');
      } catch (error) {
        console.error("Error removing photo:", error);
        showAlert('Error', 'Failed to remove photo.', 'error', 'OK');
      }
    }
  };

  return (
    <>
      <Row className="uploaded-photos-row g-3">
        {existingPhotos.map((photo, index) => (
          <Col xs={6} md={4} lg={3} key={`existing-${index}`}>
            <div className="photo-container position-relative">
              <Image
                src={photo}
                alt={`Photo ${index + 1}`}
                thumbnail
                className="photo-thumbnail"
              />
              {isEditing && !readOnly && (
                <Button
                  variant="danger"
                  size="sm"
                  className="remove-photo-button"
                  onClick={() => handleRemoveExistingPhoto(index)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              )}
            </div>
          </Col>
        ))}

        {tempPhotos.map((photo, index) => (
          <Col xs={6} md={4} lg={3} key={`temp-${index}`}>
            <div className="photo-container position-relative">
              <Image
                src={photo}
                alt={`Temp Photo ${index + 1}`}
                thumbnail
                className="photo-thumbnail"
              />
              {isEditing && !readOnly && (
                <Button
                  variant="danger"
                  size="sm"
                  className="remove-photo-button"
                  onClick={() => handleRemoveTempPhoto(index)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              )}
            </div>
          </Col>
        ))}

        {isEditing && (existingPhotos.length + tempPhotos.length < maxFiles) && (
          <Col xs={6} md={4} lg={3}>
            <div 
              className={`add-photo-container ${isDragging ? 'dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Form.Group controlId="formFile" className="mb-3 h-100">
                <Form.Label className="d-flex flex-column align-items-center justify-content-center h-100 add-photo-btn p-4">
                  <div className="upload-icon-container mb-3">
                    <FontAwesomeIcon icon={isUploading ? faCloudUploadAlt : faImage} size="2x" />
                    {isUploading && (
                      <div className="upload-progress-circle">
                        <div 
                          className="progress-circle" 
                          style={{ 
                            background: `conic-gradient(var(--identity-color, #39aaa4) ${uploadProgress * 3.6}deg, #e0e0e0 0deg)`
                          }}
                        ></div>
                        <span className="progress-text">{Math.round(uploadProgress)}%</span>
                      </div>
                    )}
                  </div>
                  {isUploading ? (
                    <div></div>
                  ) : (
                    <>
                      <span className="fw-bold mb-1">Add Photos</span>
                      <small className="text-muted text-center">
                        Drag & drop images here or click to browse
                      </small>
                      <small className="text-muted mt-1">JPEG, PNG (Max {maxFileSize}MB)</small>
                    </>
                  )}
                  <Form.Control 
                    type="file" 
                    onChange={handlePhotoChange} 
                    multiple 
                    accept="image/*" 
                    style={{ display: 'none' }}
                  />
                </Form.Label>
              </Form.Group>
            </div>
          </Col>
        )}
      </Row>
    </>
  );
};

export default PhotoUploader;