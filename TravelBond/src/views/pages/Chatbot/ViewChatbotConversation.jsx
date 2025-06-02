import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faTrash, 
  faShare, 
  faRobot,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import { getAuth } from "firebase/auth";
import SavedConversationService from "../../../services/SavedConversationService";
import useSweetAlert from "../../../hooks/useSweetAlert";
import { Spinner, Button, Badge } from "react-bootstrap";
import "./SavedConversations.css";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";

export default function ViewChatbotConversation() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth();
  const { showAlert, showConfirmation } = useSweetAlert();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId) {
        setError("Invalid conversation link");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const conversation = await SavedConversationService.getConversation(conversationId);
        if (!conversation) throw new Error("Conversation not found");

        if (!conversation.participants?.includes(auth.currentUser?.uid)) {
          throw new Error("You don't have permission to view this conversation");
        }

        setConversation(conversation);
        const messages = await SavedConversationService.getConversationMessages(conversationId);
        setMessages(messages);
      } catch (error) {
        console.error("Error fetching conversation:", error);
        setError(error.message);
        showAlert("Error", error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  const handleDelete = async () => {
    const result = await showConfirmation(
      "Delete Conversation",
      "Are you sure you want to delete this saved conversation?",
      "warning",
      "Yes",
      "No"
    );

    if (result.isConfirmed) {
      try {
        await SavedConversationService.deleteSavedConversation(conversationId);
        showAlert("Deleted", "Conversation has been deleted", "success", "KO");
        navigate("/saved-conversations");
      } catch (error) {
        console.error("Error deleting conversation:", error);
        showAlert("Error", "Failed to delete conversation", "error");
      }
    }
  };

  const handleContinue = () => {
    sessionStorage.setItem('continueConversation', JSON.stringify({
      messages: messages,
      title: conversation.title
    }));
    
    window.dispatchEvent(new Event('storage'));
    
    navigate("/saved-conversations");
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatBotMessage = (content) => {
    if (!content) return '';

    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    formatted = formatted.replace(/(\d+[\.\-\)]\s)/g, '<br/><span class="list-item">$1</span>');
    formatted = formatted.replace(/(\d+-)/g, '<br/><span class="list-item">$1</span>');
    
    formatted = formatted.replace(/\n/g, '<br/>');
    
    formatted = formatted.replace(/(<br\/>){2,}/g, '<br/><br/>');
    
    return formatted;
  };

  if (loading) {
    return <LoadingComponent/>;
  }

  if (error || !conversation) {
    return (
      <div className="conversation-view-container">
        <div className="error-container">
          <h4>Error loading conversation</h4>
          <p>{error || "The conversation could not be found"}</p>
          <Button 
            variant="primary"
            className="btn-back"
            onClick={() => navigate("/saved-conversations")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back to Conversations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view-container">
      <div className="chat-view-header">
        <Button 
          variant="outline-secondary"
          className="chat-view-back"
          onClick={() => navigate("/saved-conversations")}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </Button>
        <div className="chat-view-info">
          <div className="chat-view-avatar">
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <div>
            <h4>{conversation.title}</h4>
            <p className="chat-view-date">
              <Badge bg="light" text="dark">
                {formatDate(conversation.createdAt)}
              </Badge>
            </p>
          </div>
        </div>
        <div className="chat-view-actions">
          <Button variant="primary" onClick={handleContinue} className="chat-history-filter-btn">
            <FontAwesomeIcon icon={faShare} className="me-2" />
            Continue
          </Button>
          <Button variant="outline-danger" onClick={handleDelete} className="chat-view-delete">
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="chat-view-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-view-message ${message.sender === 'bot' ? 'bot' : 'user'}`}
          >
            <div className="chat-view-message-avatar">
              {message.sender === 'bot' ? (
                <FontAwesomeIcon icon={faRobot} />
              ) : (
                <div className="chat-view-user-avatar">
                  {auth.currentUser?.displayName?.charAt(0).toUpperCase() || 
                   <FontAwesomeIcon icon={faUser} />}
                </div>
              )}
            </div>
            <div className="chat-view-message-content">
              {message.sender === 'bot' ? (
                <div dangerouslySetInnerHTML={{ __html: formatBotMessage(message.content) }} />
              ) : (
                <p>{message.content}</p>
              )}
              <div className="chat-view-message-time">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-view-continue-container">
          <Button variant="primary" onClick={handleContinue} className="chat-history-filter-btn">
            <FontAwesomeIcon icon={faShare} className="me-2" />
            Continue this conversation in chat
          </Button>
        </div>

    </div>
  );
}