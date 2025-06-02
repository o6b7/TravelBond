import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle, faTrash, faFlag } from "@fortawesome/free-solid-svg-icons";
import DiscussionController from "../../../controllers/DiscussionController";
import UserController from "../../../controllers/UserController";
import GroupController from "../../../controllers/GroupController";
import useSweetAlert from "../../../hooks/useSweetAlert";
import GroupMembersCard from "../../components/GroupCard/GroupMembersCard";
import Helpers from "../../../utils/helpers";
import ReportModal from "../../components/Report/ReportModal";
import "./groups.css";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";

const ViewDiscussion = () => {
  const { groupId, discussionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [participantsData, setParticipantsData] = useState([]);
  const [newReply, setNewReply] = useState("");
  const userId = localStorage.getItem("userId");
  const [isParticipant, setIsParticipant] = useState(false);
  const [moderators, setModerators] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReportData, setCurrentReportData] = useState({
    reportedId: [],
    contentType: ''
  });
  const [highlightedReply, setHighlightedReply] = useState(null);

  const { showAlert, showConfirmation } = useSweetAlert();

  const handleViewUserProfile = (userId) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };
  

  useEffect(() => {
    // Check for highlighted reply in navigation state
    if (location.state?.highlightReply) {
      setHighlightedReply(location.state.highlightReply);
    }
  }, [location.state]);

  useEffect(() => {
    if (highlightedReply) {
      const timer = setTimeout(() => {
        setHighlightedReply(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedReply]);

  const handleReport = (contentType, reportedId) => {
    setCurrentReportData({
      reportedId: reportedId,
      contentType: contentType
    });
    setShowReportModal(true);
  };

  const fetchDiscussionAndReplies = async () => {
    try {
      const discussionData = await DiscussionController.fetchDiscussionById(discussionId);
      setDiscussion(discussionData);
  
      const repliesData = await Promise.all(
        discussionData.replies.map(async (reply) => {
          const user = await UserController.fetchUserById(reply.userId);
          return { ...reply, user };
        })
      );
      
      // Sort by createdAt in descending order (newest first)
      const sortedReplies = [...repliesData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReplies(sortedReplies);
      
      const groupData = await GroupController.fetchGroupById(groupId);
      if (groupData) {
        setModerators([groupData.main_moderator, ...groupData.sub_moderators]);
        const participantsWithData = await Promise.all(
          groupData.participants.map(async (participantId) => {
            return await UserController.fetchUserById(participantId);
          })
        );
        setParticipantsData(participantsWithData);
        setIsParticipant(groupData.participants.includes(userId));
      }
    } catch (error) {
      console.error("Error fetching discussion and replies:", error);
      showAlert("Error", "Failed to load discussion.", "error", "OK");
    }
  };

  useEffect(() => {
    fetchDiscussionAndReplies();
  }, [discussionId, userId, groupId]);

  const handleDeleteReply = async (replyId, replyUserId) => {
    const isModerator = moderators.includes(userId);
    const isReplyOwner = replyUserId === userId;
  
    if (!isModerator && !isReplyOwner) {
      showAlert("Error", "You do not have permission to delete this reply.", "error", "OK");
      return;
    }
  
    const confirmation = await showConfirmation(
      "Are you sure?",
      "Do you want to delete this reply?",
      "warning",
      "Yes, delete it!",
      "Cancel"
    );
  
    if (confirmation.isConfirmed) {
      try {
        const updatedReplies = await DiscussionController.deleteReply(discussionId, replyId);
        const updatedRepliesWithUserData = await Promise.all(
          updatedReplies.map(async (reply) => {
            const user = await UserController.fetchUserById(reply.userId);
            return { ...reply, user };
          })
        );
        // Sort after deletion
        const sortedReplies = updatedRepliesWithUserData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReplies(sortedReplies);
        showAlert("Deleted!", "The reply has been removed.", "success", "OK");
      } catch (error) {
        console.error("Error deleting reply:", error);
        showAlert("Error", "Failed to delete reply.", "error", "OK");
      }
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) {
      showAlert("Error", "Reply cannot be empty.", "error", "OK");
      return;
    }
  
    if (!isParticipant) {
      showAlert("Error", "You need to be a participant to reply.", "error", "OK");
      return;
    }
  
    try {
      const reply = await DiscussionController.addReply(discussionId, userId, newReply);
      const user = await UserController.fetchUserById(userId);
      
      // Add new reply and sort again to maintain consistent order
      setReplies(prev => {
        const updatedReplies = [{ ...reply, user }, ...prev];
        return updatedReplies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      
      setNewReply("");
      showAlert("Success!", "Your reply has been posted.", "success", "OK");
    } catch (error) {
      console.error("Error adding reply:", error);
      showAlert("Error", "Failed to add reply.", "error", "OK");
    }
  };
  

  const handleJoinOrLeaveGroup = async () => {
    try {
      const action = isParticipant ? "leave" : "join";
      const confirmation = await showConfirmation(
        "Are you sure?",
        `Do you want to ${action} this group?`,
        "question",
        "Yes",
        "Cancel"
      );

      if (confirmation.isConfirmed) {
        if (isParticipant) {
          await GroupController.leaveGroup(groupId, userId);
          setIsParticipant(false);
          showAlert("Success!", "You have left the group.", "success", "OK");
        } else {
          await GroupController.joinGroup(groupId, userId);
          setIsParticipant(true);
          showAlert("Success!", "You have joined the group.", "success", "OK");
        }
        await fetchDiscussionAndReplies();
      }
    } catch (error) {
      console.error("Error joining/leaving group:", error);
      showAlert("Error", "An error occurred. Please try again.", "error", "OK");
    }
  };

  if (!discussion) {
    return <LoadingComponent/>;
  }

  return (
    <Container fluid className="mt-3 mb-3">
      <Row>
        <Col md={3} className="mb-3">
          <GroupMembersCard
            participantsData={participantsData}
            isParticipant={isParticipant}
            handleJoinOrLeaveGroup={handleJoinOrLeaveGroup}
          />
        </Col>

        <Col md={9}>
          <Card className="section-box">
            <Card.Body>
              {/* Discussion Header */}
              <div className="d-flex align-items-start mb-4">
                <div 
                  className="me-3"
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/profile/${discussion.user?.id}`)}
                >
                  {discussion.user?.profilePicture !== "none" ? (
                    <img
                      src={discussion.user?.profilePicture}
                      alt="Profile"
                      className="rounded-circle profile-img"
                      style={{ width: "60px", height: "60px" }}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUserCircle} size="3x" />
                  )}
                </div>
                <div 
                  className="flex-grow-1"
                  role="button"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/profile/${discussion.user?.id}`)}
                >
                  <h3 className="mb-2">{discussion.title}</h3>
                  <p className="text-muted mb-1">
                    Posted by {discussion.user?.name || "Unknown user"} • {Helpers.formatDate(discussion.createdAt)}
                  </p>
                </div>
                <p className="discussion-content mt-2">{discussion.content}</p>

                {discussion.userId !== userId && !moderators.includes(userId) && (
                  <Button
                    variant="link"
                    onClick={() => handleReport('discussion', [groupId, discussionId, 'none'])}
                    className="p-0 ms-2"
                    title="Report this discussion"
                  >
                    <FontAwesomeIcon 
                      icon={faFlag} 
                      style={{ color: "var(--danger-color)", fontSize: "1.2rem" }}
                    />
                  </Button>
                )}
              </div>

              {/* Reply Form */}
              {isParticipant ? (
                <Form onSubmit={handleReplySubmit} className="mb-4">
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      placeholder="Write your reply..."
                      className="form-control mb-2"
                    />
                  </Form.Group>
                  <Button 
                    type="submit" 
                    className="join-button"
                    style={{ backgroundColor: "var(--identity-color)" }}
                  >
                    Post Reply
                  </Button>
                </Form>
              ) : (
                <div className="alert alert-warning mb-4">
                  You need to join the group to participate in this discussion.
                </div>
              )}

              {/* Replies List */}
              <div className="replies-section">
                <h5 className="section-title mb-3">
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </h5>
                
                {replies.length === 0 ? (
                  <p className="text-muted">No replies yet. Be the first to reply!</p>
                ) : (
                  <div className="replies-list">
                    {replies.map((reply) => (
                      <div 
                        key={reply.id} 
                        id={`reply-${reply.id}`}
                        className={`reply-item mb-3 p-3 ${highlightedReply === reply.id ? 'highlighted-reply' : ''}`}
                      >
                        <div className="d-flex">
                          <div 
                            className="me-3"
                            role="button"
                            style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/profile/${reply.user?.id}`)}
                          >
                            {reply.user?.profilePicture !== "none" ? (
                              <img
                                src={reply.user?.profilePicture}
                                alt="Profile"
                                className="rounded-circle profile-img"
                                style={{ width: "53px", height: "53px" }}
                              />
                            ) : (
                              <FontAwesomeIcon icon={faUserCircle} size="3x" />
                            )}
                          </div>


                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                <strong 
                                  className="me-2"
                                  role="button"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => navigate(`/profile/${reply.user?.id}`)}
                                >
                                  {reply.user?.name || "Unknown user"}
                                </strong>
                                <small className="text-muted">
                                  {Helpers.formatDate(reply.createdAt)}
                                </small>
                              </div>
                              <div>
                                {(moderators.includes(userId) || reply.userId === userId) ? (
                                  <Button
                                    variant="link"
                                    onClick={() => handleDeleteReply(reply.id, reply.userId)}
                                    className="p-0 ms-2"
                                    title="Delete reply"
                                  >
                                    <FontAwesomeIcon 
                                      icon={faTrash} 
                                      style={{ color: "var(--danger-color)" }}
                                    />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="link"
                                    onClick={() => handleReport('reply', [groupId, discussionId, reply.id])}
                                    className="p-0 ms-2"
                                    title="Report reply"
                                  >
                                    <FontAwesomeIcon 
                                      icon={faFlag} 
                                      style={{ color: "var(--danger-color)" }}
                                    />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="mb-0 reply-content">{reply.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Report Modal */}
      <ReportModal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        reporterId={userId}
        reportedId={currentReportData.reportedId}
        contentType={currentReportData.contentType}
      />
    </Container>
  );
};

export default ViewDiscussion;