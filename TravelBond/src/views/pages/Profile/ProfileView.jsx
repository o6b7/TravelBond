import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Spinner, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faUserFriends,
  faUserPlus,
  faUserMinus,
  faHome,
  faComment,
  faNewspaper,
  faUser,
  faUserCircle,
  faEnvelope,
  faUserShield,
  faTrashAlt,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import UserController from "../../../controllers/UserController";
import ReferencesCard from "../../components/ProfileComponents/ReferencesCard/ReferencesCard";
import OverviewCard from "../../components/ProfileComponents/OverviewCard/OverviewCard";
import AboutMe from "../../components/ProfileComponents/AboutMe/AboutMe";
import MyHomeCards from "../../components/ProfileComponents/MyHomeCards/MyHomeCards";
import PostCard from "../../components/ProfileComponents/PostCard/PostCard";
import PostService from "../../../services/PostService";
import useSweetAlert from "../../../hooks/useSweetAlert";
import UserCard from "../../components/UserCard/UserCard";
import ChatService from "../../../services/ChatService";
import AddReferenceCard from "../../components/ProfileComponents/ReferencesCard/AddReferenceCard";
import "./profile.css";
import "../../../global.css";
import axios from "axios";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";
import PostController from "../../../controllers/PostController";
import ChatbotController from "../../../controllers/ChatbotController";


