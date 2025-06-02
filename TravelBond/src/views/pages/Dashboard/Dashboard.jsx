import React, { useEffect, useState } from "react";
import { db } from "../../../utils/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom"; 
import {
  faUserCircle,
  faFlag,
  faUsers,
  faCalendarAlt,
  faUserFriends,
  faNewspaper,
  faSignInAlt
} from "@fortawesome/free-solid-svg-icons";
import { Button, Container, Row, Col, Spinner, Card, Table, Badge, Alert } from "react-bootstrap";
import EventCard from "../../components/EventCard/EventCard";
import PostCard from "../../components/ProfileComponents/PostCard/PostCard";
import GroupCard from "../../components/GroupCard/GroupCard";
import PostController from "../../../controllers/PostController";
import UserController from "../../../controllers/UserController";
import ReportController from "../../../controllers/ReportController";
import { usePagination } from "../../../hooks/usePagination";
import PaginationControls from "../../components/Common/PaginationControls";
import "./dashboard.css";
import "../../../global.css";
import UserCard from "../../components/UserCard/UserCard";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [posts, setPosts] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followingPosts, setFollowingPosts] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [contentNames, setContentNames] = useState({});
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate(); 
  const auth = getAuth();
  
  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (!user) {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // Pagination controls
  const {
    visibleItems: visibleMatchingUsers,
    showMore: loadMoreMatchingUsers,
    showLess: showLessMatchingUsers,
  } = usePagination(3, 3);
  const {
    visibleItems: visibleFollowingPosts,
    showMore: loadMoreFollowingPosts,
    showLess: showLessFollowingPosts,
  } = usePagination(3, 3);
  const {
    visibleItems: visibleEvents,
    showMore: loadMoreEvents,
    showLess: showLessEvents,
  } = usePagination(3, 3);
  const {
    visibleItems: visiblePosts,
    showMore: loadMorePosts,
    showLess: showLessPosts,
  } = usePagination(3, 3);
  const {
    visibleItems: visibleReports,
    showMore: loadMoreReports,
    showLess: showLessReports,
  } = usePagination(5, 5); 

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUserData = JSON.parse(localStorage.getItem("userData"));
        if (!storedUserData || !storedUserData.email) return;

        const user = await UserController.fetchUserByEmail(storedUserData.email);
        setUserData(user);
        
        if (user?.id) {
          await UserController.updateLastActive(user.id);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (isLoggedIn) {
      fetchUser();
    }
  }, [isLoggedIn]);

  const fetchUserReports = async () => {
    try {
      setReportsLoading(true);
      
      const rawReports = await ReportController.fetchAllReports();
      
      const userReportsData = rawReports.filter(report => report.reporterId === userData.id);
      
      const validReports = [];
      const contentNames = {};
      
      for (const report of userReportsData) {
        if (report.contentType === 'event' || report.contentType === 'group') {
          const [firstId] = report.reportedId || [];
          try {
            const collectionName = report.contentType === 'event' ? 'events' : 'groups';
            const docRef = doc(db, collectionName, firstId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              contentNames[firstId] = docSnap.data().title || docSnap.data().name;
              validReports.push(report);
            }
          } catch (error) {
            console.error(`Error fetching ${report.contentType}:`, error);
          }
        } else {
          validReports.push(report);
        }
      }
      
      validReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setContentNames(contentNames);
      setUserReports(validReports);
    } catch (error) {
      console.error("Error fetching user reports:", error);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchData();
      fetchUserReports();
      
      const updateActivity = async () => {
        try {
          await UserController.updateLastActive(userData.id);
        } catch (error) {
          console.error("Failed to update last active:", error);
        }
      };
      updateActivity();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const userCity = userData?.address?.split(',')[0]?.trim();
      const userCountry = userData?.address?.split(',')[1]?.trim();
      
      const eventsCollection = collection(db, "events");
      const eventsSnapshot = await getDocs(eventsCollection);
      const allEvents = eventsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        participantCount: doc.data().participants?.length || 0
      }));
      
      const groupsCollection = collection(db, "groups");
      const groupsSnapshot = await getDocs(groupsCollection);
      const allGroups = groupsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        participantCount: doc.data().participants?.length || 0
      }));
      
      const postsCollection = collection(db, "posts");
      const postsSnapshot = await getDocs(postsCollection);
      const allPosts = postsSnapshot.docs.map(doc => ({ 
        postId: doc.id, 
        ...doc.data(),
        friendCount: doc.data().friends?.length || 0
      }));
      
      const users = await UserController.fetchUsers();

      if (!userCountry) {
        const sortedEvents = [...allEvents]
          .sort((a, b) => b.participantCount - a.participantCount)
          .slice(0, 6);
        
        const sortedGroups = [...allGroups]
          .sort((a, b) => b.participantCount - a.participantCount)
          .slice(0, 6);
        
        const sortedPosts = [...allPosts]
          .filter(post => post.userId !== userData.id) 
          .sort((a, b) => b.friendCount - a.friendCount)
          .slice(0, 6);
        
        const sortedUsers = users
          .filter(u => {
            const isSameUser = u.id === userData.id;
            const isAcceptingGuests = u.guestStatus !== "Not Accepting Guests";
            return !isSameUser && isAcceptingGuests;
          })
          .sort((a, b) => (b.friends?.length || 0) - (a.friends?.length || 0))
          .slice(0, 6);
        
        setEvents(sortedEvents);
        setGroups(sortedGroups);
        
        const postsWithUserData = sortedPosts.map(post => {
          const user = users.find(u => u.id === post.userId);
          return { ...post, userCountry: user?.address || "", userData: user || null };
        });
        setPosts(postsWithUserData);
        setMatchingUsers(sortedUsers);
      } else {
        const filteredEvents = allEvents
          .filter(event => {
            const eventAddressParts = event.location?.split(',').map(part => part.trim());
            const eventCountry = eventAddressParts?.[1] || "";
        
            return eventCountry && eventCountry === userCountry;
          })
          .sort((a, b) => b.participantCount - a.participantCount);
        
        setEvents(filteredEvents);
        
        const filteredGroups = allGroups
          .sort((a, b) => b.participantCount - a.participantCount);
        setGroups(filteredGroups);
        
        const postsWithUserCountry = allPosts
          .filter(post => post.userId !== userData.id) 
          .map(post => {
            const user = users.find(u => u.id === post.userId);
            const userAddressParts = user?.address?.split(',').map(part => part.trim());
            const userCountryOnly = userAddressParts?.[1] || "";
          
            return { 
              ...post, 
              userCountry: userCountryOnly,
              userData: user || null,
              friendCount: user?.friends?.length || 0
            };
          });

        const matchedUsers = users
          .filter(u => {
            const isSameUser = u.id === userData.id;
            const hasAddress = u.address;
            const isAcceptingGuests = u.guestStatus !== "Not Accepting Guests";
            const userAddressParts = u.address?.split(',').map(part => part.trim());
            const userCountryOnly = userAddressParts?.[1] || "";

            return (
              !isSameUser &&
              hasAddress &&
              isAcceptingGuests &&
              userCountryOnly === userCountry
            );
          })
          .map(u => ({
            ...u,
            friendCount: u.friends?.length || 0,
          }))
          .sort((a, b) => b.friendCount - a.friendCount);
        
        setMatchingUsers(matchedUsers);
        
        const sortedPosts = postsWithUserCountry.sort((a, b) => {
          const aMatch = a.userCountry.split(',')[1]?.trim() === userCity;
          const bMatch = b.userCountry.split(',')[1]?.trim() === userCity;
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          
          const likesDiff = (b.likedBy?.length || 0) - (a.likedBy?.length || 0);
          if (likesDiff !== 0) return likesDiff;
          
          return (b.friendCount || 0) - (a.friendCount || 0);
        });
        setPosts(sortedPosts);
      }

      if (userData?.friends?.length > 0) {
        const batchSize = 10;
        const followingPostsBatches = [];
        
        for (let i = 0; i < userData.friends.length; i += batchSize) {
          const batch = userData.friends.slice(i, i + batchSize);
          const followingPostsQuery = query(
            postsCollection,
            where("userId", "in", batch)
          );
          const batchSnapshot = await getDocs(followingPostsQuery);
          followingPostsBatches.push(...batchSnapshot.docs.map(doc => ({
            postId: doc.id,
            ...doc.data()
          })));
        }
        
        const followingPostsWithUserData = followingPostsBatches.map(post => {
          const user = users.find(u => u.id === post.userId);
          return { 
            ...post, 
            userCountry: user?.address || "",
            userData: user || null,
            friendCount: user?.friends?.length || 0
          };
        });
        
        followingPostsWithUserData.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setFollowingPosts(followingPostsWithUserData);
      } else {
        setFollowingPosts([]);
      }

      const reportsCollection = collection(db, "reports");
      const reportsSnapshot = await getDocs(reportsCollection);
      setReports(reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestStatusChange = async (newStatus) => {
    if (!userData) return;
    setLoading(true);
    try {
      await UserController.updateUser(userData.id, { guestStatus: newStatus });
      setUserData((prev) => ({ ...prev, guestStatus: newStatus }));
      localStorage.setItem("userData", JSON.stringify({ ...userData, guestStatus: newStatus }));
    } catch (error) {
      console.error("Error updating guest status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (postId, commentText) => {
    try {
      const comment = await PostController.addComment(postId, userData.id, commentText);
      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  const handleAddReply = async (postId, commentId, replyText) => {
    try {
      await PostController.addReply(postId, commentId, userData.id, replyText);
  
      const fakeReplyId = uuidv4();
  
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.postId !== postId) return post;
  
          const updatedComments = post.comments.map(comment => {
            if (comment.commentId !== commentId) return comment;
  
            const updatedReplies = {
              ...comment.replies,
              [fakeReplyId]: {
                replyId: fakeReplyId, 
                reply: replyText,
                likes: [],
                userId: userData.id,
                user: userData,
                createdAt: new Date().toISOString(),
              },
            };
  
            return { ...comment, replies: updatedReplies };
          });
  
          return { ...post, comments: updatedComments };
        })
      );
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };
  
  const handleDeleteComment = async (postId, commentId, replyId = null) => {
    try {
      await PostController.deleteComment(postId, commentId, replyId);
  
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.postId !== postId) return post;
  
          const updatedComments = post.comments.map(comment => {
            if (comment.commentId !== commentId) return comment;
  
            if (replyId) {
              const updatedReplies = { ...comment.replies };
              delete updatedReplies[replyId];
  
              return { ...comment, replies: updatedReplies };
            } else {
              return null;
            }
          }).filter(comment => comment !== null);
  
          return { ...post, comments: updatedComments };
        })
      );
  
    } catch (error) {
      console.error("Error deleting content:", error);
    }
  };
  
  const handleToggleLike = async (postId, commentId = null, replyId = null) => {
    try {
      await PostController.toggleLike(postId, userData.id, commentId, replyId);
      
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.postId !== postId) return post;
  
          if (commentId && !replyId) {
            const updatedComments = post.comments.map(comment => {
              if (comment.commentId !== commentId) return comment;
  
              const isLiked = comment.likes?.includes(userData.id);
              const updatedLikes = isLiked
                ? comment.likes.filter(id => id !== userData.id)
                : [...(comment.likes || []), userData.id];
  
              return { ...comment, likes: updatedLikes };
            });
  
            return { ...post, comments: updatedComments };
          }
  
          if (commentId && replyId) {
            const updatedComments = post.comments.map(comment => {
              if (comment.commentId !== commentId) return comment;
  
              const updatedReplies = { ...comment.replies };
              if (updatedReplies[replyId]) {
                const isLiked = updatedReplies[replyId].likes?.includes(userData.id);
                updatedReplies[replyId].likes = isLiked
                  ? updatedReplies[replyId].likes.filter(id => id !== userData.id)
                  : [...(updatedReplies[replyId].likes || []), userData.id];
              }
  
              return { ...comment, replies: updatedReplies };
            });
  
            return { ...post, comments: updatedComments };
          }
  
          const isLiked = post.likedBy?.includes(userData.id);
          const updatedLikedBy = isLiked
            ? post.likedBy.filter(id => id !== userData.id)
            : [...(post.likedBy || []), userData.id];
  
          return { ...post, likedBy: updatedLikedBy };
        })
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };
  

  const handleDeletePost = async (postId) => {
    try {
      await PostController.deletePost(postId);
      fetchData(); 
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleReportContent = async (postId, commentId = null, replyId = null) => {
    try {
      await PostController.reportContent(postId, userData.id, commentId, replyId);
    } catch (error) {
      console.error("Error reporting content:", error);
    }
  };

  const getContentDescription = (report) => {
    const [firstId, secondId, thirdId] = report.reportedId || [];
    
    switch (report.contentType) {
      case 'group':
        return contentNames[firstId] 
          ? `Group: ${contentNames[firstId]}` 
          : 'Group was deleted';
      case 'discussion':
        return contentNames[firstId]
          ? `Discussion in Group: ${contentNames[firstId]}`
          : 'Discussion in a deleted group';
      case 'reply':
        if (firstId?.startsWith('G')) {
          return contentNames[firstId]
            ? `Reply in Group: ${contentNames[firstId]}`
            : 'Reply in a deleted group';
        } else if (firstId?.startsWith('E')) {
          return contentNames[firstId]
            ? `Reply in Event: ${contentNames[firstId]}`
            : 'Reply in a deleted event';
        } else if (firstId?.startsWith('P')) {
          return `Reply in Post: ${firstId}`;
        }
        return `Reply`;
      case 'comment':
        if (firstId?.startsWith('P')) {
          return `Comment in Post: ${firstId}`;
        }
        return `Comment`;
      case 'event':
        return contentNames[firstId]
          ? `Event: ${contentNames[firstId]}`
          : 'Event was deleted';
      case 'post':
        return `Post: ${firstId}`;
      default:
        return 'Unknown content';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "resolved":
        return <Badge bg="success">Resolved</Badge>;
      case "ignored":
        return <Badge bg="secondary">Ignored</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };


  return (
    <Container className="dashboard-container mt-4 mb-5">
      <Row>
        {!isLoggedIn ? (
          <Col xs={12}>
            <Alert variant="warning" className="text-center" style={{opacity: ".7"}}>
              <FontAwesomeIcon icon={faSignInAlt} size="lg" className="me-2" />
              <strong>Please login to access this page's full functionalities, you can access the events and group pages</strong>
            </Alert>
          </Col>
          ) : (
          "")}
          <>
          <Col lg={4} xl={3} className="mb-4">
            <Card className="profile-card p-3 shadow-sm text-center" style={{ height: "fit-content" }}>
              {userData ? (
                <>
                  {userData.profilePicture && userData.profilePicture !== "none" ? (
                    <img
                      src={userData.profilePicture}
                      alt="User Profile"
                      className="profile-img rounded-circle mb-3 mx-auto d-block"
                      style={{ width: "120px", height: "120px", objectFit: "cover" }}
                    />
                  ) : (
                    <FontAwesomeIcon 
                      icon={faUserCircle} 
                      size="5x" 
                      className="text-muted mb-3" 
                      style={{ color: "#6c757d" }}
                    />
                  )}
                  <h4 className="mb-2">{userData.name || "Unknown User"}</h4>
                  <p className="text-muted mb-3">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    {userData.address || "Location Unknown"}
                  </p>
                  
                  <div className="mb-3">
                    <label className="fw-bold d-block mb-2">Guest Status</label>
                    <select
                      value={userData.guestStatus || "Maybe Accepting Guests"}
                      onChange={(e) => handleGuestStatusChange(e.target.value)}
                      className="form-select mt-1 w-100"
                      disabled={loading}
                    >
                      <option value="Accepting Guests">Accepting Guests</option>
                      <option value="Maybe Accepting Guests">Maybe Accepting Guests</option>
                      <option value="Not Accepting Guests">Not Accepting Guests</option>
                    </select>
                  </div>
                  
                  <div className="verification-badge p-2 bg-light rounded">
                    <h6 className="mb-1">Verification Status</h6>
                    <p className={userData.verified ? "text-success fw-bold mb-1" : "text-danger fw-bold mb-1"}>
                      {userData.verified ? (
                        <>
                          <i className="fas fa-check-circle me-2"></i>
                          Verified
                        </>
                      ) : (
                        <>
                          <i className="fas fa-times-circle me-2"></i>
                          Not Verified
                        </>
                      )}
                    </p>
                    <small className="text-muted">Verify in profile settings</small>
                  </div>
                </>
              ) : (
                <div className="d-flex justify-content-center align-items-center py-3">
                  <Spinner animation="border" variant="primary" />
                </div>
              )}
            </Card>
          </Col>

          <Col lg={8} xl={9}>
            <div className="dashboard-content pb-4">
              {/* Previous Reports Section */}
              <section className="dashboard-section mb-4">
                <div className="section-header d-flex justify-content-between align-items-center mb-3">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faFlag} className="me-2 " style={{color: "var(--identity-color)"}}/>
                    Your Previous Reports
                  </h3>
                </div>
                
                {reportsLoading ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : userReports.length > 0 ? (
                  <Card className="mb-4">
                    <Table striped bordered hover responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>Reported Item</th>
                          <th>Content Type</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Admin Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userReports.slice(0, visibleReports).map((report) => (
                          <tr key={report.id}>
                            <td>{getContentDescription(report)}</td>
                            <td className="text-capitalize">{report.reason}</td>
                            <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                            <td>{getStatusBadge(report.status)}</td>
                            <td>{report.note || "No note provided"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    {userReports.length > 5 && (
                      <div className="mt-3 mb-2 text-center">
                        <PaginationControls
                          onShowMore={loadMoreReports}
                          onShowLess={showLessReports}
                          remainingItems={userReports.length - visibleReports}
                          initialCount={visibleReports}
                          showLessDisabled={visibleReports <= 5}
                        />
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card className="text-center p-4">
                    <p className="text-muted mb-0">You haven't submitted any reports yet</p>
                  </Card>
                )}
              </section>

              {/* Matching Users Section with added note when no address */}
              <section className="dashboard-section mb-4">
                <div className="section-header d-flex justify-content-between align-items-center mb-3">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faUserFriends} className="me-2" style={{ color: "var(--identity-color)" }} />
                    {userData?.address ? `Available Users Near You (${matchingUsers.length})` : "Suggested Users"}
                  </h3>
                  {userData?.address && (
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate("/filtered-data", { state: { showAllUsers: true } })}
                      className="chat-history-filter-btn"
                    >
                      View More Users
                    </Button>
                  )}
                </div>

                {!userData?.address && (
                  <div className="alert alert-info mb-3">
                    <small>We're showing random users. Add your address to see people near you.</small>
                  </div>
                )}

                <div className="users-container">
                  {userData?.address ? (
                    matchingUsers.length > 0 ? (
                      matchingUsers.slice(0, visibleMatchingUsers).map(user => (
                        <UserCard 
                          key={user.id} 
                          user={user} 
                          onViewUser={() => window.location.href = `/profile/${user.id}`} 
                        />
                      ))
                    ) : (
                      <p className="text-muted">No matching users found</p>
                    )
                  ) : (
                    matchingUsers.slice(0, visibleMatchingUsers).map(user => (
                      <UserCard 
                        key={user.id} 
                        user={user} 
                        onViewUser={() => window.location.href = `/profile/${user.id}`} 
                      />
                    ))
                  )}
                </div>

                {matchingUsers.length > 3 && (
                  <div className="mt-3 mb-2 text-center">
                    <PaginationControls
                      onShowMore={loadMoreMatchingUsers}
                      onShowLess={showLessMatchingUsers}
                      remainingItems={matchingUsers.length - visibleMatchingUsers}
                      initialCount={visibleMatchingUsers}
                    />
                  </div>
                )}
              </section>

              {/* Featured Groups Section */}
              <section className="dashboard-section mb-4">
                <div className="section-header d-flex justify-content-between align-items-center mb-3">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faUsers} className="me-2" style={{color: "var(--identity-color)"}}/>
                    Some Groups
                  </h3>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => window.location.href = "/groups"}
                    className="chat-history-filter-btn"
                  >
                    View All Groups
                  </Button>
                </div>
                
                <div className="groups-container">
                  {groups.length > 0 ? (
                    groups.map(group => (
                      <GroupCard key={group.id} group={group} className="mb-3" />
                    ))
                  ) : (
                    <p className="text-muted">No groups found</p>
                  )}
                </div>
              </section>

              {/* Local Events Section with added note when no address */}
              <section className="dashboard-section mb-4">
                <div className="section-header d-flex justify-content-between align-items-center mb-3">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" style={{color: "var(--identity-color)"}} />
                    {userData?.address ? `Near Events (${events.length})` : "Featured Events"}
                  </h3>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => window.location.href = "/events"}
                    className="chat-history-filter-btn"
                  >
                    View All Events
                  </Button>
                </div>
                
                {!userData?.address && (
                  <div className="alert alert-info mb-3">
                    <small>We're showing random events. Add your address to see events in your area.</small>
                  </div>
                )}
                
                <div className="events-container">
                  {events.length > 0 ? (
                    events.slice(0, visibleEvents).map(event => (
                      <EventCard key={event.id} event={event} className="mb-3" />
                    ))
                  ) : (
                    <p className="text-muted">No events found</p>
                  )}
                </div>
              </section>

              <section className="dashboard-section mb-4">
                <div className="section-header d-flex justify-content-between align-items-center mb-3">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faUserFriends} className="me-2" style={{color: "var(--identity-color)"}} />
                    Posts from People I Follow
                  </h3>
                </div>
                
                <div className="posts-container">
                  {followingPosts.length > 0 ? (
                    followingPosts.slice(0, visibleFollowingPosts).map(post => (
                      <PostCard
                        post={post}
                        onToggleLike={handleToggleLike}
                        onAddComment={handleAddComment}
                        onAddReply={handleAddReply}
                        onDeleteComment={handleDeleteComment} 
                        onReport={handleReportContent}
                        currentUserId={userData?.id}
                        currentUserRole={userData?.role}
                        key={post.postId}
                      />
                    ))
                  ) : (
                    <p className="text-muted">No posts from people you follow yet</p>
                  )}
                </div>
                
                {followingPosts.length > 3 && (
                  <div className="mt-3 mb-2 text-center">
                    <PaginationControls
                      onShowMore={loadMoreFollowingPosts}
                      onShowLess={showLessFollowingPosts}
                      remainingItems={followingPosts.length - visibleFollowingPosts}
                      initialCount={visibleFollowingPosts}
                    />
                  </div>
                )}
              </section>

              {/* Posts Section */}
              <section className="dashboard-section mb-0">
                <div className="section-header d-flex justify-content-between align-items-center mb-3">
                  <h3 className="section-title">
                    <FontAwesomeIcon icon={faNewspaper} className="me-2" style={{color: "var(--identity-color)"}} />
                    Recommended Posts
                  </h3>
                </div>
                
                <div className="posts-container">
                  {posts.length > 0 ? (
                    posts.slice(0, visiblePosts).map(post => (
                      <PostCard
                        post={post}
                        onToggleLike={handleToggleLike}
                        onAddComment={handleAddComment}
                        onAddReply={handleAddReply}
                        onDeleteComment={handleDeleteComment} 
                        onReport={handleReportContent}
                        currentUserId={userData?.id}
                        currentUserRole={userData?.role}
                        key={post.postId}
                      />
                    ))
                  ) : (
                    <p className="text-muted">No recommended posts found</p>
                  )}
                </div>
                
                {posts.length > 3 && (
                  <div className="mt-3 mb-2 text-center">
                    <PaginationControls
                      onShowMore={loadMorePosts}
                      onShowLess={showLessPosts}
                      remainingItems={posts.length - visiblePosts}
                      initialCount={visiblePosts}
                    />
                  </div>
                )}
              </section>
            </div>
          </Col>
          </>
      </Row>
    </Container>
  );
}