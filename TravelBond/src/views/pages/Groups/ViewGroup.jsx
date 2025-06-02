import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import GroupController from "../../../controllers/GroupController";
import DiscussionController from "../../../controllers/DiscussionController";
import UserController from "../../../controllers/UserController";
import { COLORS } from "../../../utils/config";
import useSweetAlert from "../../../hooks/useSweetAlert";
import GroupMembersCard from "../../components/GroupCard/GroupMembersCard";
import ModeratorsCard from "../../components/GroupCard/ModeratorsCard";
import GroupInfoCard from "../../components/GroupCard/GroupInfoCard";
import NewDiscussionForm from "../../components/GroupCard/NewDiscussionForm";
import DiscussionsList from "../../components/GroupCard/DiscussionsList";
import { getAuth } from "firebase/auth";
import ReportModal from "../../components/Report/ReportModal";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";

const ViewGroup = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [participantsData, setParticipantsData] = useState([]);
  const [discussionsData, setDiscussionsData] = useState([]);
  const [mainModeratorData, setMainModeratorData] = useState(null);
  const [subModeratorsData, setSubModeratorsData] = useState([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [showNewDiscussionForm, setShowNewDiscussionForm] = useState(false);
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContent, setNewDiscussionContent] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const userId = localStorage.getItem("userId");
  const auth = getAuth();

  const { showAlert, showConfirmation } = useSweetAlert();
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReportData, setCurrentReportData] = useState({
    reportedId: [],
    contentType: ''
  });

  // Add this handler function
  const handleReport = (contentType, parentId, itemId = 'none') => {
    const reportedId = contentType === 'group' ? [parentId] : [parentId, itemId];
    
    setCurrentReportData({
      reportedId,
      contentType
    });
    setShowReportModal(true);
  };


  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "admin");
  }, []);

  const fetchParticipantsData = async (participants) => {
    const participantsData = await Promise.all(
      participants.map(async (participantId) => {
        const user = await UserController.fetchUserById(participantId);
        return user;
      })
    );
    setParticipantsData(participantsData);
  };

  const fetchDiscussionsData = async (discussions) => {
    try {
      const discussionsData = await Promise.all(
        discussions.map(async (discussion) => {
          if (!discussion.userId) {
            console.warn("Discussion has no userId:", discussion);
            return { ...discussion, user: null };
          }
          const user = await UserController.fetchUserById(discussion.userId);
          const createdAt = discussion.createdAt.toDate ? discussion.createdAt.toDate() : new Date(discussion.createdAt);
          return { ...discussion, user, createdAt };
        })
      );
      setDiscussionsData(discussionsData);
    } catch (error) {
      console.error("Error fetching discussions data:", error);
    }
  };

  const fetchModeratorsData = async (mainModeratorId, subModerators) => {
    const mainModerator = await UserController.fetchUserById(mainModeratorId);
    setMainModeratorData(mainModerator);

    const subModeratorsData = await Promise.all(
      subModerators.map(async (moderatorId) => {
        const user = await UserController.fetchUserById(moderatorId);
        return user;
      })
    );
    setSubModeratorsData(subModeratorsData);
  };

  useEffect(() => {
    const fetchGroupAndDiscussions = async () => {
      try {
        const groupData = await GroupController.fetchGroups();
        const currentGroup = groupData.find((g) => g.id === groupId);
        if (currentGroup) {
          setGroup(currentGroup);
          fetchParticipantsData(currentGroup.participants);
          fetchModeratorsData(currentGroup.main_moderator, currentGroup.sub_moderators);
          setIsParticipant(currentGroup.participants.includes(userId));
        } else {
          console.error("Group not found");
        }

        const discussionsData = await DiscussionController.fetchDiscussionsByGroupId(groupId);
        setDiscussions(discussionsData);
        fetchDiscussionsData(discussionsData);
      } catch (error) {
        console.error("Error fetching group and discussions:", error);
      }
    };

    fetchGroupAndDiscussions();
  }, [groupId, userId]);

  const handleDeleteDiscussion = async (discussionId) => {
    try {
      const discussion = discussionsData.find(d => d.id === discussionId);
      const isModerator = group.sub_moderators.includes(userId) || group.main_moderator === userId;
      const isDiscussionOwner = discussion?.userId === userId;
      
      if (!isModerator && !isDiscussionOwner && !isAdmin) {
        showAlert("Error", "You don't have permission to delete this discussion.", "error", "OK");
        return;
      }

      const confirmation = await showConfirmation(
        "Are you sure?",
        "This will permanently delete the discussion.",
        "warning",
        "Yes, delete it!",
        "Cancel"
      );

      if (confirmation.isConfirmed) {
        await DiscussionController.deleteDiscussion(discussionId, groupId);
        setDiscussionsData(prevDiscussions =>
          prevDiscussions.filter(discussion => discussion.id !== discussionId)
        );
        showAlert("Success!", "The discussion has been deleted.", "success", "OK");
      }
    } catch (error) {
      console.error("Error deleting discussion:", error);
      showAlert("Error", "Failed to delete the discussion.", "error", "OK");
    }
  };

  const handleJoinOrLeaveGroup = async () => {
    try {
      // Check if user is logged in
      if (!userId) {
        showAlert("Error", "You need to be logged in to join this group.", "error", "OK");
        return;
      }

      if (isParticipant) {
        await GroupController.leaveGroup(groupId, userId);
        setIsParticipant(false);
        showAlert("Success!", "You have left the group.", "success", "OK");
      } else {
        await GroupController.joinGroup(groupId, userId);
        setIsParticipant(true);
        showAlert("Success!", "You have joined the group.", "success", "OK");
      }

      const groupData = await GroupController.fetchGroups();
      const currentGroup = groupData.find((g) => g.id === groupId);
      if (currentGroup) {
        setGroup(currentGroup);
        fetchParticipantsData(currentGroup.participants);
      }
    } catch (error) {
      console.error("Error joining/leaving group:", error);
      showAlert("Error", "An error occurred. Please try again.", "error", "OK");
    }
  };

  const handleNewDiscussionSubmit = async () => {
    try {
      // Check if user is participant
      if (!isParticipant) {
        showAlert(
          "Not a Participant", 
          "You must be a participant of this group to post discussions.", 
          "error", 
          "OK"
        );
        return;
      }
  
      const confirmation = await showConfirmation(
        "Are you sure?",
        "Do you want to post this discussion?",
        "question",
        "Yes",
        "Cancel"
      );
  
      if (confirmation.isConfirmed) {
        await DiscussionController.createDiscussion(groupId, userId, newDiscussionTitle, newDiscussionContent);
        const discussionsData = await DiscussionController.fetchDiscussionsByGroupId(groupId);
        setDiscussions(discussionsData);
        fetchDiscussionsData(discussionsData);
        setNewDiscussionTitle("");
        setNewDiscussionContent("");
        setShowNewDiscussionForm(false);
        showAlert("Success!", "Your discussion has been posted.", "success", "OK");
      }
    } catch (error) {
      console.error("Error creating discussion:", error);
      showAlert("Error", "Failed to post discussion. Please try again.", "error", "OK");
    }
  };

  const refreshGroupData = async () => {
    try {
      const updatedGroup = await GroupController.fetchGroupById(groupId);
      setGroup(updatedGroup);
      fetchParticipantsData(updatedGroup.participants);
      fetchModeratorsData(updatedGroup.main_moderator, updatedGroup.sub_moderators);
    } catch (error) {
      console.error("Error refreshing group data:", error);
    }
  };

  if (!group) return <LoadingComponent/>;

  return (
    <Container fluid className="mt-3 mb-3">
      <Row>
        <Col md={3} className="mb-3">
          <ModeratorsCard
            mainModeratorData={mainModeratorData}
            subModeratorsData={subModeratorsData}
            groupId={groupId}
            refreshGroupData={refreshGroupData}
            currentUserId={userId}
            isAdmin={isAdmin}
          />

          <GroupMembersCard
            participantsData={participantsData}
            isParticipant={isParticipant}
            handleJoinOrLeaveGroup={handleJoinOrLeaveGroup}
            mainModeratorId={group.main_moderator}
            subModerators={group.sub_moderators || []}
            groupId={groupId}
          />
        </Col>

        <Col md={9}>
          <GroupInfoCard 
            group={group} 
            onReport={handleReport}
          />
          <Button
            onClick={() => setShowNewDiscussionForm(true)}
            className="custom-btn w-100 mb-3"
          >
            Create a Discussion
          </Button>
          {showNewDiscussionForm && (
            <NewDiscussionForm
              showNewDiscussionForm={showNewDiscussionForm}
              setShowNewDiscussionForm={setShowNewDiscussionForm}
              handleNewDiscussionSubmit={handleNewDiscussionSubmit}
              newDiscussionTitle={newDiscussionTitle}
              setNewDiscussionTitle={setNewDiscussionTitle}
              newDiscussionContent={newDiscussionContent}
              setNewDiscussionContent={setNewDiscussionContent}
              isParticipant={isParticipant} // Add this prop
            />
          )}
          <DiscussionsList
            discussionsData={discussionsData}
            groupId={groupId}
            onDeleteDiscussion={handleDeleteDiscussion}
            subModerators={group.sub_moderators || []}
            isAdmin={isAdmin}
            onReport={handleReport}
          />
          <ReportModal
            show={showReportModal}
            onHide={() => setShowReportModal(false)}
            reporterId={userId}
            reportedId={currentReportData.reportedId}
            contentType={currentReportData.contentType}
          />

        </Col>
      </Row>
    </Container>
  );
};

export default ViewGroup;