export default function ProfileView() {
  const [userData, setUserData] = useState(null);
  const currentUserRole = JSON.parse(localStorage.getItem("userData"))?.role || "user";
  const [friendsData, setFriendsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('profileActiveTab') || "overview";
  });
  const [filter, setFilter] = useState("all");
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAddReference, setShowAddReference] = useState(false);
  const { userId: paramUserId } = useParams();
  const { showAlert, showConfirmation } = useSweetAlert();
  const [compatibilityScore, setCompatibilityScore] = useState(null);
  const [compatibilityExplanation, setCompatibilityExplanation] = useState("");
  const navigate = useNavigate();
  const currentUserId = JSON.parse(localStorage.getItem("userData"))?.id || "";
  const isViewingOwnProfile = !paramUserId || paramUserId === currentUserId;
  const [highlightedPost, setHighlightedPost] = useState(null);
  const [showPosts, setShowPosts] = useState(false);
  const [incomingHighlightPost, setIncomingHighlightPost] = useState(null);
  const [incomingShowPosts, setIncomingShowPosts] = useState(false);
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('profileActiveTab', tab);
  };

  useEffect(() => {
    if (location?.state?.highlightPost || location?.state?.showPosts) {
      setIncomingHighlightPost(location.state.highlightPost || null);
      setIncomingShowPosts(location.state.showPosts || false);
    }
  }, [location?.state]);
  

  useEffect(() => {
    if (highlightedPost && showPosts && posts.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`post-${highlightedPost}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlighted-post-temp');
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            element.classList.remove('highlighted-post-temp');
          }, 3000);
        }
      }, 500); // delay to ensure posts are rendered
      
      return () => clearTimeout(timer);
    }
  }, [highlightedPost, showPosts, posts]);
  
  

  useEffect(() => {
    if (userData && !isViewingOwnProfile) {
      const currentUserData = JSON.parse(localStorage.getItem("userData"));
      ChatbotController.calculateCompatibilityScore(userData, currentUserData).then(result => {
        setCompatibilityScore(result.score);
        setCompatibilityExplanation(result.explanation);
      });
    }
  }, [userData, isViewingOwnProfile]);
  
  const fetchFriends = async () => {
    if (!userData?.friends || userData.friends.length === 0) {
      setFriendsData([]);
      setFriendsLoading(false);
      return;
    }
    
    setFriendsLoading(true);
    try {
      const allUsers = await UserController.fetchUsers();
      const friends = allUsers
        .filter(user => userData.friends.includes(user.id))
        .map(user => ({
          id: user.id,
          name: user.name,
          profilePicture: user.profilePicture,
          address: user.address,
          verified: user.verified,
          references: user.references || [],
          friends: user.friends || [],
          lastActive: user.lastActive,
          languages: user.languages || [],
          hostAvailability: user.hostAvailability || "MAYBE ACCEPTING GUESTS"
        }));
      
      setFriendsData(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setFriendsData([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check URL for highlightPost parameter
        const urlParams = new URLSearchParams(window.location.search);
        const highlightPostId = urlParams.get('highlightPost');
        
        // Fetch viewed user's data
        const user = await UserController.fetchUserById(paramUserId);
        setUserData(user);
    
        const currentUserData = JSON.parse(localStorage.getItem("userData"));
        if (currentUserData && user.friends?.includes(currentUserData.id)) {
          setIsFollowing(true);
        }
  
        // Fetch posts
        const fetchedPosts = await PostService.fetchPosts(paramUserId);
        setPosts(fetchedPosts);
  
        // If highlightPost parameter exists, show posts tab and highlight
        if (highlightPostId) {
          handleTabChange("posts");
          setHighlightedPost(highlightPostId);
          
          // Scroll to post after a short delay
          setTimeout(() => {
            const element = document.getElementById(`post-${highlightPostId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('highlighted-post-temp');
              
              // Remove highlight after 3 seconds
              setTimeout(() => {
                element.classList.remove('highlighted-post-temp');
              }, 3000);
            }
          }, 500);
        }
  
      } catch (error) {
        setError("Error fetching user data. Please try again later.");
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [paramUserId]);  

  useEffect(() => {
    if (activeTab === "friends") {
      fetchFriends();
    }
  }, [activeTab, userData?.friends]);

  const handleAddReference = async (newReference) => {
    try {
      // Update local state
      setUserData(prev => ({
        ...prev,
        references: [...(prev.references || []), newReference]
      }));
    } catch (error) {
      console.error("Error updating references:", error);
    }
  };

  const handleDeleteReference = async (referenceId) => {
    try {
      const currentUserData = JSON.parse(localStorage.getItem("userData"));
      if (!currentUserData) {
        showAlert("Error", "You need to be logged in to delete references", "error", "OK");
        return;
      }
      
      const referenceToDelete = userData.references.find(ref => ref.id === referenceId);
      if (!referenceToDelete) {
        showAlert("Error", "Reference not found.", "error", "OK");
        return;
      }

      const isAdmin = currentUserData.role === "admin";
      const isReferenceOwner = referenceToDelete.userId === currentUserData.id;
      
      if (!isAdmin && !isReferenceOwner) {
        showAlert("Error", "You don't have permission to delete this reference.", "error", "OK");
        return;
      }

      const result = await showConfirmation(
        "Confirm Deletion",
        "Are you sure you want to delete this reference?",
        "warning",
        "Yes, delete it",
        "Cancel"
      );

      if (result.isConfirmed) {
        await UserController.removeReference(userData.id, referenceToDelete);

        setUserData(prev => ({
          ...prev,
          references: prev.references.filter(ref => ref.id !== referenceId)
        }));

        showAlert("Success", "Reference deleted successfully!", "success", "OK");
      }
    } catch (error) {
      console.error("Error deleting reference:", error);
      showAlert("Error", "Failed to delete reference. Please try again.", "error", "OK");
    }
  };
  

  const handleFollow = async () => {
    const currentUserData = JSON.parse(localStorage.getItem("userData"));
    if (!currentUserData) {
      showAlert("Error", "You need to be logged in to follow users", "error", "OK");
      return;
    }
  
    const result = await showConfirmation(
      "Confirm Follow",
      `Are you sure you want to follow ${userData.name}?`,
      "question",
      "Yes, follow",
      "Cancel"
    );
  
    if (result.isConfirmed) {
      try {
        setIsFollowing(true);
        
        const updatedFriends = [...(userData.friends || []), currentUserData.id];
        setUserData(prev => ({ ...prev, friends: updatedFriends }));
        
        if (activeTab === "friends") {
          const currentUser = await UserController.fetchUserById(currentUserData.id);
          setFriendsData(prev => [
            ...prev,
            {
              id: currentUser.id,
              name: currentUser.name,
              profilePicture: currentUser.profilePicture,
              address: currentUser.address,
              verified: currentUser.verified,
              references: currentUser.references || [],
              friends: currentUser.friends || [],
              lastActive: currentUser.lastActive,
              languages: currentUser.languages || [],
              hostAvailability: currentUser.hostAvailability || "MAYBE ACCEPTING GUESTS"
            }
          ]);
        }
  
        await UserController.updateUser(userData.id, {
          friends: updatedFriends
        });
        await UserController.updateUser(currentUserData.id, {
          friends: [...(currentUserData.friends || []), userData.id]
        });
  
        const updatedCurrentUser = {
          ...currentUserData,
          friends: [...(currentUserData.friends || []), userData.id]
        };
        localStorage.setItem("userData", JSON.stringify(updatedCurrentUser));
  
        showAlert("Success", `You are now following ${userData.name}`, "success", "OK");
      } catch (error) {
        setIsFollowing(false);
        setUserData(prev => ({
          ...prev,
          friends: (prev.friends || []).filter(id => id !== currentUserData.id)
        }));
        
        if (activeTab === "friends") {
          setFriendsData(prev => prev.filter(friend => friend.id !== currentUserData.id));
        }
        
        console.error("Error following user:", error);
        showAlert("Error", "Failed to follow user. Please try again.", "error", "OK");
      }
    }
  };
  
  const handleUnfollow = async () => {
    const currentUserData = JSON.parse(localStorage.getItem("userData"));
    if (!currentUserData) return;
  
    const result = await showConfirmation(
      "Confirm Unfollow",
      `Are you sure you want to unfollow ${userData.name}?`,
      "question",
      "Yes, unfollow",
      "Cancel"
    );
  
    if (result.isConfirmed) {
      try {
        setIsFollowing(false);
        
        const updatedFriends = (userData.friends || []).filter(id => id !== currentUserData.id);
        setUserData(prev => ({ ...prev, friends: updatedFriends }));
        
        if (activeTab === "friends") {
          setFriendsData(prev => prev.filter(friend => friend.id !== currentUserData.id));
        }
  
        await UserController.updateUser(userData.id, {
          friends: updatedFriends
        });
        await UserController.updateUser(currentUserData.id, {
          friends: (currentUserData.friends || []).filter(id => id !== userData.id)
        });
  
        const updatedCurrentUser = {
          ...currentUserData,
          friends: (currentUserData.friends || []).filter(id => id !== userData.id)
        };
        localStorage.setItem("userData", JSON.stringify(updatedCurrentUser));
  
        showAlert("Success", `You have unfollowed ${userData.name}`, "success", "OK");
      } catch (error) {
        setIsFollowing(true);
        setUserData(prev => ({
          ...prev,
          friends: [...(prev.friends || []), currentUserData.id]
        }));
        
        if (activeTab === "friends") {
          const currentUser = await UserController.fetchUserById(currentUserData.id);
          setFriendsData(prev => [
            ...prev,
            {
              id: currentUser.id,
              name: currentUser.name,
              profilePicture: currentUser.profilePicture,
              address: currentUser.address,
              verified: currentUser.verified,
              references: currentUser.references || [],
              friends: currentUser.friends || [],
              lastActive: currentUser.lastActive,
              languages: currentUser.languages || [],
              hostAvailability: currentUser.hostAvailability || "MAYBE ACCEPTING GUESTS"
            }
          ]);
        }
        
        console.error("Error unfollowing user:", error);
        showAlert("Error", "Failed to unfollow user. Please try again.", "error", "OK");
      }
    }
  };


  const handleToggleLike = async (postId) => {
    try {
      const currentUserData = JSON.parse(localStorage.getItem("userData"));
      if (!currentUserData) {
        showAlert("Error", "You need to be logged in to like posts", "error", "OK");
        return;
      }
    
      // Optimistic update - update UI immediately
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.postId === postId) {
            const wasLiked = post.likedBy?.includes(currentUserData.id) || false;
            return {
              ...post,
              likedBy: wasLiked
                ? post.likedBy.filter(id => id !== currentUserData.id)
                : [...(post.likedBy || []), currentUserData.id]
            };
          }
          return post;
        })
      );
    
      // Then make the actual API call
      await PostService.toggleLike(postId, currentUserData.id);
      
      return true;
    } catch (error) {
      console.error("Error toggling like:", error);
      showAlert("Error", "Failed to toggle like", "error", "OK");
      
      // Revert the optimistic update if there was an error
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.postId === postId) {
            return {
              ...post,
              likedBy: post.likedBy || [] // Reset to original state
            };
          }
          return post;
        })
      );
      
      throw error;
    }
  };

  const handleViewProfile = (userId) => {
    window.location.href = `/profile/${userId}`;
  };

  const handleToggleAdmin = async (makeAdmin) => {
    const currentUserData = JSON.parse(localStorage.getItem("userData"));
    if (!currentUserData || currentUserData.role !== "admin") {
      showAlert("Error", "Only admins can perform this action", "error", "OK");
      return;
    }
  
    const action = makeAdmin ? "make admin" : "remove admin";
    const successMessage = makeAdmin 
      ? `${userData.name} is now an admin` 
      : `${userData.name} is no longer an admin`;
  
    const result = await showConfirmation(
      "Confirm Action",
      `Are you sure you want to ${action} ${userData.name}?`,
      "question",
      `Yes, ${action}`,
      "Cancel"
    );
  
    if (result.isConfirmed) {
      try {
        // First check if user exists
        const userExists = await UserController.fetchUserById(userData.id);
        if (!userExists) {
          throw new Error("User does not exist in the database");
        }
  
        // Update the role in Firestore
        await UserController.updateUser(userData.id, {
          role: makeAdmin ? "admin" : "user"
        });
  
        // Update local state to reflect the change
        setUserData(prev => ({
          ...prev,
          role: makeAdmin ? "admin" : "user"
        }));
  
        showAlert("Success", successMessage, "success", "OK");
      } catch (error) {
        console.error("Error updating admin status:", error);
        showAlert(
          "Error", 
          error.message || "Failed to update admin status", 
          "error", 
          "OK"
        );
      }
    }
  };

  const filteredReferences = userData?.references
    ? userData.references.filter((ref) => {
        const type = ref.type || ref.split(",")[1]; // Handle both old and new formats
        return filter === "all" || type === filter;
      })
    : [];

  const sortedPosts = posts.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  if (error) {
    return (
      <Container className="text-center mt-5">
        <p className="text-danger">{error}</p>
      </Container>
    );
  }

  const handleDeleteUser = async () => {
    const currentUserData = JSON.parse(localStorage.getItem("userData"));
    if (!currentUserData || currentUserData.role !== "admin") {
      showAlert("Error", "Only admins can perform this action", "error", "OK");
      return;
    }
  
    const result = await showConfirmation(
      "Confirm Deletion",
      `This will permanently delete ${userData.name}'s account data. Continue?`,
      "warning",
      "Delete",
      "Cancel"
    );
  
    if (result.isConfirmed) {
      try {
        await UserController.deleteUser(userData.id);
        
        showAlert(
          "Success", 
          `${userData.name}'s account data has been deleted`,
          "success",
          "OK"
        );
        
        // Replace the current history entry with the target URL
        window.history.replaceState(null, "", "/filtered-data");
        // Navigate to the URL without creating a new history entry
        window.location.replace("/filtered-data");
      } catch (error) {
        console.error("Delete error:", error);
        
        let message = "Failed to delete user data";
        let type = "error";
        
        if (error.message.includes("Firestore user document not found")) {
          message = "User document not found in Firestore";
        }
        
        showAlert(
          "Error",
          message,
          type,
          "OK"
        );
      }
    }
  };

  const handleStartChat = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("userData"));
      if (!currentUser?.id || !userData?.id) {
        showAlert("Error", "Unable to start chat", "error");
        return;
      }
      
      setLoading(true);
      const conversation = await ChatService.getOrCreateConversation(
        currentUser.id,
        userData.id
      );
      
      // Navigate to chat with both users' info
      navigate(`/chat/${conversation.id}`, {
        state: {
          otherUser: {
            id: userData.id,
            name: userData.name,
            profilePicture: userData.profilePicture,
          },
          currentUser: {
            id: currentUser.id,
            name: currentUser.name,
            profilePicture: currentUser.profilePicture,
          }
        },
      });
    } catch (error) {
      console.error("Chat Error:", error);
      showAlert("Error", "Failed to start chat. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingComponent/>;
  }

  const handleAddComment = async (postId, commentText) => {
    try {
      const currentUserData = JSON.parse(localStorage.getItem("userData"));
      if (!currentUserData) {
        showAlert("Error", "You need to be logged in to comment", "error", "OK");
        return;
      }
  
      // Call the PostService to add the comment
      const comment = await PostController.addComment(postId, currentUserData.id, commentText);
      
      // Update the local state to reflect the new comment
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.postId === postId) {
            return {
              ...post,
              comments: [...(post.comments || []), comment]
            };
          }
          return post;
        })
      );
      
      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      showAlert("Error", "Failed to add comment", "error", "OK");
      throw error;
    }
  };

  const handleDeleteComment = async (postId, commentId, replyId = null) => {
    try {
      await PostController.deleteComment(postId, commentId, replyId);
      // Then update UI by removing the comment/reply from local state
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  }; 
  
  const handleDeletePost = async (postId) => {
      try {
        await PostService.deletePost(postId); // Call API to delete
  
        // ✨ Optimistically update posts without refreshing
        setPosts(prevPosts => prevPosts.filter(post => post.postId !== postId));
  
        showAlert("Deleted!", "The post has been deleted.", "success", "OK");
      } catch (error) {
        console.error("Error deleting post:", error);
        showAlert("Error", "Failed to delete post", "error", "OK");
      }
    
  };  

  return (
    <Container className="profile-view-container mt-4">
      <Row>
        {/* Left Sidebar */}
        <Col md={3} className="profile-sidebar-col">
          <Card className="profile-card profile-sidebar-card text-center p-3 shadow-sm">
            <div className="profile-user-info text-center mb-4">
            <div className="profile-avatar-container position-relative">
                {userData.profilePicture && userData.profilePicture !== "none" ? (
                <img
                    src={userData.profilePicture}
                    alt="User Profile"
                    className="profile-avatar-img img-fluid rounded-circle"
                />
                ) : (
                <FontAwesomeIcon icon={faUserCircle} className="profile-avatar-icon text-muted" size="6x" />
                )}
            </div>
            {!isViewingOwnProfile && (
                <button 
                className="btn profile-message-btn custom-message-btn"
                onClick={handleStartChat}
                >
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                <span className="message-btn-text">Send Message</span>
                </button>
            )}
            </div>

            <h4 className="profile-username">{userData.name || "Unknown User"}</h4>
            {/* Add this line to display the user ID */}
            <small className="text-muted d-block">ID: {userData.id}</small>
            <p className="profile-location text-muted">
            <FontAwesomeIcon icon={faMapMarkerAlt} /> {userData.address || "Location Unknown"}
            </p>

            {/* Follow/Unfollow Button */}
            <div className="profile-follow-section mt-3">
              {!isViewingOwnProfile && (
                <div className="profile-follow-section mt-3">
                  {isFollowing ? (
                    <Button 
                      variant="danger" 
                      onClick={handleUnfollow}
                      className="w-100 profile-follow-btn"
                    >
                      <FontAwesomeIcon icon={faUserMinus} className="me-2" />
                      Unfollow
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      onClick={handleFollow}
                      className="w-100 custom-btn"
                    >
                      <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                      Follow
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Verification Status */}
            <div className="profile-verification-section mt-3">
            <h5>Profile {userData.verified ? "Verified" : "Not Verified"}</h5>
            {userData.verified ? (
                <p className="text-success fw-bold">
                <FontAwesomeIcon icon={faCheckCircle} /> Verified
                </p>
            ) : (
                <p className="text-danger fw-bold">
                <FontAwesomeIcon icon={faTimesCircle} /> Not Verified
                </p>
            )}
            
            {/* Compatibility Score - Only show if not viewing own profile */}
            {!isViewingOwnProfile && compatibilityScore !== null && (
              <div className="mt-3 compatibility-section">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="mb-0">Compatibility</h6>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id="compatibility-tooltip" className="compatibility-tooltip">
                        <strong>Score Calculation:</strong>
                        <ul className="mb-0 ps-3">
                          <li>Languages (20%)</li>
                          <li>Education (15%)</li>
                          <li>Hometown (10%)</li>
                          <li>Accommodation (10%)</li>
                          <li>Occupation (10%)</li>
                          <li>Groups (15%)</li>
                          <li>Age (10%)</li>
                          <li>References (10%)</li>
                        </ul>
                      </Tooltip>
                    }
                  >
                    <FontAwesomeIcon 
                      icon={faQuestionCircle} 
                      className="text-muted ms-2" 
                      style={{ cursor: "pointer", fontSize: "0.9rem" }}
                    />
                  </OverlayTrigger>
                </div>
                
                <div className="d-flex align-items-center mb-1">
                  <div className="progress flex-grow-1" style={{ height: "12px" }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ width: `${compatibilityScore}%` }}
                      aria-valuenow={compatibilityScore}
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    />
                  </div>
                  <span className="ms-2 fw-bold" style={{ fontSize: "0.9rem" }}>
                    {compatibilityScore}%
                  </span>
                </div>
              </div>
            )}
            </div>

            {/* Admin Button - Only show if current user is admin and not viewing own profile */}
            {JSON.parse(localStorage.getItem("userData"))?.role === "admin" && 
            !isViewingOwnProfile && (
            <div className="profile-admin-section mt-3">
                {userData?.role === "admin" ? (
                <Button 
                    variant="danger" 
                    onClick={() => handleToggleAdmin(false)}
                    className="w-100 profile-admin-btn"
                >
                    <FontAwesomeIcon icon={faUserShield} className="me-2" />
                    Remove Admin
                </Button>
                ) : (
                <Button 
                    variant="primary" 
                    onClick={() => handleToggleAdmin(true)}
                    className="w-100 custom-btn"
                >
                    <FontAwesomeIcon icon={faUserShield} className="me-2" />
                    Make Admin
                </Button>
                )}
            </div>
            )}
            {JSON.parse(localStorage.getItem("userData"))?.role === "admin" && 
              !isViewingOwnProfile && (
              <div className="profile-admin-section mt-1">
                {/* Existing admin buttons... */}
                
                <Button 
                  variant="danger" 
                  onClick={handleDeleteUser}
                  className="w-100 profile-delete-btn mt-2"
                >
                  <FontAwesomeIcon icon={faTrashAlt} className="me-2" />
                  Delete User Account
                </Button>
              </div>
            )}


          </Card>
        </Col>

        {/* Right Main Content */}
        <Col md={9} className="profile-content-col">
          {/* Navigation Tabs */}
          <div className="profile-nav-tabs mb-4 d-flex flex-wrap justify-content-center gap-2">
            {/* Overview Tab */}
            <Button
              variant={activeTab === "overview" ? "primary" : "outline-primary"}
              onClick={() => handleTabChange("overview")}
              className={`profile-nav-btn ${activeTab === "overview" ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faUser} /> Overview
            </Button>

            {/* References Tab */}
            <Button
              variant={activeTab === "references" ? "primary" : "outline-primary"}
              onClick={() => handleTabChange("references")}
              className={`profile-nav-btn ${activeTab === "references" ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faComment} /> References <span className="profile-badge ms-1">{userData.references?.length || 0}</span>
            </Button>

            {/* My Home Tab */}
            <Button
              variant={activeTab === "myHome" ? "primary" : "outline-primary"}
              onClick={() => handleTabChange("myHome")}
              className={`profile-nav-btn ${activeTab === "myHome" ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faHome} /> My Home
            </Button>

            {/* Posts Tab */}
            <Button
              variant={activeTab === "posts" ? "primary" : "outline-primary"}
              onClick={() => handleTabChange("posts")}
              className={`profile-nav-btn ${activeTab === "posts" ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faNewspaper} /> Posts <span className="profile-badge ms-1">{posts.length}</span>
            </Button>

            {/* Friends Tab */}
            <Button
              variant={activeTab === "friends" ? "primary" : "outline-primary"}
              onClick={() => handleTabChange("friends")}
              className={`profile-nav-btn ${activeTab === "friends" ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={faUserFriends} /> Friends <span className="profile-badge ms-1">{userData.friends?.length || 0}</span>
            </Button>
          </div>

          {/* Overview Section */}
          {activeTab === "overview" && (
            <>
                <OverviewCard 
                userData={userData} 
                readOnly={true}  // Hides phone number section
                />              
                <AboutMe userData={userData} readOnly={true} />
            </>
          )}

          {/* References Section */}
          {activeTab === "references" && (
            <Card className="profile-references-card p-3 mb-3 shadow-sm">
              <div className="profile-references-header d-flex justify-content-between align-items-center mb-3">
                <h5>References</h5>
                {!isViewingOwnProfile && (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowAddReference(!showAddReference)}
                    className="profile-add-reference-btn"
                    style={{ backgroundColor: "var(--identity-color, #39aaa4)", border: "none"}}
                  >
                    {showAddReference ? "Cancel" : "Add Reference"}
                  </Button>
                )}
              </div>
              
              {showAddReference && (
                <AddReferenceCard 
                  userId={userData.id} 
                  onAddReference={handleAddReference}
                  existingReferences={userData.references || []}
                />
              )}

              <div className="profile-filter-buttons mb-3">
                <Button
                  variant={filter === "all" ? "primary" : "outline-primary"}
                  onClick={() => setFilter("all")}
                  className={`profile-filter-btn ${filter === "all" ? "active" : ""}`}
                >
                  All
                </Button>
                <Button
                  variant={filter === "host" ? "primary" : "outline-primary"}
                  onClick={() => setFilter("host")}
                  className={`profile-filter-btn ${filter === "host" ? "active" : ""}`}
                >
                  Host
                </Button>
                <Button
                  variant={filter === "traveller" ? "primary" : "outline-primary"}
                  onClick={() => setFilter("traveller")}
                  className={`profile-filter-btn ${filter === "traveller" ? "active" : ""}`}
                >
                  Traveller
                </Button>
                <Button
                  variant={filter === "personal" ? "primary" : "outline-primary"}
                  onClick={() => setFilter("personal")}
                  className={`profile-filter-btn ${filter === "personal" ? "active" : ""}`}
                >
                  Personal
                </Button>
              </div>
              {filteredReferences.map((ref, index) => (
                <div key={index} className="reference-item">
                  <ReferencesCard 
                    reference={ref} 
                    onDelete={() => handleDeleteReference(ref.id)}
                  />
                </div>
              ))}


            </Card>
          )}

          {/* My Home Section */}
          {activeTab === "myHome" && (
            <MyHomeCards userData={userData} readOnly={true} />
          )}

          {/* Posts Section */}
          {activeTab === "posts" && (
            <div className="profile-posts-section">
              {sortedPosts.map((post) => (
                <div 
                  key={post.postId} 
                  id={`post-${post.postId}`}
                >
                  <PostCard
                    post={{
                      ...post,
                      userData: {
                        id: userData?.id,
                        name: userData?.name,
                        profilePicture: userData?.profilePicture,
                      },
                    }}
                    onToggleLike={handleToggleLike}
                    onAddComment={handleAddComment}
                    readOnly={false}
                    isProfilePage={true}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    onDelete={handleDeletePost} 
                    onDeleteComment={handleDeleteComment}
                    location={location}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Friends Section */}
          {activeTab === "friends" && (
            <div className="profile-friends-section">
              <Card className="p-3 mb-3 shadow-sm">
                <h5>Friends ({userData.friends?.length || 0})</h5>
                {friendsLoading ? (
                  <div className="row row-cols-1 g-3">
                    {[...Array(3)].map((_, index) => (
                      <div className="col px-0" key={`skeleton-${index}`}>
                        <UserCard loading />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {friendsData.length > 0 ? (
                      <div className="row row-cols-1 g-3">
                        {friendsData.map(friend => (
                          <div className="col px-0" key={friend.id}>
                            <UserCard 
                              user={friend}
                              onViewUser={handleViewProfile}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="profile-no-results">No friends to display.</p>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}