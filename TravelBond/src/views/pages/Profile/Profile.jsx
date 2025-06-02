import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Button, ProgressBar, Spinner, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faMapMarkerAlt,
  faPlus,
  faUserFriends,
  faHeart,
  faHome,
  faComment,
  faNewspaper,
  faUser,
  faEdit, 
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "./profile.css";
import "../../../global.css";
import UserController from "../../../controllers/UserController";
import ReferencesCard from "../../components/ProfileComponents/ReferencesCard/ReferencesCard";
import OverviewCard from "../../components/ProfileComponents/OverviewCard/OverviewCard";
import AboutMe from "../../components/ProfileComponents/AboutMe/AboutMe";
import MyHomeCards from "../../components/ProfileComponents/MyHomeCards/MyHomeCards";
import PostCard from "../../components/ProfileComponents/PostCard/PostCard";
import CreatePostCard from "../../components/ProfileComponents/PostCard/CreatePostCard";
import PostController from "../../../controllers/PostController";
import useSweetAlert from "../../../hooks/useSweetAlert";
import { storage } from "../../../utils/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import UserCard from "../../components/UserCard/UserCard";
import { usePagination } from "../../../hooks/usePagination";
import PaginationControls from "../../components/Common/PaginationControls";
import Helpers from "../../../utils/helpers";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('profileActiveTab') || "overview";
  });
  const [filter, setFilter] = useState("all");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [friendsData, setFriendsData] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const { userId: paramUserId } = useParams();
  const isViewingOwnProfile = !paramUserId || paramUserId === userData?.id;
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const userId = userData?.id || "U001";
  const [allUsers, setAllUsers] = useState([]);
  const { showAlert, showConfirmation } = useSweetAlert();

  // Pagination for friends
  const {
    visibleItems: visibleFriends,
    showMore: loadMoreFriends,
    showLess: showLessFriends,
    resetPagination: resetFriendsPagination
  } = usePagination(6, 6);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const users = await UserController.fetchUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching all users:", error);
      }
    };
    
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUserData = JSON.parse(localStorage.getItem("userData"));
        if (!storedUserData || !storedUserData.email) {
          setError("No user data found in localStorage.");
          return;
        }

        const user = await UserController.fetchUserByEmail(storedUserData.email);
        setUserData(user);
        calculateProfileCompletion(user);
      } catch (error) {
        setError("Error fetching user data. Please try again later.");
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const fetchedPosts = await PostController.fetchPostsByUser(userId);
        setPosts(fetchedPosts);
      } catch (error) {
        setPostsError("Error fetching posts");
        console.error("Error fetching posts:", error);
      } finally {
        setPostsLoading(false);
      }
    };

    if (userId) {
      fetchPosts();
    }
  }, [userId]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userData?.friends || userData.friends.length === 0) {
        setFriendsData([]);
        setFriendsLoading(false);
        return;
      }
      
      setFriendsLoading(true);
      try {
        // Use existing fetchUsers method and filter by friend IDs
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
  
    if (activeTab === "friends") {
      fetchFriends();
      resetFriendsPagination();
    }
  }, [activeTab, userData?.friends]);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      setFavoritesLoading(true);
      try {
        const allPosts = await PostController.fetchAllPosts();
        const likedPosts = allPosts.filter(post => 
          post.likedBy.includes(userId)
        );
        setFavorites(likedPosts);
        setFavoritesCount(likedPosts.length); // Update the count
      } catch (error) {
        console.error("Error fetching liked posts:", error);
      } finally {
        setFavoritesLoading(false);
      }
    };
  
    fetchLikedPosts();
  }, [activeTab, userId, isViewingOwnProfile]);

  const calculateProfileCompletion = (user) => {
    if (!user) return;

    const fieldsToCheck = [
      "name",
      "hometown",
      "occupation",
      "education",
      "languages",
      "references",
      "profilePicture",
      "address",
      "accommodationType",
      "DOB",
      "bio",
      "myHomeDescription",
      "myHomePhotos",
    ];

    const filledFields = fieldsToCheck.filter((field) => {
      if (Array.isArray(user[field])) return user[field].length > 0;
      return !!user[field] && user[field] !== "-";
    }).length;

    setProfileCompletion(Math.round((filledFields / fieldsToCheck.length) * 100));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('profileActiveTab', tab);
  };

  const handleUpdate = async (updatedData) => {
    try {
      await UserController.updateUser(userData.id, updatedData);
      setUserData(updatedData);
      calculateProfileCompletion(updatedData);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const handleProfilePictureChange = async (e) => {
    if (!isViewingOwnProfile) return;
    
    const file = e.target.files[0];
    if (!file) return;

    const result = await showConfirmation(
      "Are you sure?",
      "Do you want to update your profile picture?",
      "question",
      "Yes, update it!",
      "Cancel"
    );

    if (result.isConfirmed) {
      try {
        const storageRef = ref(storage, `profile-pictures/${userData.id}-${file.name}`);
        await uploadBytes(storageRef, file);

        const downloadURL = await getDownloadURL(storageRef);

        await UserController.updateUser(userData.id, { profilePicture: downloadURL });

        setUserData((prev) => ({ ...prev, profilePicture: downloadURL }));

        showAlert("Success!", "Profile picture updated successfully.", "success", "OK");
      } catch (error) {
        console.error("Error updating profile picture:", error);
        showAlert("Error", "Failed to update profile picture. Please try again.", "error", "OK");
      }
    }
  };

  const filteredReferences = userData?.references
  ? userData.references.filter((ref) => {
      const type = typeof ref === "string"
        ? ref.split(",")[1]
        : ref?.type;
      return filter === "all" || type === filter;
    })
  : [];


  const handleCreatePost = async (content, photos) => {
    try {
      const postId = await PostController.createPost(userId, content, photos);
      const fetchedPosts = await PostController.fetchPostsByUser(userId);
      setPosts(fetchedPosts);
      setShowCreatePost(false);
      showAlert("Success!", "Your post has been uploaded.", "success", "OK");
    } catch (error) {
      console.error("Error creating post:", error);
      showAlert("Error", "Failed to upload post. Please try again.", "error", "OK");
    }
  };

  const handleUpdatePost = async (postId, content) => {
    try {
      await PostController.updatePost(postId, content);
      const fetchedPosts = await PostController.fetchPostsByUser(userId);
      setPosts(fetchedPosts);
      showAlert("Success!", "Post updated successfully.", "success", "OK");
    } catch (error) {
      console.error("Error updating post:", error);
      showAlert("Error", "Failed to update post.", "error", "OK");
    }
  };

  const handleDeletePost = async (postId, photos = []) => {
    try {
      await PostController.deletePost(postId, photos);

      setPosts(prevPosts => prevPosts.filter(post => post.postId !== postId));
      showAlert("Deleted!", "The post has been deleted.", "success", "OK");
    } catch (error) {
      console.error("Error deleting post:", error);
      showAlert("Error", "Failed to delete post.", "error", "OK");
    }
  };
  

  const handleAddComment = async (postId, commentText) => {
    try {
      const comment = await PostController.addComment(postId, userId, commentText);
      const fetchedPosts = await PostController.fetchPostsByUser(userId);
      setPosts(fetchedPosts);
      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  const handleAddReply = async (postId, commentId, replyText) => {
    try {
      await PostController.addReply(postId, commentId, userId, replyText);
      const fetchedPosts = await PostController.fetchPostsByUser(userId);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error adding reply:", error);
      throw error;
    }
  };

  const handleToggleLike = async (postId, commentId = null, replyId = null) => {
    try {
      // Optimistic update for favorites
      setFavorites(prevFavorites => {
        const updatedFavorites = prevFavorites.map(post => {
          if (post.postId === postId) {
            const isLiked = post.likedBy?.includes(userId) || false;
            return {
              ...post,
              likedBy: isLiked
                ? post.likedBy.filter(id => id !== userId)
                : [...(post.likedBy || []), userId]
            };
          }
          return post;
        });
        
        // Update count based on the updated favorites
        const newCount = updatedFavorites.filter(post => 
          post.likedBy?.includes(userId)
        ).length;
        setFavoritesCount(newCount);
        
        return updatedFavorites;
      });
  
      await PostController.toggleLike(postId, userId, commentId, replyId);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on error
      const allPosts = await PostController.fetchAllPosts();
      const likedPosts = allPosts.filter(post => post.likedBy.includes(userId));
      setFavorites(likedPosts);
      setFavoritesCount(likedPosts.length);
      throw error;
    }
  };

  const handleDeleteComment = async (postId, commentId, replyId = null) => {
    try {
      await PostController.deleteComment(postId, commentId, replyId);
      const fetchedPosts = await PostController.fetchPostsByUser(userId);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  };

  const handleReportContent = async (postId, commentId = null, replyId = null) => {
    try {
      await PostController.reportContent(postId, userId, commentId, replyId);
      showAlert("Reported", "The content has been reported to moderators.", "success", "OK");
    } catch (error) {
      console.error("Error reporting content:", error);
      showAlert("Error", "Failed to report content.", "error", "OK");
    }
  };

  const handleViewProfile = (userId) => {
    window.location.href = `/profile/${userId}`;
  };

  const sortedPosts = posts.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

  if (loading) {
    return <LoadingComponent/>;
  }

  if (error) {
    return (
      <Container className="text-center mt-5">
        <p className="text-danger">{error}</p>
      </Container>
    );
  }

  return (
    <Container className="profile-page-container mt-4">
      <Row>
        {/* Left Sidebar */}
        <Col md={3} className="profile-sidebar-col">
          <Card className="profile-sidebar-card text-center p-3 shadow-sm">
          <div className="profile-avatar-section text-center mb-4">
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

              {isViewingOwnProfile && (
                <Button
                  variant="link"
                  className="profile-edit-btn position-absolute"
                  onClick={() => document.getElementById("profile-picture-input").click()}
                >
                  <FontAwesomeIcon icon={faEdit} className="text-white bg-primary rounded-circle p-2" />
                </Button>
              )}

              <input
                type="file"
                id="profile-picture-input"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleProfilePictureChange(e)}
              />
            </div>
          </div>
          <h4 className="profile-username">{userData.name || "Unknown User"}</h4>
          {/* Add this line to display the user ID */}
          <small className="text-muted d-block user-id-display">ID: {userData.id}</small>
          <div className="profile-location text-muted">
            <FontAwesomeIcon icon={faMapMarkerAlt} /> {userData.address || "Location Unknown"}
          </div>

            {isViewingOwnProfile && (
              <div className="profile-completion-section mt-3">
                <h6>Profile {profileCompletion}% Complete</h6>
                <ProgressBar now={profileCompletion} variant="success" className="mb-2" />
                <small className="text-muted">Complete your profile to improve trust</small>
              </div>
            )}

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
            </div>
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

            {/* Favourites Tab */}
            {isViewingOwnProfile && (
              <Button
                variant={activeTab === "favourites" ? "primary" : "outline-primary"}
                onClick={() => handleTabChange("favourites")}
                className={`profile-nav-btn ${activeTab === "favourites" ? "active" : ""}`}
              >
                <FontAwesomeIcon icon={faHeart} /> Favourites <span className="profile-badge ms-1">{favoritesCount}</span>
              </Button>
            )}
          </div>

          {/* Overview Section */}
          {activeTab === "overview" && (
            <>
              <OverviewCard 
                userData={userData} 
                onUpdate={handleUpdate} 
                readOnly={false}  // Shows phone number section
              />
              <AboutMe 
                userData={userData} 
                onUpdate={isViewingOwnProfile ? handleUpdate : null} 
                readOnly={!isViewingOwnProfile} 
              />
            </>
          )}

          {/* References Section */}
          {activeTab === "references" && (
            <Card className="profile-references-card p-3 mb-3 shadow-sm">
              <h5>References</h5>
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
              {filteredReferences.length > 0 ? (
                filteredReferences.map((ref, index) => (
                  <ReferencesCard key={index} reference={ref} />
                ))
              ) : (
                <p className="profile-no-results">No references found.</p>
              )}
            </Card>
          )}

          {/* My Home Section */}
          {activeTab === "myHome" && (
            <MyHomeCards 
              userData={userData} 
              onUpdate={isViewingOwnProfile ? handleUpdate : null} 
              readOnly={!isViewingOwnProfile} 
            />
          )}

          {/* Posts Section */}
          {activeTab === "posts" && (
            <div className="profile-posts-section">
              {isViewingOwnProfile && (
                <>
                  <Button 
                    onClick={() => setShowCreatePost(true)} 
                    className="profile-create-post-btn"
                  >
                    <FontAwesomeIcon icon={faPlus} /> Create New Post
                  </Button>
                  {showCreatePost && (
                    <CreatePostCard 
                      onCreatePost={handleCreatePost} 
                      onCancel={() => setShowCreatePost(false)} 
                    />
                  )}
                </>
              )}
              {postsLoading && <p className="profile-loading">Loading posts...</p>}
              {postsError && <p className="profile-error">{postsError}</p>}
              {sortedPosts.map((post) => (
                <PostCard
                key={post.postId}
                post={{
                  ...post,
                  userData: {
                    id: userData?.id,
                    name: userData?.name,
                    profilePicture: userData?.profilePicture,
                  },
                }}
                onEdit={isViewingOwnProfile ? handleUpdatePost : null}
                onDelete={isViewingOwnProfile ? handleDeletePost : null}  // ✅ Passed properly
                onAddComment={handleAddComment}
                onAddReply={handleAddReply}
                onToggleLike={handleToggleLike}
                onReport={handleReportContent}
                onDeleteComment={handleDeleteComment}
                isProfilePage={true}
                readOnly={!isViewingOwnProfile}
                currentUserId={userId}
              />


              ))}
            </div>
          )}

          {/* Friends Section */}
          {activeTab === "friends" && (
            <div className="profile-friends-section">
              <Card className="profile-friends-card p-3 mb-3 shadow-sm">
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
                      <>
                        <div className="row row-cols-1 g-3">
                          {friendsData.slice(0, visibleFriends).map(friend => (
                            <div className="col px-0" key={friend.id}>
                              <UserCard 
                                user={friend}
                                onViewUser={handleViewProfile}
                              />
                            </div>
                          ))}
                        </div>
                        {friendsData.length > visibleFriends && (
                          <PaginationControls
                            onShowMore={loadMoreFriends}
                            onShowLess={showLessFriends}
                            remainingItems={friendsData.length - visibleFriends}
                            initialCount={visibleFriends}
                          />
                        )}
                      </>
                    ) : (
                      <p className="profile-no-results">No friends to display.</p>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}

          {/* Favourites Section */}
          {activeTab === "favourites" && isViewingOwnProfile && (
            <div className="profile-favorites-section">
              <h5>Favourites ({favorites.length})</h5>
              {favoritesLoading ? (
                <div className="text-center">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading favorites...</span>
                  </Spinner>
                </div>
              ) : favorites.length > 0 ? (
                <>
                  {favorites
                    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
                    .map((favPost) => {
                      // Find the user data for each favorite post from all users
                      const postUser = allUsers.find(user => user.id === favPost.userId) || 
                        { id: favPost.userId, name: "Unknown User", profilePicture: "none" };
                      
                      return (
                        <PostCard
                          key={favPost.postId}
                          post={{
                            ...favPost,
                            userData: postUser, // Add userData to match dashboard posts structure
                            userCountry: postUser.address || "",
                            friendCount: postUser.friends?.length || 0
                          }}
                          onToggleLike={handleToggleLike}
                          onAddComment={handleAddComment}
                          onAddReply={handleAddReply}
                          onDeleteComment={handleDeleteComment}
                          onReport={handleReportContent}
                          currentUserId={userId}
                          currentUserRole={userData?.role}
                        />
                      );
                    })}
                </>
              ) : (
                <p className="profile-no-results">You haven't liked any posts yet.</p>
              )}
            </div>
          )}
          
        </Col>
      </Row>
    </Container>
  );
}