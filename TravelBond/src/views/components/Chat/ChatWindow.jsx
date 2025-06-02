import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Button, Form, Spinner } from "react-bootstrap";
import ChatService from "../../../services/ChatService";
import "./chat.css";
import { useNavigate } from "react-router-dom";
import Skeleton from "react-loading-skeleton";

const ChatWindow = ({ conversationId, otherUser, currentUserId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesContainerRef = useRef(null);
  const navigate = useNavigate(); 

  const handleViewProfile = () => {
    if (otherUser?.id) {
      navigate(`/profile/${otherUser.id}`);
    }
  };


  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = ChatService.subscribeToMessages(conversationId, (messages) => {
      setMessages(messages);
      setLoading(false);
    });

    ChatService.markMessagesAsRead(conversationId, currentUserId);

    return () => unsubscribe();
  }, [conversationId, currentUserId]);

  // 🆕 Scroll when messages change (after DOM updated)
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await ChatService.sendMessage(conversationId, currentUserId, newMessage);
      setNewMessage("");
      // no need to scroll manually here, useEffect on [messages] will handle it
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp?.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-window-container">
      <div className="chat-header">
        <Button variant="link" className="back-button" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </Button>
        
        <div 
          className="user-info" 
          role="button"
          onClick={handleViewProfile} // 🔥 Make user-info clickable
          style={{ cursor: "pointer" }}
        >
          <div className="user-avatar">
            {otherUser?.profilePicture && otherUser.profilePicture !== "none" ? (
              <img src={otherUser.profilePicture} alt={otherUser.name} className="rounded-circle" />
            ) : (
              <div className="avatar-placeholder rounded-circle">
                {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="user-name">
            {otherUser?.name || 'Unknown User'}
          </div>
        </div>
      </div>


      <div className="messages-container" ref={messagesContainerRef}>
          {loading ? (
            <Skeleton type="chat" count={3} />
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  {message.content}
                  <div className="message-time">
                    {formatMessageTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      <div className="message-input-container">
        <Form onSubmit={handleSendMessage} className="message-input-form">
          <Form.Control
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button 
            variant="primary" 
            type="submit" 
            disabled={!newMessage.trim()}
            style={{ backgroundColor: "var(--identity-color)", border: "none" }}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default ChatWindow;
