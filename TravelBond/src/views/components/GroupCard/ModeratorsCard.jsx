import React, { useEffect, useState } from "react";
import { Card, Form, Button, ListGroup, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import UserController from "../../../controllers/UserController";
import GroupController from "../../../controllers/GroupController";
import useSweetAlert from "../../../hooks/useSweetAlert";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

const ModeratorsCard = ({ 
  mainModeratorData, 
  subModeratorsData = [], 
  groupId, 
  refreshGroupData, 
  currentUserId,
  isAdmin 
}) => {
  const [newModeratorInput, setNewModeratorInput] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");
  const { showAlert, showConfirmation } = useSweetAlert();
  const navigate = useNavigate();
  const auth = getAuth();

  // Check if current user is main moderator or admin
  const isMainModerator = currentUserId === mainModeratorData?.id;
  const canManageModerators = isMainModerator || isAdmin;
  const canDeleteGroup = isMainModerator || isAdmin;
  const location = useLocation();
  const { showDeletedAlert } = location.state || {};

  useEffect(() => {
    if (showDeletedAlert) {
      showAlert("Success!", "The group has been deleted.", "success", "OK");
      // Clear the state so it doesn't show again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [showDeletedAlert]);

  const handleAddModerator = async () => {
    try {
      if (!newModeratorInput.trim()) {
        showAlert("Error", "Please enter a user ID or email.", "error", "OK");
        return;
      }
  
      const user = await UserController.fetchUserByIdOrEmail(newModeratorInput);
  
      if (!user || !user.id || user.name === "Unknown User") { // 💥 Strong validation
        showAlert("Error", "User not found or invalid.", "error", "OK");
        return; // 🛑 STOP EVERYTHING
      }
  
      if (user.id === mainModeratorData?.id) {
        showAlert("Error", "You cannot add the main moderator as a sub-moderator.", "error", "OK");
        return;
      }
  
      if (subModeratorsData.some((mod) => mod.id === user.id)) {
        showAlert("Error", "User is already a moderator.", "error", "OK");
        return;
      }
  
      const confirmation = await showConfirmation(
        "Are you sure?",
        `Do you want to add ${user.name} as a moderator? This user will also be added as a participant if they are not already in the group.`,
        "question",
        "Yes, Add Moderator",
        "Cancel"
      );
  
      if (confirmation.isConfirmed) {
        if (!user.id) {
          showAlert("Error", "Cannot add invalid user.", "error", "OK");
          return;
        }
  
        await GroupController.addSubModerator(groupId, user.id);
        await GroupController.joinGroup(groupId, user.id);
  
        showAlert("Success!", `${user.name} has been added as a moderator and participant.`, "success", "OK");
        refreshGroupData();
        setNewModeratorInput("");
      }
    } catch (error) {
      console.error("Error adding moderator:", error);
      showAlert("Error", "Failed to add moderator. Please try again.", "error", "OK");
    }
  };
  
      
  const handleRemoveModerator = async (moderatorId) => {
    try {
      const moderator = subModeratorsData.find((mod) => mod.id === moderatorId);
  
      const confirmation = await showConfirmation(
        "Are you sure?",
        `Do you want to remove ${moderator.name} as a moderator? This action will not remove them from the group.`,
        "warning",
        "Yes, Remove Moderator",
        "Cancel"
      );
  
      if (confirmation.isConfirmed) {
        await GroupController.removeSubModerator(groupId, moderatorId);
        showAlert("Success!", `${moderator.name} has been removed as a moderator.`, "success", "OK");
        refreshGroupData();
      }
    } catch (error) {
      console.error("Error removing moderator:", error);
      showAlert("Error", "Failed to remove moderator. Please try again.", "error", "OK");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      // Admin doesn't need password confirmation
      if (!isAdmin) {
        if (!password.trim()) {
          showAlert("Error", "Please enter your password to confirm.", "error", "OK");
          return;
        }
  
        const user = auth.currentUser;
        if (!user || !user.email) {
          showAlert("Error", "User is not properly authenticated.", "error", "OK");
          return;
        }
  
        try {
          const credential = EmailAuthProvider.credential(user.email, password);
          await reauthenticateWithCredential(user, credential);
        } catch (authError) {
          if (authError.code === 'auth/wrong-password') {
            throw new Error('Incorrect password. Please try again.');
          }
          throw new Error('Authentication failed. Please try again.');
        }
      }
  
      const confirmation = await showConfirmation(
        "Are you sure?",
        "This action will permanently delete the group and all its content. This cannot be undone.",
        "warning",
        "Yes, delete it",
        "Cancel"
      );
  
      if (!confirmation.isConfirmed) {
        return;
      }
  
      setShowDeleteModal(false);
      setPassword(""); // Clear password field for next time
  
      // Show loading state while deleting
      showAlert("Success!", "The group has been deleted.", "success", "OK");
    
      await GroupController.deleteGroup(groupId);
      
      // Navigate after successful deletion
      navigate("/groups", { state: { showDeletedAlert: true } });
      
    } catch (error) {
      console.error("Error deleting group:", error);
      showAlert(
        "Error", 
        error.message || "Failed to delete the group. Please try again.", 
        "error", 
        "OK"
      );
    }
  };   

  return (
    <Card className="mb-3">
      <Card.Body>
        <h4>Main Moderator</h4>
        <div 
          className="d-flex align-items-center mb-3"
          role="button"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/profile/${mainModeratorData?.id}`)}
        >
          {mainModeratorData?.profilePicture !== "none" ? (
            <img
              src={mainModeratorData?.profilePicture}
              alt="Profile"
              className="rounded-circle me-2"
              style={{ width: "50px", height: "50px" }}
            />
          ) : (
            <FontAwesomeIcon icon={faUserCircle} size="2x" className="me-2" />
          )}
          <p className="mb-0">{mainModeratorData?.name}</p>
        </div>


        <h4>Sub Moderators</h4>
        <ListGroup>
          {subModeratorsData.map((moderator) => (
            <ListGroup.Item key={moderator.id} className="d-flex align-items-center justify-content-between">
              <div 
                className="d-flex align-items-center"
                role="button"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/profile/${moderator.id}`)}
              >
                {moderator.profilePicture !== "none" ? (
                  <img
                    src={moderator.profilePicture}
                    alt="Profile"
                    className="rounded-circle me-2"
                    style={{ width: "50px", height: "50px" }}
                  />
                ) : (
                  <FontAwesomeIcon icon={faUserCircle} size="2x" className="me-2" />
                )}
                <p className="mb-0">{moderator.name}</p>
              </div>
              {canManageModerators && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveModerator(moderator.id)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </Button>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>

        {canManageModerators && (
          <Form className="mt-3">
            <Form.Group>
              <Form.Control
                type="text"
                placeholder="Enter user ID or email"
                value={newModeratorInput}
                onChange={(e) => setNewModeratorInput(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" className="w-100 mt-2 custom-btn" onClick={handleAddModerator}>
              Add Moderator
            </Button>
          </Form>
        )}

        {canDeleteGroup && (
          <>
            <Button
              variant="danger"
              className="w-100 mt-2"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Group
            </Button>

            {/* Delete Group Modal */}
              <Modal 
                  show={showDeleteModal} 
                  onHide={() => setShowDeleteModal(false)}
                  aria-labelledby="delete-group-modal-title"
              >              
                <Modal.Header closeButton>
                <Modal.Title id="delete-group-modal-title">Delete Group</Modal.Title>
                </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group>
                    <Form.Label>
                      {isAdmin ? 
                        "You're deleting as admin. No password required." : 
                        "Enter your password to confirm deletion"}
                    </Form.Label>
                    {!isAdmin && (
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                    )}
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteGroup}>
                  Confirm Delete
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ModeratorsCard;