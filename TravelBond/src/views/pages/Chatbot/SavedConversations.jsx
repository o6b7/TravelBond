import React, { useState, useEffect } from "react";
import { Container, Alert, Badge, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRobot, faTrash, faClockRotateLeft, faSearch } from "@fortawesome/free-solid-svg-icons";
import SavedConversationService from "../../../services/SavedConversationService";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import useSweetAlert from "../../../hooks/useSweetAlert";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";
import { onSnapshot } from "firebase/firestore";
import "./savedConversations.css";

export default function SavedConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const auth = getAuth();
  const navigate = useNavigate();
  const { showAlert, showConfirmation } = useSweetAlert();

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      SavedConversationService.getUserConversationsRef(auth.currentUser.uid),
      (snapshot) => {
        const updatedConversations = snapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() || null;
          const lastMessageAt = data.lastMessageAt?.toDate?.() || createdAt;

          return {
            id: doc.id,
            ...data,
            createdAt,
            lastMessageAt,
          };
        });

        updatedConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
        setConversations(updatedConversations);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to conversations:", error);
        setError("Failed to load conversations.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    const result = await showConfirmation(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      "warning",
      "Yes",
      "No"
    );

    if (result.isConfirmed) {
      try {
        await SavedConversationService.deleteSavedConversation(id);
        setConversations(prev => prev.filter(c => c.id !== id));
        showAlert("Deleted", "Conversation has been deleted", "success", "OK");
      } catch (error) {
        console.error("Error deleting conversation:", error);
        showAlert("Error", "Failed to delete conversation", "error");
      }
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchQuery && !conv.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    const baseDate = conv.lastMessageAt || conv.createdAt;
    if (!(baseDate instanceof Date)) return false;

    const daysOld = (Date.now() - baseDate.getTime()) / (1000 * 60 * 60 * 24);

    if (activeFilter === "recent") return daysOld <= 7;
    if (activeFilter === "older") return daysOld > 7;
    return true;
  });

  const formatDate = (date) => {
    return date instanceof Date
      ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Unknown";
  };

  if (loading && conversations.length === 0) return <LoadingComponent />;

  if (error) {
    return (
      <Container className="chat-history-container">
        <Alert variant="danger" className="chat-history-error">
          <h4>Error Loading Conversations</h4>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="chat-history-container">
      <div className="chat-history-header">
        <h2>
          <FontAwesomeIcon icon={faClockRotateLeft} className="chat-history-icon" />
          Conversation History
        </h2>
        <div className="chat-history-controls">
          <div className="chat-history-search">
            <FontAwesomeIcon icon={faSearch} className="chat-history-search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="chat-history-filters">
            {["all", "recent", "older"].map(filter => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "primary" : "outline-primary"}
                className={`chat-history-filter-btn ${activeFilter === filter ? "active" : ""}`}
                onClick={() => setActiveFilter(filter)}
                size="sm"
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {filteredConversations.length === 0 ? (
        <div className="chat-history-empty">
          <FontAwesomeIcon icon={faRobot} className="chat-history-empty-icon" />
          <h4>No conversations found</h4>
          <p>{searchQuery ? "Try a different search term." : "Your saved chatbot conversations will appear here."}</p>
        </div>
      ) : (
        <div className="chat-history-list">
          {filteredConversations.map(conv => (
            <div
              key={conv.id}
              className="chat-history-card"
              onClick={() => navigate(`/chatbot-conversation/${conv.id}`)}
            >
              <div className="chat-history-avatar">
                <FontAwesomeIcon icon={faRobot} />
              </div>
              <div className="chat-history-content">
                <div className="chat-history-title">
                  <div className="chat-history-title-text">
                    <h5>{conv.title}</h5>
                    <p className="chat-history-date">{formatDate(conv.createdAt)}</p>
                  </div>
                </div>

                <p className="chat-history-preview">
                  {conv.lastMessage?.length > 100
                    ? `${conv.lastMessage.substring(0, 100)}...`
                    : conv.lastMessage}
                </p>
                <button
                  className="chat-history-delete"
                  onClick={(e) => handleDelete(conv.id, e)}
                  aria-label="Delete conversation"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
