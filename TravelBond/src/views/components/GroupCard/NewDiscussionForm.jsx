import React from "react";
import { Card, Button, Alert } from "react-bootstrap";

const NewDiscussionForm = ({ 
  showNewDiscussionForm, 
  setShowNewDiscussionForm, 
  handleNewDiscussionSubmit, 
  newDiscussionTitle, 
  setNewDiscussionTitle, 
  newDiscussionContent, 
  setNewDiscussionContent,
  isParticipant,
  userId // Add userId prop to check login status
}) => {

  if (!isParticipant || !userId) {
    return (
      <Card className="mb-3">
        <Card.Body>
          <Alert variant="info">
            You must be a participant of this group to post discussions. 
            Join the group to start contributing!
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <Card.Body>
        {showNewDiscussionForm ? (
          <>
            <form>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Discussion Title"
                  value={newDiscussionTitle}
                  onChange={(e) => setNewDiscussionTitle(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Discussion Content"
                  value={newDiscussionContent}
                  onChange={(e) => setNewDiscussionContent(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleNewDiscussionSubmit}
                className="me-2 custom-btn"
              >
                Post Discussion
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowNewDiscussionForm(false)}
              >
                Cancel
              </Button>
            </form>
          </>
        ) : (
          <Button
            variant="primary"
            onClick={() => setShowNewDiscussionForm(true)}
            className="custom-btn"
          >
            Add New Discussion
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default NewDiscussionForm;