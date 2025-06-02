import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUserCircle, faCrown } from "@fortawesome/free-solid-svg-icons";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import "./ParticipantsList.css";

const ParticipantsList = ({ 
  participants = [], 
  title = "Participants",
  type = "group",
  maxDisplay = 5,
  showCount = true,
  showViewAll = true,
  currentUserId,
  organizerId,
  onParticipantClick,
  onRemoveParticipant,
  roles = {},
  moderators = [],
  canManageParticipants = false
}) => {
  const [showModal, setShowModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { showAlert, showConfirmation } = useSweetAlert();

  const getCurrentUserPermissions = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      return {
        isAdmin: userData?.role === 'admin',
        isOrganizer: currentUserId === organizerId,
        isModerator: moderators.includes(currentUserId)
      };
    } catch (e) {
      return {
        isAdmin: false,
        isOrganizer: false,
        isModerator: false
      };
    }
  };

  const { isAdmin, isOrganizer, isModerator } = getCurrentUserPermissions();

  const handleRemove = async (participantId, e) => {
    e.stopPropagation();
    if (typeof onRemoveParticipant !== 'function') return;
    
    const participant = participants.find(p => p.id === participantId);
    const participantName = participant?.name || participant?.email || 'this participant';
    
    const confirmation = await showConfirmation(
      "Confirm Removal",
      `Are you sure you want to remove ${participantName} from the ${type === 'group' ? 'group' : 'event'}?`,
      "warning",
      "Yes, remove",
      "Cancel"
    );

    if (!confirmation.isConfirmed) return;

    try {
      setIsDeleting(true);
      const success = await onRemoveParticipant(participantId);
      if (success) {
        showAlert("Success", `${participantName} has been removed successfully`, "success", "Ok");
      } else {
        // showAlert("Error", `Failed to remove ${participantName}`, "error");
      }
    } catch (error) {
      console.error("Error removing participant:", error);
      // showAlert("Error", `Failed to remove ${participantName}`, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const canRemoveParticipant = (participantId) => {
    if (participantId === organizerId) return false;
    if (participantId === currentUserId) return false;
    return canManageParticipants || isAdmin || isOrganizer || isModerator;
  };

  if (!participants || participants.length === 0) {
    return (
      <div className="participants-container">
        <h4>{title} {showCount && `(0)`}</h4>
        <p>No participants yet</p>
      </div>
    );
  }

  const renderParticipantItem = (participant) => (
    <div 
      key={participant.id} 
      className="participant-item"
      onClick={() => onParticipantClick && onParticipantClick(participant.id)}
    >
      {participant.profilePicture && participant.profilePicture !== "none" ? (
        <img
          src={participant.profilePicture}
          alt="Profile"
          className="participant-avatar"
        />
      ) : (
        <FontAwesomeIcon icon={faUserCircle} className="participant-avatar-icon" />
      )}
      
      <span className="participant-name">
        {participant.name || participant.email}
      </span>
      
      {participant.id === organizerId ? (
        <FontAwesomeIcon 
          icon={faCrown} 
          className="participant-role-crown"
          title={type === 'group' ? 'Organizer' : 'Host'}
        />
      ) : roles[participant.id] ? (
        <span className="participant-role">
          {roles[participant.id]}
        </span>
      ) : null}
      
      {canRemoveParticipant(participant.id) && (
        <Button
          variant="link"
          className="participant-remove-btn"
          onClick={(e) => handleRemove(participant.id, e)}
          disabled={isDeleting}
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      )}
    </div>
  );

  return (
    <div className="participants-container">
      <h4>{title} {showCount && `(${participants.length})`}</h4>
      
      <div className="avatar-list">
        {participants.slice(0, maxDisplay).map(participant => (
          <div 
            key={participant.id}
            className="avatar-item"
            onClick={() => onParticipantClick && onParticipantClick(participant.id)}
            title={`${participant.name || participant.email}${participant.id === organizerId ? ` (${type === 'group' ? 'Organizer' : 'Host'})` : ''}`}
          >
            {participant.profilePicture && participant.profilePicture !== "none" ? (
              <img
                src={participant.profilePicture}
                alt="Profile"
                className="participant-avatar"
              />
            ) : (
              <FontAwesomeIcon icon={faUserCircle} className="participant-avatar-icon" />
            )}
            {participant.id === organizerId && (
              <div className="avatar-crown-badge">
                <FontAwesomeIcon icon={faCrown} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {(showViewAll || participants.length > maxDisplay) && (
        <Button
          variant="primary"
          className="view-all-btn"
          onClick={() => setShowModal(true)}
        >
          View All Participants
        </Button>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>All {title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-participants">
          {participants.map(renderParticipantItem)}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ParticipantsList;