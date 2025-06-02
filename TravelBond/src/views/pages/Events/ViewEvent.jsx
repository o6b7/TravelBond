import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ReactStringReplace from "react-string-replace"; // at the top with imports
import {
  faUserCircle,
  faTrash,
  faClock,
  faMapMarkerAlt,
  faCalendar,
  faHeart,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";
import { faXTwitter, faWhatsapp, faFacebook } from "@fortawesome/free-brands-svg-icons";
import EventController from "../../../controllers/EventController";
import UserController from "../../../controllers/UserController";
import useSweetAlert from "../../../hooks/useSweetAlert";
import Helpers from "../../../utils/helpers";
import ReportModal from "../../components/Report/ReportModal";
import "./events.css";
import "../../../global.css";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";
import ParticipantsList from "../../components/Common/ParticipantsList/ParticipantsList";
import UserService from "../../../services/UserService";

const ViewEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [participantsData, setParticipantsData] = useState([]);
  const [organizerName, setOrganizerName] = useState("Organizer");
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userId = localStorage.getItem("userId");
  const [isParticipant, setIsParticipant] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReportData, setCurrentReportData] = useState({
    reportedId: [],
    contentType: ''
  });
  const handleViewUserProfile = (userId) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const renderReplyText = (text, usersMap) => {
    if (!text) return null;
  
    return ReactStringReplace(text, /@([A-Za-z]+\s[A-Za-z]+)/g, (match, i) => {
      const user = usersMap[match.trim()];
      if (!user || !user.id) return `@${match}`;  // Return plain text if user not found
  
      return (
        <span
          key={`mention-${i}`}
          className="mention-link"
          style={{ color: 'var(--identity-color)', cursor: 'pointer' }}
          onClick={() => handleMentionClick(user.id)}
        >
          @{user.name}
        </span>
      );
    });
  };
  
  const handleMentionClick = async (name) => {
    console.log(name)
    try {
      if (!name) {
        console.error("Invalid user name for mention");
        return;
      }
      
      // Fetch user by name to get their ID
      const user = await UserController.fetchUserById(name);
      if (user && user.id) {
        navigate(`/profile/${user.id}`);
      } else {
        console.error("User not found");
        showAlert("Error", "User not found", "error", "OK");
      }
    } catch (error) {
      console.error("Error navigating to profile:", error);
      showAlert("Error", "Failed to find user", "error", "OK");
    }
  };

  const { showAlert, showConfirmation } = useSweetAlert();

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleReport = (contentType, parentId, itemId = 'none') => {
    const reportedId = contentType === 'event' ? [parentId] : [parentId, itemId];
    
    setCurrentReportData({
      reportedId,
      contentType
    });
    setShowReportModal(true);
  };
  

  const fetchEventAndComments = async () => {
    setIsLoading(true);
    try {
      const eventData = await EventController.fetchEventById(eventId);
      setEvent(eventData);

      if (eventData.organizerId) {
        try {
          const organizer = await UserController.fetchUserById(eventData.organizerId);
          setOrganizerName(organizer.name || organizer.email || "Organizer");
        } catch (error) {
          console.error("Error fetching organizer:", error);
        }
      }

      const commentsWithUserData = await Promise.all(
        (eventData.comments || []).map(async (comment) => {
          let user = { name: "Unknown User", email: "unknown@example.com" };
          
          if (comment.userId) {
            try {
              user = await UserController.fetchUserById(comment.userId);
            } catch (error) {
              console.error("Error fetching comment user:", error);
            }
          }

          const repliesWithUserData = {};
          if (comment.replies) {
            await Promise.all(
              Object.entries(comment.replies).map(async ([replyId, reply]) => {
                let replyUser = { name: "Unknown User", email: "unknown@example.com" };
                
                if (reply.userId) {
                  try {
                    replyUser = await UserController.fetchUserById(reply.userId);
                  } catch (error) {
                    console.error("Error fetching reply user:", error);
                  }
                }
                
                repliesWithUserData[replyId] = { 
                  ...reply, 
                  user: replyUser,
                  likes: Array.isArray(reply.likes) ? reply.likes : []
                };
              })
            );
          }

          return {
            ...comment,
            user,
            replies: repliesWithUserData,
            likes: Array.isArray(comment.likes) ? comment.likes : []
          };
        })
      );

      setComments(commentsWithUserData);

      const participantsWithData = [];
      if (eventData.participants) {
        await Promise.all(
          eventData.participants.map(async (participantId) => {
            if (participantId) {
              try {
                const user = await UserController.fetchUserById(participantId);
                participantsWithData.push(user);
              } catch (error) {
                console.error("Error fetching participant:", error);
                participantsWithData.push({
                  id: participantId,
                  name: "Unknown User",
                  email: "unknown@example.com",
                  profilePicture: "none"
                });
              }
            }
          })
        );
      }
      setParticipantsData(participantsWithData);

      setIsParticipant(eventData.participants?.includes(userId) || false);
    } catch (error) {
      console.error("Error fetching event and comments:", error);
      showAlert("Error", "Failed to load event data. Please try again.", "error", "OK");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventAndComments();
  }, [eventId, userId]);
  
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const result = await UserService.isAdmin(userId);
        setIsAdmin(result);
      } catch (error) {
        console.error("Failed to check admin status:", error);
      }
    };
    if (userId) checkAdmin();
  }, [userId]);


  const handleJoinOrLeaveEvent = async () => {
    try {
      // Check if user is logged in
      if (!userId) {
        showAlert("Error", "You need to be logged in to join this event.", "error", "OK");
        return;
      }

      if (event.organizerId === userId && isParticipant) {
        showAlert("Error", "Organizers cannot leave their own event.", "error", "OK");
        return;
      }

      const action = isParticipant ? "leave" : "join";
      const confirmation = await showConfirmation(
        "Are you sure?",
        `Do you want to ${action} this event?`,
        "question",
        "Yes",
        "Cancel"
      );

      if (confirmation.isConfirmed) {
        if (isParticipant) {
          await EventController.leaveEvent(eventId, userId);
          setIsParticipant(false);
          showAlert("Success!", "You have left the event.", "success", "OK");
        } else {
          await EventController.joinEvent(eventId, userId);
          setIsParticipant(true);
          showAlert("Success!", "You have joined the event.", "success", "OK");
        }
        await fetchEventAndComments();
      }
    } catch (error) {
      console.error("Error joining/leaving event:", error);
      showAlert("Error", "An error occurred. Please try again.", "error", "OK");
    }
  };

  const handleDeleteEvent = async () => {
    try {
      const confirmation = await showConfirmation(
        "Are you sure?",
        "This will permanently delete the event and all its data.",
        "warning",
        "Yes, delete it!",
        "Cancel"
      );
  
      if (confirmation.isConfirmed) {
        await EventController.deleteEvent(eventId);
        showAlert("Deleted!", "The event has been deleted.", "success", "OK");
        navigate('/events');
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      showAlert("Error", "Failed to delete event.", "error", "OK");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      showAlert("Error", "Comment cannot be empty.", "error", "OK");
      return;
    }
  
    if (!isParticipant) {
      showAlert("Error", "You need to be a participant to comment.", "error", "OK");
      return;
    }
  
    try {
      const comment = await EventController.addComment(eventId, userId, newComment);
      const user = await UserController.fetchUserById(userId);
  
      setComments(prev => [{ 
        ...comment, 
        user,
        replies: {},
        likes: []
      }, ...prev]); // ✅ Add new comment at the beginning!
  
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      showAlert("Error", "Failed to add comment.", "error", "OK");
    }
  };  

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) {
      showAlert("Error", "Reply cannot be empty.", "error", "OK");
      return;
    }
  
    try {
      await EventController.addReply(eventId, commentId, userId, replyText);
      await fetchEventAndComments();
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
      showAlert("Error", "Failed to add reply.", "error", "OK");
    }
  };

  const handleLike = async (commentId, replyId = null) => {
    try {
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.commentId === commentId) {
            if (replyId) {
              const updatedReplies = { ...comment.replies };
              if (updatedReplies[replyId]) {
                const isLiked = updatedReplies[replyId].likes?.includes(userId) || false;
                updatedReplies[replyId] = {
                  ...updatedReplies[replyId],
                  likes: isLiked
                    ? updatedReplies[replyId].likes.filter(id => id !== userId)
                    : [...(updatedReplies[replyId].likes || []), userId]
                };
              }
              return { ...comment, replies: updatedReplies };
            }
            
            const isLiked = comment.likes?.includes(userId) || false;
            return {
              ...comment,
              likes: isLiked
                ? comment.likes.filter(id => id !== userId)
                : [...(comment.likes || []), userId]
            };
          }
          return comment;
        });
      });
  
      await EventController.toggleLike(eventId, commentId, userId, replyId);
    } catch (error) {
      console.error("Error toggling like:", error);
      showAlert("Error", "Failed to like comment/reply.", "error", "OK");
      
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.commentId === commentId) {
            if (replyId) {
              const updatedReplies = { ...comment.replies };
              if (updatedReplies[replyId]) {
                const isLiked = updatedReplies[replyId].likes?.includes(userId) || false;
                updatedReplies[replyId] = {
                  ...updatedReplies[replyId],
                  likes: isLiked
                    ? updatedReplies[replyId].likes.filter(id => id !== userId)
                    : [...(updatedReplies[replyId].likes || []), userId]
                };
              }
              return { ...comment, replies: updatedReplies };
            }
            
            const isLiked = comment.likes?.includes(userId) || false;
            return {
              ...comment,
              likes: isLiked
                ? comment.likes.filter(id => id !== userId)
                : [...(comment.likes || []), userId]
            };
          }
          return comment;
        });
      });
    }
  };

