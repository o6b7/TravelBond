import React, { useState, useEffect } from "react";
import { Card, Button, Modal, Row, Col, Image } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faTimes, 
  faChevronLeft, 
  faChevronRight,
  faCloudUploadAlt
} from "@fortawesome/free-solid-svg-icons";
import PaginationControls from "../../Common/PaginationControls";
import { usePagination } from "../../../../hooks/usePagination";
import "./myHomeCards.css";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import PhotoUploader from "../../Common/PhotoUploader/PhotoUploader";
import { ref } from "firebase/storage";
import { storage } from "../../../../utils/firebaseConfig";

const MyHomePhotosCard = ({
  photos,
  isEditing,
  onEditClick,
  onSave,
  onCancel,
  readOnly
}) => {
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [tempPhotos, setTempPhotos] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [editedPhotos, setEditedPhotos] = useState([]);
  
  const { visibleItems, showMore, showLess } = usePagination(3, 3);
  const displayedPhotos = [...photos, ...tempPhotos].slice(0, visibleItems);
  const remainingPhotos = [...photos, ...tempPhotos].length - visibleItems;
  const { showAlert, showConfirmation } = useSweetAlert();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showFullscreenModal) {
        if (e.key === 'ArrowLeft') {
          navigatePhotos(-1);
        } else if (e.key === 'ArrowRight') {
          navigatePhotos(1);
        } else if (e.key === 'Escape') {
          setShowFullscreenModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenModal, selectedPhotoIndex, photos, tempPhotos]); // Add dependencies
  
  const handleEditClick = () => {
    setEditedPhotos([...photos]); 
    onEditClick(); 
  };  

  const handleRemoveExistingPhoto = async (index) => {
    const photoToRemove = editedPhotos[index];
    
    const result = await showConfirmation(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      'warning',
      'Yes, delete it',
      'Cancel'
    );
    
    if (result.isConfirmed) {
      setEditedPhotos((prev) => prev.filter((_, i) => i !== index));
      setPhotosToDelete((prev) => [...prev, photoToRemove]);
      showAlert('Deleted', 'Photo has been removed.', 'success', 'OK');
    }
  };

  const handleSave = async () => {
    if (readOnly) return;
  
    try {
      // Delete removed photos from Firebase Storage
      const deletePromises = photosToDelete.map(async (photoUrl) => {
        if (photoUrl.startsWith("https://")) {
          const decodedUrl = decodeURIComponent(photoUrl);
          const filePath = decodedUrl.split("/o/")[1].split("?")[0];
          const photoRef = ref(storage, filePath);
          await deleteObject(photoRef).catch(error => {
            console.error("Error deleting photo:", error);
          });
        }
      });
  
      await Promise.all(deletePromises);
  
      // Save updated photos
      const updatedPhotos = [...editedPhotos, ...tempPhotos];
      await onSave(updatedPhotos);
  
      // Reset states
      setTempPhotos([]);
      setEditedPhotos([]);
      setPhotosToDelete([]);
      
      showAlert('Success', 'Your photos have been saved successfully!', 'success', 'OK');
    } catch (error) {
      console.error("Error during saving:", error);
      showAlert('Error', 'Failed to save changes. Please try again.', 'error', 'OK');
    }
  };  

  const handleCancel = () => {
    // Clean up any uploaded temp photos from storage
    const cleanupPromises = tempPhotos.map(async (photoUrl) => {
      if (photoUrl.startsWith("https://")) {
        try {
          const decodedUrl = decodeURIComponent(photoUrl);
          const filePath = decodedUrl.split("/o/")[1].split("?")[0];
          const photoRef = ref(storage, filePath);
          await deleteObject(photoRef);
        } catch (error) {
          console.error("Error deleting temporary photo:", error);
        }
      }
    });

    Promise.all(cleanupPromises).finally(() => {
      // Reset all state
      setTempPhotos([]);
      setEditedPhotos([]);
      setPhotosToDelete([]);
      
      // Call the original onCancel
      onCancel();
    });
  };

  const openFullscreenModal = (index) => {
    const allPhotos = [...photos, ...tempPhotos];
    const actualIndex = allPhotos.findIndex(photo => photo === displayedPhotos[index]);
    setSelectedPhotoIndex(actualIndex >= 0 ? actualIndex : 0);
    setShowFullscreenModal(true);
  };

  const navigatePhotos = (direction) => {
    const allPhotos = [...photos, ...tempPhotos];
    const totalPhotos = allPhotos.length;
    if (totalPhotos <= 1) return; 
    
    let newIndex = selectedPhotoIndex + direction;
    
    if (newIndex < 0) newIndex = totalPhotos - 1;
    if (newIndex >= totalPhotos) newIndex = 0;
    
    setSelectedPhotoIndex(newIndex);
  };

  const handleUploadComplete = (newPhotos) => {
    setTempPhotos(newPhotos);
  };

  const handleRemovePhoto = (updatedPhotos) => {
    if (updatedPhotos.some(photo => photos.includes(photo))) {
      setEditedPhotos(updatedPhotos.filter(photo => photos.includes(photo)));
      setTempPhotos(updatedPhotos.filter(photo => !photos.includes(photo)));
    } else {
      setTempPhotos(updatedPhotos);
    }
  };

  return (
    <Card className="my-home-section p-3 mb-3 shadow-sm">
      <div className="my-home-header">
        <h5>My Home Photos</h5>
        {!readOnly && !isEditing && (
          <Button variant="link" onClick={handleEditClick}>
            <FontAwesomeIcon icon={faEdit} />
          </Button>
        )}
      </div>

      {isEditing ? (
        <>
          <Row className="g-3">
            <PhotoUploader
              onUploadComplete={handleUploadComplete}
              onRemovePhoto={handleRemovePhoto}
              existingPhotos={editedPhotos}
              isEditing={isEditing}
              readOnly={readOnly}
              storagePath="home-pictures"
              maxFiles={20} 
              maxFileSize={5} 
            />
          </Row>
          
          <div className="my-home-actions mt-3 d-flex justify-content-end gap-2">
            <Button 
              variant="primary" 
              onClick={handleSave} 
              style={{ backgroundColor: "var(--identity-color, #39aaa4)" }}
            >
              <FontAwesomeIcon icon={faCloudUploadAlt} className="me-2" />
              Save Changes
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <Row className="g-3">
            {displayedPhotos.length > 0 ? (
              displayedPhotos.map((photo, index) => (
                <Col xs={12} sm={6} md={4} key={`photo-${index}`}>
                  <div className="my-home-photo-container">
                    <Image
                      src={photo}
                      alt={`Home photo ${index + 1}`}
                      thumbnail
                      onClick={() => openFullscreenModal(index)}
                      className="photo-thumbnail"
                    />
                  </div>
                </Col>
              ))
            ) : (
              <Col>
                <div className="no-photos-placeholder text-center py-4">
                  <FontAwesomeIcon icon={faCloudUploadAlt} size="3x" className="mb-3 text-muted" />
                  <p className="text-muted">No photos uploaded yet</p>
                </div>
              </Col>
            )}
          </Row>

          {([...photos, ...tempPhotos].length > 3 || remainingPhotos > 0) && (
            <PaginationControls
              onShowMore={showMore}
              onShowLess={showLess}
              remainingItems={remainingPhotos}
              initialCount={3}
            />
          )}
        </>
      )}

      {/* Fullscreen Photo Modal */}
      <Modal 
        show={showFullscreenModal} 
        onHide={() => setShowFullscreenModal(false)}
        fullscreen
        centered
        backdrop="static"
        className="fullscreen-photo-modal"
      >
        <Modal.Header className="border-0">
          <Button 
            variant="light" 
            onClick={() => setShowFullscreenModal(false)}
            className="close-btn"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </Button>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center align-items-center p-0 position-relative">
          <div className="fullscreen-photo-container">
            {([...photos, ...tempPhotos].length > 0) ? (
              <Image 
                src={[...photos, ...tempPhotos][selectedPhotoIndex]}
                alt={`Fullscreen view (${selectedPhotoIndex + 1})`}
                fluid
                className="fullscreen-photo"
              />
            ) : (
              <p>No photo available</p>
            )}
          </div>
          
          {/* Navigation Arrows */}
          {([...photos, ...tempPhotos].length > 1) && (
            <>
              <Button 
                variant="light" 
                className="nav-btn prev-btn rounded-circle"
                onClick={() => navigatePhotos(-1)}
                aria-label="Previous photo"
                style={{ width: '50px', height: '50px' }}
              >
                <FontAwesomeIcon icon={faChevronLeft} size="lg" />
              </Button>
              <Button 
                variant="light" 
                className="nav-btn next-btn rounded-circle"
                onClick={() => navigatePhotos(1)}
                aria-label="Next photo"
                style={{ width: '50px', height: '50px' }}
              >
                <FontAwesomeIcon icon={faChevronRight} size="lg" />
              </Button>
            </>
          )}
          
          {/* Photo Counter */}
          {([...photos, ...tempPhotos].length > 1) && (
            <div className="photo-counter">
              {selectedPhotoIndex + 1} / {[...photos, ...tempPhotos].length}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default MyHomePhotosCard;