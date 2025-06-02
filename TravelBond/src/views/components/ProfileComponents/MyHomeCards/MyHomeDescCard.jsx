import React from "react";
import { Card, Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import "./myHomeCards.css";

const MyHomeDescCard = ({ 
  description, 
  isEditing, 
  onEditClick, 
  onDescriptionChange, 
  onSave, 
  onCancel,
  readOnly 
}) => {
  const { showAlert, showConfirmation } = useSweetAlert();

  const handleSaveWithConfirmation = async () => {
    try {
      const result = await showConfirmation(
        "Are you sure?",
        "Do you want to save the changes to your home description?",
        "warning",
        "Yes, save it!",
        "Cancel"
      );

      if (result.isConfirmed) {
        await onSave();
        showAlert("Success!", "Your description has been updated.", "success", "OK");
      }
    } catch (error) {
      console.error("Error saving description:", error);
      showAlert("Error", "Failed to update description.", "error", "OK");
    }
  };

  return (
    <Card className="my-home-section p-3 mb-3 shadow-sm">
      <div className="my-home-header">
        <h5>My Home Description</h5>
        {!readOnly && !isEditing && (
          <Button variant="link" onClick={onEditClick}>
            <FontAwesomeIcon icon={faEdit}/>
          </Button>
        )}
      </div>

      {!readOnly && isEditing ? (
        <>
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={4}
              value={description}
              onChange={onDescriptionChange}
              placeholder="Describe your home..."
            />
          </Form.Group>

          <div className="my-home-actions">
            <Button variant="primary" onClick={handleSaveWithConfirmation} className="me-2" style={{backgroundColor: "var(--identity-color, #39aaa4)"}}>
              Save Changes
            </Button>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <p>{description || "No description provided."}</p>
      )}
    </Card>
  );
};

export default MyHomeDescCard;