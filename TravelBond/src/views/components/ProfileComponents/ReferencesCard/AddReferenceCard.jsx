import React, { useState, useEffect } from "react";
import { Button, Form, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import UserController from "../../../../controllers/UserController";
import IdGenerator from "../../../../utils/IdGenerator";

const AddReferenceCard = ({ userId, onAddReference, existingReferences = [] }) => {
  const [content, setContent] = useState("");
  const [referenceType, setReferenceType] = useState("host");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert } = useSweetAlert();
  const [hasExistingType, setHasExistingType] = useState(false);

  // Check if user already has a reference of the selected type
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("userData"));
    if (!currentUser) return;

    const existingType = existingReferences.some(
      ref => ref.type === referenceType && ref.userId === currentUser.id
    );
    setHasExistingType(existingType);
  }, [referenceType, existingReferences]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Check if reference of this type already exists
      const currentUser = JSON.parse(localStorage.getItem("userData"));
      if (!currentUser) {
        showAlert("Error", "You need to be logged in to add references", "error", "OK");
        return;
      }

      const existingType = existingReferences.some(
        ref => ref.type === referenceType && ref.userId === currentUser.id
      );

      if (existingType) {
        showAlert(
          "Error", 
          "You've already added a reference of this type. You can only add one reference per type.", 
          "error", 
          "OK"
        );
        return;
      }

      // Generate reference ID
      const refId = await IdGenerator.generateId("reference");

      // Create reference object
      const newReference = {
        id: refId,
        userId: currentUser.id,
        userName: currentUser.name,
        content,
        type: referenceType,
        rating,
        date: new Date()
      };

      // Add to user's references
      await UserController.addReference(userId, newReference);
      
      // Call parent callback
      onAddReference(newReference);
      
      // Reset form
      setContent("");
      setReferenceType("host");
      setRating(0);
      
      showAlert("Success", "Reference added successfully!", "success", "OK");
    } catch (error) {
      console.error("Error adding reference:", error);
      showAlert("Error", "Failed to add reference. Please try again.", "error", "OK");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setReferenceType("host");
    setRating(0);
  };

  return (
    <Card className="mb-3">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Your Reference</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting || hasExistingType}
            />
            {hasExistingType && (
              <small className="text-danger">
                You've already added a {referenceType} reference. You can only add one reference per type.
              </small>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Were you a...</Form.Label>
            <Form.Select 
              value={referenceType}
              onChange={(e) => setReferenceType(e.target.value)}
              required
              disabled={isSubmitting}
            >
              <option value="host">Host</option>
              <option value="traveller">Traveller</option>
              <option value="personal">Personal</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesomeIcon
                  key={star}
                  icon={faStar}
                  className={`star-icon ${star <= (hoverRating || rating) ? "filled" : "empty"}`}
                  onClick={() => !isSubmitting && !hasExistingType && setRating(star)}
                  onMouseEnter={() => !isSubmitting && !hasExistingType && setHoverRating(star)}
                  onMouseLeave={() => !isSubmitting && !hasExistingType && setHoverRating(0)}
                />
              ))}
            </div>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="secondary" 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={isSubmitting || !content.trim() || hasExistingType}
              className="custom-btn"
              style={{ backgroundColor: "var(--identity-color, #39aaa4)", border: "none"}}
            >
              {isSubmitting ? "Adding..." : "Add Reference"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AddReferenceCard;