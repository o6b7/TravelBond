import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faTrash, 
  faChevronDown, 
  faChevronUp, 
  faHeart,
  faFlag,
  faUserCircle,
  faTimes,
  faChevronLeft,
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";
import { Button, Image, Form, Modal, Row, Col } from "react-bootstrap";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import "./postCard.css";
import Helpers from "../../../../utils/helpers";
import UserController from "../../../../controllers/UserController";
import IdGenerator from "../../../../utils/IdGenerator"; 
import ReportModal from "../../Report/ReportModal";
import ReactStringReplace from "react-string-replace";

const PostCard = ({ 
  post = {}, 
  onEdit, 
  onDelete, 
  onDeleteComment,
  onAddComment,
  onAddReply,
  onToggleLike,
  isProfilePage = false, 
  readOnly,
  currentUserId,
  currentUserRole,
  location
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || "");
  const [showComments, setShowComments] = useState(false);
  const [visibleComments, setVisibleComments] = useState(5);
  const [visiblePhotos, setVisiblePhotos] = useState(3);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyingToUser, setReplyingToUser] = useState(null);
  const [postOwner, setPostOwner] = useState(null);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentReportData, setCurrentReportData] = useState({
    reportedId: [],
    contentType: ''
  });
  const [highlightedComment, setHighlightedComment] = useState(null);
  const [highlightedReply, setHighlightedReply] = useState(null);

  const { showConfirmation, showAlert } = useSweetAlert();

  // Initialize likedBy array if it doesn't exist
  const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
  const [optimisticLikedBy, setOptimisticLikedBy] = useState(likedBy);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);

  const navigate = useNavigate();

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

  const handleViewUserProfile = (userId) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  useEffect(() => {
    setOptimisticLikedBy(likedBy);
  }, [post.likedBy]);

  useEffect(() => {
    // Check for highlighted comment or reply in navigation state
    if (location?.state?.showComments) {
      setShowComments(true);
    }
    if (location?.state?.highlightComment) {
      setHighlightedComment(location.state.highlightComment);
      setShowComments(true);
    }
    if (location?.state?.highlightReply) {
      setHighlightedReply(location.state.highlightReply);
      setShowComments(true);
      // Find which comment contains this reply and expand it
      const commentWithReply = comments.find(comment => 
        comment.replies && comment.replies[location.state.highlightReply]
      );
      if (commentWithReply) {
        setExpandedReplies(prev => ({
          ...prev,
          [commentWithReply.commentId]: true
        }));
      }
    }
  }, [location?.state, comments]);
  
  // Add scroll to highlighted element
  useEffect(() => {
    if (highlightedComment && showComments) {
      const element = document.getElementById(`comment-${highlightedComment}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    if (highlightedReply && showComments) {
      const element = document.getElementById(`reply-${highlightedReply}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedComment, highlightedReply, showComments]);
  
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

  useEffect(() => {
    // Fetch post owner details
    const fetchPostOwner = async () => {
      try {
        const owner = await UserController.fetchUserById(post.userId);
        setPostOwner(owner);
      } catch (error) {
        console.error("Error fetching post owner:", error);
      }
    };

    // Fetch comments with user data
    const fetchCommentsWithUsers = async () => {
      try {
        const commentsWithUsers = await Promise.all(
          (post.comments || []).map(async (comment) => {
            let user = { name: "Unknown User", profilePicture: "none" };
            if (comment.userId) {
              try {
                user = await UserController.fetchUserById(comment.userId);
              } catch (error) {
                console.error("Error fetching comment user:", error);
              }
            }

            // Fetch replies with user data
            const repliesWithUsers = {};
            if (comment.replies) {
              await Promise.all(
                Object.entries(comment.replies).map(async ([replyId, reply]) => {
                  let replyUser = { name: "Unknown User", profilePicture: "none" };
                  if (reply.userId) {
                    try {
                      replyUser = await UserController.fetchUserById(reply.userId);
                    } catch (error) {
                      console.error("Error fetching reply user:", error);
                    }
                  }
                  repliesWithUsers[replyId] = {
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
              replies: repliesWithUsers,
              likes: Array.isArray(comment.likes) ? comment.likes : []
            };
          })
        );
        setComments(commentsWithUsers);
      } catch (error) {
        console.error("Error fetching comments with users:", error);
      }
    };
    if (!hasLoadedComments && post.comments) {
      fetchCommentsWithUsers();
      setHasLoadedComments(true);  // Mark that comments were already loaded
    }
    
  }, [post.comments]);

  // Handle keyboard navigation for photo modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showFullscreenModal) {
        if (e.key === 'ArrowLeft') {
          navigatePhotos(-1);
        } else if (e.key === 'ArrowRight') {
          navigatePhotos(1);
        } else if (e.key === 'Escape') {
          setShowFullscreenModal(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenModal, selectedPhotoIndex, post.photos?.length]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(post.postId, editedContent);
      setIsEditing(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    setVisibleComments(5);
  };

  const loadMoreComments = () => {
    setVisibleComments((prev) => prev + 5);
  };

  const loadMorePhotos = () => {
    setVisiblePhotos((prev) => prev + 3);
  };

  const showLessPhotos = () => {
    setVisiblePhotos(3);
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const openFullscreenModal = (index) => {
    setSelectedPhotoIndex(index);
    setShowFullscreenModal(true);
  };

  const navigatePhotos = (direction) => {
    const totalPhotos = post.photos?.length || 0;
    if (totalPhotos === 0) return;
    
    let newIndex = selectedPhotoIndex + direction;
    
    if (newIndex < 0) newIndex = totalPhotos - 1;
    if (newIndex >= totalPhotos) newIndex = 0;
    
    setSelectedPhotoIndex(newIndex);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      showAlert("Error", "Comment cannot be empty", "error", "OK");
      return;
    }

    try {
      const comment = await onAddComment(post.postId, newComment);
      const user = await UserController.fetchUserById(currentUserId);
      
      setComments(prev => [...prev, { 
        ...comment, 
        user,
        replies: {},
        likes: [] 
      }]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      showAlert("Error", "Failed to add comment", "error", "OK");
    }
  };

  const handleSubmitReply = async (e, commentId) => {
    e.preventDefault(); // Prevent page refresh
    if (!replyText.trim()) {
      showAlert("Error", "Reply cannot be empty", "error", "OK");
      return;
    }
  
    try {
      // Generate reply immediately
      const replyId = await IdGenerator.generateId("reply");
      const user = await UserController.fetchUserById(currentUserId);

      const newReply = {
        replyId,
        userId: currentUserId,
        reply: replyText,
        createdAt: new Date().toISOString(),
        likes: [],
        user,
      };

      // Optimistically update UI immediately
      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.commentId === commentId) {
            return {
              ...comment,
              replies: {
                ...comment.replies,
                [replyId]: newReply,
              },
            };
          }
          return comment;
        })
      );

      // Clear reply input immediately
      setReplyText("");
      setReplyingTo(null);
      setReplyingToUser(null);

      // Call backend AFTER optimistic update
      await onAddReply(post.postId, commentId, replyText);
    } catch (error) {
      console.error("Error adding reply:", error);
      showAlert("Error", "Failed to add reply", "error", "OK");
    }
  };

  const handlePostLike = async () => {
    try {
      // Optimistic update
      const wasLiked = optimisticLikedBy.includes(currentUserId);
      setOptimisticLikedBy(prev => 
        wasLiked 
          ? prev.filter(id => id !== currentUserId)
          : [...prev, currentUserId]
      );
      
      // Call the API
      await onToggleLike(post.postId);
      
    } catch (error) {
      // Revert on error
      setOptimisticLikedBy(likedBy);
      console.error("Error toggling post like:", error);
      showAlert("Error", "Failed to toggle like", "error", "OK");
    }
  };

  const handleLike = async (commentId, replyId = null) => {
    try {
      // Optimistic UI update
      setComments(prev => prev.map(comment => {
        if (comment.commentId === commentId) {
          if (replyId) {
            const updatedReplies = { ...comment.replies };
            if (updatedReplies[replyId]) {
              const isLiked = updatedReplies[replyId].likes?.includes(currentUserId) || false;
              updatedReplies[replyId] = {
                ...updatedReplies[replyId],
                likes: isLiked
                  ? updatedReplies[replyId].likes.filter(id => id !== currentUserId)
                  : [...(updatedReplies[replyId].likes || []), currentUserId]
              };
            }
            return { ...comment, replies: updatedReplies };
          }
          
          const isLiked = comment.likes?.includes(currentUserId) || false;
          return {
            ...comment,
            likes: isLiked
              ? comment.likes.filter(id => id !== currentUserId)
              : [...(comment.likes || []), currentUserId]
          };
        }
        return comment;
      }));

      await onToggleLike(post.postId, commentId, replyId);
    } catch (error) {
      console.error("Error toggling like:", error);
      showAlert("Error", "Failed to toggle like", "error", "OK");
    }
  };

  const handleDeleteComment = async (commentId, commentUserId, replyId = null) => {
    const isPostOwner = post.userId === currentUserId;
    const isCommentOwner = commentUserId === currentUserId;
    const isAdmin = currentUserRole === "admin";
  
    if (!isPostOwner && !isCommentOwner && !isAdmin) {
      showAlert("Error", "You don't have permission to delete this", "error", "OK");
      return;
    }
  
    const result = await showConfirmation(
      "Are you sure?",
      "Do you want to delete this?",
      "warning",
      "Yes, delete it!",
      "Cancel"
    );
  
    if (result.isConfirmed) {
      try {
        await onDeleteComment(post.postId, commentId, replyId);
        // Update state to remove the comment/reply
        if (replyId) {
          setComments(prev => prev.map(comment => {
            if (comment.commentId === commentId) {
              const updatedReplies = { ...comment.replies };
              delete updatedReplies[replyId];
              return { ...comment, replies: updatedReplies };
            }
            return comment;
          }));
        } else {
          setComments(prev => prev.filter(comment => comment.commentId !== commentId));
        }
        showAlert("Deleted!", "The content has been removed", "success", "OK");
      } catch (error) {
        console.error("Error deleting content:", error);
        showAlert("Error", "Failed to delete content", "error", "OK");
      }
    }
  };

  const handleDeletePost = async () => {
    try {
      const result = await showConfirmation(
        "Are you sure?",
        "This post will be permanently deleted.",
        "warning",
        "Yes, delete it!",
        "Cancel"
      );
  
      if (result.isConfirmed) {
        if (onDelete) {
          await onDelete(post.postId); 
        }
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showAlert("Error", "Failed to delete post", "error", "OK");
    }
  };
  
  

  if (!post.postId) return null;

  return (
    <div className="post-card">
      <div className="post-header">
        <div 
          className="d-flex align-items-center gap-2" 
          role="button" 
          onClick={() => handleViewUserProfile(post.userData.id)}
        >
          {post.userData?.profilePicture && post.userData.profilePicture !== "none" ? (
            <img
              src={post.userData.profilePicture}
              alt="Profile"
              className="rounded-circle profile-img profile-picture"
              style={{ width: "52px", height: "52px", cursor: "pointer" }}
            />
          ) : (
            <FontAwesomeIcon icon={faUserCircle} size="3x" style={{ cursor: "pointer" }} />
          )}
          <h4 style={{ cursor: "pointer" }}>
            {post.userData?.name || post.userId}
          </h4>
        </div>

        <div className="post-actions">
          {/* Show Report button only if NOT post owner and NOT admin */}
          {!readOnly && post.userData?.id !== currentUserId && currentUserRole !== "admin" && (
            <Button 
              variant="link" 
              onClick={() => handleReport('post', [post.postId])}
              style={{ textDecoration: "none", color: "gray" }}
            >
              <FontAwesomeIcon icon={faFlag} />
            </Button>
          )}

          {/* Show Edit/Delete if post owner or admin */}
          {!readOnly && (post.userData?.id === currentUserId || currentUserRole === "admin") && (
            <>
              {post.userData?.id === currentUserId && (
                <Button variant="link" onClick={() => setIsEditing(!isEditing)}>
                  <FontAwesomeIcon icon={faEdit} />
                </Button>
              )}
              <Button variant="link" onClick={() => handleDeletePost(post.postId)}>
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </>
          )}

        </div>
      </div>

      <div className="post-content-wrapper">
        {!readOnly && isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="form-control mb-3"
          />
        ) : (
          <p className="post-content">{post.content}</p>
        )}
        <p className="post-date">{Helpers.formatDate(post.postedAt)}</p>
        
        {/* Post Like Button */}
        <div className="d-flex gap-2 align-items-center mb-3">
          <Button
            variant="link"
            size="sm"
            onClick={handlePostLike}
            style={{ color: optimisticLikedBy.includes(currentUserId) ? "red" : "gray" }}
            className={`like-btn ${optimisticLikedBy.includes(currentUserId) ? 'liked' : ''}`}
          >
            <FontAwesomeIcon icon={faHeart} /> {optimisticLikedBy.length || 0}
          </Button>
        </div>
      </div>

      {!readOnly && isEditing && (
        <Button variant="primary" onClick={handleEdit}>
          Save
        </Button>
      )}

      {/* Display Photos */}
      {post.photos && post.photos.length > 0 && (
        <div className="post-media mt-3">
          <Row className="g-3">
            {post.photos.slice(0, visiblePhotos).map((photo, index) => (
              photo !== "-" && (
                <Col key={index} xs={12} sm={6} md={4}>
                  <div className="post-photo-container">
                    <Image 
                      src={photo} 
                      alt={`Post ${index + 1}`} 
                      fluid 
                      className="post-photo-thumbnail"
                      onClick={() => openFullscreenModal(index)}
                    />
                  </div>
                </Col>
              )
            ))}
          </Row>
          {post.photos.length > 3 && (
            <div className="text-center mt-2">
              {visiblePhotos < post.photos.length ? (
                <Button variant="link" onClick={loadMorePhotos} className="load-more">
                  Show More
                </Button>
              ) : (
                <Button variant="link" onClick={showLessPhotos} className="load-more">
                  Show Less
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      <Modal 
        show={showFullscreenModal} 
        onHide={() => setShowFullscreenModal(false)}
        fullscreen
        centered
        backdrop="static"
        className="fullscreen-photo-modal"
      >
        <Modal.Header className="border-0">
          <Button 
            variant="light" 
            onClick={() => setShowFullscreenModal(false)}
            className="close-btn"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </Button>
        </Modal.Header>
        <Modal.Body className="d-flex justify-content-center align-items-center p-0 position-relative">
          <div className="fullscreen-photo-container">
            <Image 
              src={post.photos?.[selectedPhotoIndex]} 
              alt={`Fullscreen view (${selectedPhotoIndex + 1} of ${post.photos?.length})`}
              fluid
              className="fullscreen-photo"
            />
          </div>
          
          {post.photos?.length > 1 && (
            <>
              <Button 
                variant="light" 
                className="nav-btn prev-btn"
                onClick={() => navigatePhotos(-1)}
                aria-label="Previous photo"
              >
                <FontAwesomeIcon icon={faChevronLeft} size="lg" />
              </Button>
              <Button 
                variant="light" 
                className="nav-btn next-btn"
                onClick={() => navigatePhotos(1)}
                aria-label="Next photo"
              >
                <FontAwesomeIcon icon={faChevronRight} size="lg" />
              </Button>
              <div className="photo-counter">
                {selectedPhotoIndex + 1} / {post.photos?.length}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Comments Section */}
      <div className="comments-toggle mt-3" onClick={toggleComments}>
        <span>{comments.length} Comments</span>
        <FontAwesomeIcon icon={showComments ? faChevronUp : faChevronDown} />
      </div>

      {showComments && (
        <div className="post-comments mt-3">
          {/* Add Comment Form */}
          <Form onSubmit={handleSubmitComment} className="mb-4">
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
              />
            </Form.Group>
            <Button type="submit" className="custom-btn">
              Post Comment
            </Button>
          </Form>

          {/* Comments List */}
          {comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, visibleComments).map((comment) => (
            <div 
              key={comment.commentId} 
              id={`comment-${comment.commentId}`}
              className={`d-flex align-items-start mb-3 ${highlightedComment === comment.commentId ? 'highlighted-comment' : ''}`}
            >
              <div className="me-3" role="button" onClick={() => handleViewUserProfile(comment.user?.id)}>
                {comment.user?.profilePicture && comment.user.profilePicture !== "none" ? (
                  <img
                    src={comment.user.profilePicture}
                    alt="Profile"
                    className="rounded-circle profile-img profile-picture"
                    style={{width: "52px", height: "52px", cursor: "pointer"}}
                  />
                ) : (
                  <FontAwesomeIcon icon={faUserCircle} size="3x" style={{cursor: "pointer"}} />
                )}
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2" role="button" onClick={() => handleViewUserProfile(comment.user?.id)}>
                  <h6 className="mb-0">{comment.user?.name || comment.userId}</h6>
                  <p className="text-muted mb-0">{Helpers.formatDate(comment.createdAt)}</p>
                </div>
                <p>{comment.comment}</p>
                <div className="d-flex gap-2 align-items-center">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleLike(comment.commentId)}
                    style={{ color: comment.likes?.includes(currentUserId) ? "red" : "gray" }}
                  >
                    <FontAwesomeIcon icon={faHeart} /> {comment.likes?.length || 0}
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setReplyingToUser({
                        id: comment.user?.id,
                        name: comment.user?.name || comment.userId
                      });
                      setReplyText(`@${comment.user?.name || comment.userId} `);
                      setReplyingTo(comment.commentId);
                    }}
                    style={{ textDecoration: "none", color: "gray" }}
                  >
                    Reply
                  </Button>

                  <div className="ms-auto">
                    {comment.userId !== currentUserId && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReport('comment', [post.postId, comment.commentId, 'none']);
                        }}
                        style={{ textDecoration: "none", color: "gray" }}
                      >
                        <FontAwesomeIcon icon={faFlag} />
                      </Button>
                    )}
                    {(comment.userId === currentUserId || post.userId === currentUserId || currentUserRole === "admin") && (
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

                {/* Replies Section */}
                {comment.replies && Object.keys(comment.replies).length > 0 && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => toggleReplies(comment.commentId)}
                    style={{ textDecoration: "none", color: "gray" }}
                  >
                    {expandedReplies[comment.commentId] ? "Hide Replies" : `View ${Object.keys(comment.replies).length} Replies`}
                  </Button>
                )}

                {expandedReplies[comment.commentId] && comment.replies && Object.keys(comment.replies).length > 0 && (
                  <div className="ms-4 mt-2">
                    {Object.entries(comment.replies).map(([replyId, reply]) => {
                      // Correctly build usersMap here for each reply
                      const usersMap = {
                        [reply.user?.name]: {
                          id: reply.user?.id,
                          name: reply.user?.name,
                        },
                        [postOwner?.name]: {
                          id: postOwner?.id,
                          name: postOwner?.name,
                        },
                        [comment.user?.name]: {
                          id: comment.user?.id,
                          name: comment.user?.name,
                        },
                      };

                      return (
                        <div 
                          key={replyId} 
                          id={`reply-${replyId}`}
                          className={`d-flex align-items-start mb-3 ${highlightedReply === replyId ? 'highlighted-reply' : ''}`}
                        >
                          <div className="me-3" role="button" onClick={() => handleViewUserProfile(reply.user?.id)}>
                            {reply.user?.profilePicture && reply.user.profilePicture !== "none" ? (
                              <img
                                src={reply.user.profilePicture}
                                alt="Profile"
                                className="rounded-circle profile-img profile-picture"
                                style={{width: "42px", height: "42px", cursor: "pointer"}}
                              />
                            ) : (
                              <FontAwesomeIcon icon={faUserCircle} size="2x" style={{cursor: "pointer"}} />
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2" role="button" onClick={() => handleViewUserProfile(reply.user?.id)}>
                              <h6 className="mb-0">{reply.user?.name || reply.userId}</h6>
                              <p className="text-muted mb-0">{Helpers.formatDate(reply.createdAt)}</p>
                            </div>

                            <p>{renderReplyText(reply.reply, usersMap)}</p>

                            <div className="d-flex gap-2 align-items-center">
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleLike(comment.commentId, replyId)}
                                style={{ color: reply.likes?.includes(currentUserId) ? "red" : "gray" }}
                              >
                                <FontAwesomeIcon icon={faHeart} /> {reply.likes?.length || 0}
                              </Button>
                              <div className="ms-auto">
                                {reply.userId !== currentUserId && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReport('reply', [post.postId, comment.commentId, replyId]);
                                    }}
                                    style={{ textDecoration: "none", color: "gray" }}
                                  >
                                    <FontAwesomeIcon icon={faFlag} />
                                  </Button>
                                )}
                                {(reply.userId === currentUserId || post.userId === currentUserId || currentUserRole === "admin") && (
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
                      );
                    })}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === comment.commentId && (
                  <Form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmitReply(e, comment.commentId); }} className="mt-2">
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                    />
                    <Button type="submit" variant="primary" className="mt-2 custom-btn">
                      Post Reply
                    </Button>
                  </Form>
                )}
              </div>
            </div>
          ))}

          {visibleComments < comments.length && (
            <Button variant="link" onClick={loadMoreComments} className="load-more">
              Show More
            </Button>
          )}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        reporterId={currentUserId}
        reportedId={currentReportData.reportedId}
        contentType={currentReportData.contentType}
      />
    </div>
  );
};

export default PostCard;