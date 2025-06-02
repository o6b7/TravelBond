import React, { useState } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import { getAuth } from "firebase/auth";
import PhotoUploader from "../../Common/PhotoUploader/PhotoUploader";
import "./postCard.css";

const CreatePostCard = ({ onCreatePost, onCancel }) => {
  const [description, setDescription] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const { showAlert, showConfirmation } = useSweetAlert();
  const auth = getAuth();

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handlePhotoUploadComplete = (photos) => {
    setUploadedPhotos(photos);
  };

  const handleRemovePhoto = (updatedPhotos) => {
    setUploadedPhotos(updatedPhotos);
  };

  const handleCancel = () => {
    if (description || uploadedPhotos.length > 0) {
      showConfirmation(
        "Discard Post?",
        "Are you sure you want to discard this post? Your changes will be lost.",
        "warning",
        "Discard",
        "Cancel"
      ).then((result) => {
        if (result.isConfirmed) {
          resetForm();
          onCancel();
        }
      });
    } else {
      onCancel();
    }
  };

  const resetForm = () => {
    setDescription("");
    setUploadedPhotos([]);
    setIsUploading(false);
  };

  const handleUpload = async () => {
    const user = auth.currentUser; 

    if (!user) {
      showAlert("Error", "You must be logged in to upload files.", "error", "OK");
      return;
    }

    if (!description && uploadedPhotos.length === 0) {
      showAlert("Empty Post", "Please add some text or photos to your post.", "warning", "OK");
      return;
    }

    const result = await showConfirmation(
      "Are you sure?",
      "Do you want to upload this post?",
      "warning",
      "Yes, upload it!",
      "Cancel"
    );

    if (result.isConfirmed) {
      setIsUploading(true);
      try {
        await onCreatePost(description, uploadedPhotos);
        resetForm();
        showAlert("Success!", "Your post has been uploaded.", "success", "OK");
      } catch (error) {
        console.error("Error uploading post:", error);
        showAlert("Error", "Failed to upload post. Please try again.", "error", "OK");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="post-card create-post-card">
      <Form.Group className="mb-3">
        <Form.Control
          as="textarea"
          rows={3}
          value={description}
          onChange={handleDescriptionChange}
          placeholder="What's on your mind?"
          disabled={isUploading}
        />
      </Form.Group>

      <PhotoUploader
        onUploadComplete={handlePhotoUploadComplete}
        onRemovePhoto={handleRemovePhoto}
        isEditing={true}
        readOnly={isUploading}
        storagePath="post-media"
        maxFiles={10}
        maxFileSize={5}
      />

      <div className="d-flex justify-content-between mt-3">
        <Button 
          variant="outline-secondary" 
          onClick={handleCancel}
          disabled={isUploading}
        >
          <FontAwesomeIcon icon={faTimes} /> Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUpload} 
          disabled={isUploading}
          style={{backgroundColor: "var(--identity-color)", border: "none"}}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
};

export default CreatePostCard;