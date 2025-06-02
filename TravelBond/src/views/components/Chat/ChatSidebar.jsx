import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { InputGroup, FormControl, Spinner, Badge } from "react-bootstrap";
import ChatService from "../../../services/ChatService";
import UserController from "../../../controllers/UserController";
import "./Chat.css";
import { useLocation } from "react-router-dom";
import Skeleton from "react-loading-skeleton";

const ChatSidebar = ({ userId, onSelectConversation, forceLoad }) => {
  const [conversations, setConversations] = useState([]);
  const [resolvedConversations, setResolvedConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [currentUserId, setCurrentUserId] = useState("");

  useEffect(() => {
    const localUserId = localStorage.getItem("userId");
    const headerUserId = location?.state?.userId;

    if (headerUserId) {
      setCurrentUserId(headerUserId);
      localStorage.setItem("userId", headerUserId);
    } else if (localUserId) {
      setCurrentUserId(localUserId);
    }
  }, [location]);

  useEffect(() => {
    let unsubscribe;

    const loadConversations = () => {
      if (unsubscribe) unsubscribe();
      
      setLoading(true);
      unsubscribe = ChatService.subscribeToConversations(userId, (conversations) => {
        setConversations(conversations);
        setLoading(false);
      });
    };

    loadConversations();

    if (forceLoad) {
      loadConversations();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId, forceLoad]);

  useEffect(() => {
    const fetchParticipants = async () => {
      const result = await Promise.all(
        conversations.map(async (conv) => {
          const otherUserId = conv.participants.find(id => id !== userId);
          if (!otherUserId) return null;

          try {
            const otherUser = await UserController.fetchUserById(otherUserId);
            return { ...conv, otherUser };
          } catch (error) {
            console.error("Error fetching participant:", error);
            return null;
          }
        })
      );

      const filtered = result.filter(r => r !== null);
      setResolvedConversations(filtered);
    };

    if (conversations.length > 0) {
      fetchParticipants();
    } else {
      setResolvedConversations([]);
    }
  }, [conversations, userId]);

  const filteredConversations = resolvedConversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const searchTerm = searchQuery.toLowerCase();
    const messageMatch = conv.lastMessage?.toLowerCase().includes(searchTerm);
    const nameMatch = conv.otherUser?.name?.toLowerCase().includes(searchTerm);
    
    return messageMatch || nameMatch;
  });

  if (loading) {
    return <Skeleton type="chat" count={3} />;
  }

  return (
    <div className="chat-sidebar-container">
      <div className="sidebar-header">
        <h5 className="mb-0">Messages</h5>
        <button 
          className="btn btn-link p-0"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <FontAwesomeIcon icon={isSearchOpen ? faTimes : faSearch} />
        </button>
      </div>

      {isSearchOpen && (
        <InputGroup className="mb-3 px-3">
          <FormControl
            placeholder="Search messages or names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </InputGroup>
      )}

      <div className="conversation-list-container">
        {loading ? (
          <div className="chat-skeleton-loading">
            <Skeleton type="chat" count={3} />
          </div>
        ) : searchQuery.trim() && filteredConversations.length === 0 ? (
          <div className="text-center py-4 text-muted">
            No conversations match your search
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-4 text-muted">
            No conversations found. Start a new chat!
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const { otherUser } = conversation;
            if (!otherUser) return null;

            return (
              <div
                key={conversation.id}
                className={`conversation-item ${conversation.unreadCount[userId] > 0 ? 'unread' : ''}`}
                onClick={() => onSelectConversation(conversation.id, otherUser)}
              >
                <div className="user-avatar">
                  {otherUser.profilePicture !== "none" ? (
                    <img src={otherUser.profilePicture} alt={otherUser.name} className="rounded-circle" />
                  ) : (
                    <div className="avatar-placeholder rounded-circle">
                      {otherUser.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {conversation.unreadCount[userId] > 0 && (
                    <Badge pill bg="danger" className="unread-badge">
                      {conversation.unreadCount[userId]}
                    </Badge>
                  )}
                </div>
                <div className="conversation-details">
                  <div className="d-flex justify-content-between">
                    <span className="user-name">{otherUser.name}</span>
                    <small className="message-time">
                      {conversation.lastMessageAt &&
                        new Date(conversation.lastMessageAt?.seconds * 1000).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </small>
                  </div>
                  <p className="last-message mb-0 text-truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;