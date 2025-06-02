import React from "react";
import { Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import GroupController from "../../../controllers/GroupController";
import useSweetAlert from "../../../hooks/useSweetAlert";
import ParticipantsList from "../Common/ParticipantsList/ParticipantsList";

const GroupMembersCard = ({ 
  participantsData = [], 
  isParticipant, 
  handleJoinOrLeaveGroup, 
  mainModeratorId, 
  subModerators = [], 
  groupId,
  refreshGroupData
}) => {
  const navigate = useNavigate();
  const { showAlert, showConfirmation } = useSweetAlert();
  const currentUserId = localStorage.getItem("userId");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleRemoveParticipant = async (participantId) => {
    try {
      if (participantId === mainModeratorId) {
        return false;
      }

      await GroupController.leaveGroup(groupId, participantId);
      
      if (subModerators.includes(participantId)) {
        await GroupController.removeSubModerator(groupId, participantId);
      }
      
      if (typeof refreshGroupData === 'function') {
        await refreshGroupData();
      }
      return true;
    } catch (error) {
      console.error("Error removing participant:", error);
      return false;
    }
  };

  const handleJoinOrLeave = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Check if user is logged in
      if (!currentUserId) {
        showAlert("Error", "You need to be logged in to join this group.", "error", "OK");
        return;
      }

      if (isParticipant) {
        if (currentUserId === mainModeratorId) {
          showAlert("Error", "The organizer cannot leave the group...", "error", "Ok");
          return;
        }

        const confirmation = await showConfirmation(
          "Leave Group",
          subModerators.includes(currentUserId) 
            ? "You are a moderator..." 
            : "Are you sure...",
          "warning",
          "Yes, leave",
          "Cancel"
        );

        if (confirmation.isConfirmed) {
          await handleJoinOrLeaveGroup();
        }
      } else {
        await handleJoinOrLeaveGroup();
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("Error", `Failed to ${isParticipant ? 'leave' : 'join'}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <Card.Body>
        <ParticipantsList
          participants={participantsData}
          title="Group Members"
          currentUserId={currentUserId}
          organizerId={mainModeratorId}
          onParticipantClick={(participantId) => navigate(`/profile/${participantId}`)}
          onRemoveParticipant={handleRemoveParticipant}
          roles={{
            [mainModeratorId]: "Organizer",
            ...Object.fromEntries(subModerators.map(modId => [modId, "Moderator"]))
          }}
        />
        
        <Button
          className="w-100 mt-3"
          onClick={handleJoinOrLeave}
          style={{ 
            backgroundColor: !currentUserId ? "var(--identity-color)" : 
                          isParticipant ? "#dc3545" : "var(--identity-color)", 
            border: "none" 
          }}
          disabled={isProcessing}
        >
          {!currentUserId ? "Login to Join" : 
          isProcessing ? "Processing..." : 
          isParticipant ? "Leave Group" : "Join Group"}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default GroupMembersCard;