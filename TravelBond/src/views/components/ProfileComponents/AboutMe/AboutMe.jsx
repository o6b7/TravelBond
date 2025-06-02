import React, { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import "./aboutMe.css";

const AboutMe = ({ userData, onUpdate, readOnly }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(userData.bio || "");
  const { showAlert, showConfirmation } = useSweetAlert();

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleBioChange = (e) => {
    setBio(e.target.value);
  };

  const handleSave = async () => {
    try {
      const result = await showConfirmation(
        "Are you sure?",
        "Do you want to save the changes to your bio?",
        "warning",
        "Yes, save it!",
        "Cancel"
      );

      if (result.isConfirmed) {
        const updatedData = { ...userData, bio };
        await onUpdate(updatedData);
        setIsEditing(false);
        showAlert("Success!", "Your bio has been updated.", "success", "OK");
      }
    } catch (error) {
      console.error("Error updating bio:", error);
      showAlert("Error", "Failed to update bio.", "error", "OK");
    }
  };

  return (
    <Card className="about-me-section p-3 mb-3 shadow-sm">
      <div className="about-me-header">
        <h5>About Me</h5>
        {!readOnly && !isEditing && (
          <Button variant="link" onClick={handleEditClick}>
            <FontAwesomeIcon icon={faEdit} />
          </Button>
        )}
      </div>

      {!readOnly && isEditing ? (
        <>
          <Form.Control
            as="textarea"
            rows={4}
            value={bio}
            onChange={handleBioChange}
            placeholder="Tell us about yourself..."
          />
          <div className="about-me-actions mt-3">
            <Button variant="primary" onClick={handleSave} className="me-2">
              Save Changes
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <p>{bio || "This user has not added a bio yet."}</p>
      )}
    </Card>
  );
};

export default AboutMe;