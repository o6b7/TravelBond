import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../utils/firebaseConfig";
import ChatSidebar from "../../components/Chat/ChatSidebar";
import ChatWindow from "../../components/Chat/ChatWindow";
import UserController from "../../../controllers/UserController";
import "./chatPage.css";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";
import ChatService from "../../../services/ChatService";

const ChatPage = () => {
  const { conversationId: initialConversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserData, setCurrentUserData] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData) {
      setCurrentUserId(userData.id);
      setCurrentUserData(userData);
    }
  }, []);

  useEffect(() => {
    const initializeChat = async () => {
      if (!initialLoad) return;
      
      setLoading(true);
      
      try {
        if (location.state?.otherUser) {
          const { otherUser } = location.state;
          setOtherUser(otherUser);
          
          const conversation = await ChatService.getOrCreateConversation(
            currentUserId,
            otherUser.id
          );
          
          setSelectedConversation(conversation.id);
          navigate(`/chat/${conversation.id}`, { 
            replace: true,
            state: { otherUser } 
          });
        } 
        else if (initialConversationId) {
          await handleSelectConversation(initialConversationId);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setInitialLoad(false);
        setLoading(false);
      }
    };

    if (currentUserId) {
      initializeChat();
    }
  }, [currentUserId, initialConversationId, location.state, navigate, initialLoad]);

  const handleSelectConversation = async (conversationId, otherUserData = null) => {
    try {
      setLoading(true);
      setSelectedConversation(conversationId);
  
      if (otherUserData) {
        setOtherUser(otherUserData);
      } else {
        const conversationRef = doc(db, "conversations", conversationId);
        const conversationDoc = await getDoc(conversationRef);
        
        if (conversationDoc.exists()) {
          const participants = conversationDoc.data().participants;
          const otherUserId = participants.find(id => id !== currentUserId);
          if (otherUserId) {
            const user = await UserController.fetchUserById(otherUserId);
            setOtherUser(user);
          }
        }
      }
    } catch (error) {
      console.error("Error selecting conversation:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackToConversations = () => {
    setSelectedConversation(null);
    setOtherUser(null);
    navigate("/chat");
  };

  return (
    <Container fluid className="chat-page-container">
      <Row className="chat-page-row">
        <Col md={4} lg={3} className={`chat-sidebar-col ${selectedConversation ? 'd-none d-md-block' : ''}`}>
          <ChatSidebar 
            userId={currentUserId} 
            onSelectConversation={handleSelectConversation}
            initialConversation={selectedConversation}
          />
        </Col>
        
        <Col md={8} lg={9} className={`chat-window-col ${!selectedConversation ? 'd-none d-md-block' : ''}`}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : selectedConversation && otherUser ? (
            <ChatWindow
              conversationId={selectedConversation}
              otherUser={otherUser}
              currentUserId={currentUserId}
              onBack={handleBackToConversations}
            />
          ) : (
            <div className="no-conversation-selected">
              <h4>Welcome to TravelBond Chat</h4>
              <p className="mb-0">Select a conversation to start chatting</p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ChatPage;