const handleDeleteComment = async (commentId, commentUserId, replyId = null) => {
  const isEventOrganizer = event.organizerId === userId;
  const isCommentOwner = commentUserId === userId;

  if (!isEventOrganizer && !isCommentOwner && !isAdmin) {
    showAlert("Error", "You don't have permission to delete this.", "error", "OK");
    return;
  }

  const confirmation = await showConfirmation(
    "Are you sure?",
    "Do you want to delete this?",
    "warning",
    "Yes, delete it!",
    "Cancel"
  );

  if (!confirmation.isConfirmed) return;

  try {
    await EventController.deleteComment(eventId, commentId, replyId);

    // Update state instead of re-fetching
    setComments(prevComments => {
      if (replyId) {
        return prevComments.map(comment => {
          if (comment.commentId === commentId) {
            const updatedReplies = Object.keys(comment.replies || {}).reduce((acc, key) => {
              if (comment.replies[key].replyId !== replyId) {
                acc[key] = comment.replies[key];
              }
              return acc;
            }, {});
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        });
      } else {
        return prevComments.filter(comment => comment.commentId !== commentId);
      }
    });

    showAlert("Deleted!", "The content has been removed.", "success", "OK");
  } catch (error) {
    console.error("Error deleting content:", error);
    showAlert("Error", "Failed to delete content.", "error", "OK");
  }
};


  if (isLoading) {
    return <LoadingComponent/>;
  }

  return (
    <Container className="mt-3 mb-3 d-flex justify-content-center">
      <Row className="w-100">
        <Col md={3} className="mb-3">
          <Card>
            <Card.Body>
              <ParticipantsList
                participants={participantsData}
                title="Event Participants"
                currentUserId={userId}
                organizerId={event?.organizerId}
                roles={{
                  [event?.organizerId]: "Organizer"
                }}
                onParticipantClick={handleViewUserProfile}
                onRemoveParticipant={async (participantId) => {
                  try {
                    const confirmation = await showConfirmation(
                      "Remove Participant",
                      "Are you sure you want to remove this participant?",
                      "warning",
                      "Yes",
                      "No"
                    );
                    
                    if (confirmation.isConfirmed) {
                      await EventController.leaveEvent(eventId, participantId);
                      await fetchEventAndComments();
                      showAlert("Success", "Participant removed successfully", "success", "Ok");
                    }
                  } catch (error) {
                    // showAlert("Error", "Failed to remove participant", "error");
                  }
                }}
              />
              {event.organizerId === userId && (
                <Button 
                  variant="danger" 
                  onClick={handleDeleteEvent}
                  className="mt-2 w-100"
                >
                  Delete Event
                </Button>
              )}
              
                <Button
                  className="w-100 mt-2"
                  onClick={handleJoinOrLeaveEvent}
                  style={{ 
                    backgroundColor: isParticipant ? "red" : "var(--identity-color)", 
                    border: "none"
                  }}
                >
                  {!userId ? "Login to Join" : isParticipant ? "Leave Event" : "Join Event"}
                </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <Card className="mb-3">
            <Card.Body>
              <img
                src={event.picture || "/default-event.png"}
                alt="Event"
                className="event-picture"
              />
              <div className="event-header">
                <h2 className="event-title">{event.title}</h2>
                <p className="event-organizer">Organized by {organizerName}</p>
              </div>
              <div className="share-buttons mb-3">
                <Button 
                variant="link" 
                onClick={() => handleReport('event', eventId)}
                style={{ color: "var(--danger-color)" }}
                >
                    <FontAwesomeIcon icon={faFlag} /> Report Event
                </Button>
              </div>
              <div className="event-details mt-3">
                <p>
                  <FontAwesomeIcon icon={faClock} className="me-2" style={{ color: "var(--identity-color)" }} />
                  {event.duration}, starting from {event.time}
                </p>
                <p>
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" style={{ color: "var(--identity-color)" }} />
                  {event.location}
                </p>
                <p>
                  <FontAwesomeIcon icon={faCalendar} className="me-2" style={{ color: "var(--identity-color)" }} />
                  {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <p className="event-description">{event.description}</p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h5 className="section-title">Comments ({comments.length})</h5>
              {isParticipant ? (
                <Form onSubmit={handleCommentSubmit} className="mb-4">
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="form-control"
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    className="join-button"
                    style={{ backgroundColor: "var(--identity-color)" }}
                  >
                    Post Comment
                  </Button>
                </Form>
              ) : (
                <div className="error-message">
                  You need to be a participant to comment.
                </div>
              )}
              {comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((comment) => (
                <div key={comment.commentId} className="d-flex align-items-start mb-3">
                  <div className="me-3" role="button" onClick={() => handleViewUserProfile(comment.user?.id)}>
                    {comment.user?.profilePicture !== "none" ? (
                      <img
                        src={comment.user?.profilePicture}
                        alt="Profile"
                        className="rounded-circle profile-img profile-picture"
                        style={{width: "52px", height: "52px"}}
                      />
                    ) : (
                      <FontAwesomeIcon icon={faUserCircle} size="3x" />
                    )}
                  </div>
                  <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2" role="button" onClick={() => handleViewUserProfile(comment.user?.id)}>
                    <h6 className="mb-0">{comment.user?.name || comment.userId}</h6>
                    <p className="text-muted mb-0">{Helpers.formatDate(comment.createdAt)}</p>
                  </div>

                    <p>
                      {renderReplyText(comment.comment, {
                        [comment.user?.name]: { id: comment.user?.id, name: comment.user?.name }
                      })}
                    </p>



                    <div className="d-flex gap-2 align-items-center">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleLike(comment.commentId)}
                        style={{ color: comment.likes?.includes(userId) ? "red" : "gray" }}
                        className={`like-btn ${comment.likes?.includes(userId) ? 'liked' : ''}`}
                      >
                        <FontAwesomeIcon icon={faHeart} /> {comment.likes?.length || 0}
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(comment.commentId);
                          setReplyText(`@${comment.user?.name || comment.userId} `);
                        }}
                        style={{ textDecoration: "none", color: "gray" }}
                      >
                        Reply
                      </Button>
                      <div className="ms-auto">
                        {comment.userId !== userId && !isAdmin && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleReport('comment', eventId, comment.commentId)}
                            style={{ textDecoration: "none", color: "var(--danger-color)" }}
                          >
                            <FontAwesomeIcon icon={faFlag} />
                          </Button>
                        )}

                        {(comment.userId === userId || isAdmin) && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.commentId, comment.userId)}
                            style={{ textDecoration: "none", color: "gray" }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        )}
                      </div>

                    </div>
                    {Object.keys(comment.replies || {}).length > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleReplies(comment.commentId)}
                        style={{ textDecoration: "none", color: "gray" }}
                      >
                        {expandedReplies[comment.commentId] ? "Hide Replies" : `View ${Object.keys(comment.replies || {}).length} Replies`}
                      </Button>
                    )}
                    {expandedReplies[comment.commentId] && Object.keys(comment.replies || {}).length > 0 && (
                      <div className="ms-4 mt-2">
                        {Object.entries(comment.replies || {}).sort(([, a], [, b]) => new Date(b.createdAt) - new Date(a.createdAt)).map(([replyId, reply]) => (
                          <div key={replyId} className="d-flex align-items-start mb-3">
                            <div className="me-3" role="button" onClick={() => handleViewUserProfile(reply.user?.id)}>
                              {reply.user?.profilePicture !== "none" ? (
                                <img
                                  src={reply.user?.profilePicture}
                                  alt="Profile"
                                  className="rounded-circle profile-img profile-picture"
                                  style={{width: "52px", height: "52px"}}
                                />
                              ) : (
                                <FontAwesomeIcon icon={faUserCircle} size="3x" />
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2" role="button" onClick={() => handleViewUserProfile(reply.user?.id)}>
                                <h6 className="mb-0">{reply.user?.name || reply.userId}</h6>
                                <p className="text-muted mb-0">{Helpers.formatDate(reply.createdAt)}</p>
                              </div>

                              <p>
                                {renderReplyText(reply.reply, {
                                  [reply.user?.name]: { id: reply.user?.id, name: reply.user?.name },
                                  [comment.user?.name]: { id: comment.user?.id, name: comment.user?.name }
                                })}
                              </p>



                              <div className="d-flex gap-2 align-items-center">
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => handleLike(comment.commentId, replyId)}
                                  style={{ color: reply.likes?.includes(userId) ? "red" : "gray" }}
                                  className={`like-btn ${comment.likes?.includes(userId) ? 'liked' : ''}`}
                                >
                                  <FontAwesomeIcon icon={faHeart} /> {reply.likes?.length || 0}
                                </Button>
                                <div className="ms-auto">
                                  {reply.userId !== userId && !isAdmin && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => handleReport('reply', eventId, replyId)}
                                      style={{ textDecoration: "none", color: "var(--danger-color)" }}
                                    >
                                      <FontAwesomeIcon icon={faFlag} />
                                    </Button>
                                  )}
                                  {(reply.userId === userId || isAdmin) && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => handleDeleteComment(comment.commentId, comment.userId, replyId)}
                                      style={{ textDecoration: "none", color: "gray" }}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {replyingTo === comment.commentId && (
                      <Form onSubmit={(e) => handleReplySubmit(e, comment.commentId)} className="mt-2">
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          style={{ color: "gray" }}
                        />
                        <Button type="submit" className="mt-2" style={{backgroundColor: "var(--identity-color)", border: "none"}}>
                          Post Reply
                        </Button>
                      </Form>
                    )}
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showParticipantsModal} onHide={() => setShowParticipantsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>All Participants</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {participantsData.map((participant, index) => (
            <div 
              key={index} 
              className="d-flex align-items-center gap-2 mt-2"
              role="button"
              style={{ cursor: "pointer" }}
              onClick={() => handleViewUserProfile(participant.id)}
            >
              {participant.profilePicture !== "none" ? (
                <img
                  src={participant.profilePicture}
                  alt="Profile"
                  className="rounded-circle profile-img profile-picture"
                  style={{ width: "52px", height: "52px" }}
                />
              ) : (
                <FontAwesomeIcon icon={faUserCircle} size="3x" />
              )}
              <span>{participant.name || participant.email}</span>
            </div>


          ))}
        </Modal.Body>
      </Modal>

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

export default ViewEvent;