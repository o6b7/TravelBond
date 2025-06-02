import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faComment, faTimes, faMinus, 
  faExpand, faCompress, faPaperPlane,
  faSpinner, faBookmark, faBookmark as faSolidBookmark,
  faEllipsisV, faTrash, faUserLock
} from "@fortawesome/free-solid-svg-icons";
import { Dropdown, Button, Spinner, Alert } from "react-bootstrap";
import ChatbotController from "../../../controllers/ChatbotController";
import SavedConversationService from "../../../services/SavedConversationService";
import { getAuth } from "firebase/auth";
import useSweetAlert from "../../../hooks/useSweetAlert";
import "./ChatWidget.css";

const formatMessage = (content) => {
    if (!content) return '';
    
    // Replace markdown bold with HTML strong tags
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle numbered lists
    formatted = formatted.replace(/(\d+[\.\-\)]\s)/g, '<br/><span class="list-number">$1</span>');
    formatted = formatted.replace(/(\d+-)/g, '<br/><span class="list-number">$1</span>');
    
    // Replace newlines with <br/> tags
    formatted = formatted.replace(/\n/g, '<br/>');
    
    // Handle paragraph breaks
    formatted = formatted.replace(/(<br\/>){2,}/g, '<br/><br/>');
    
    return formatted;
};  

export default function ChatWidget({continueFrom = null}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      content: '**Hello!** I\'m your TravelBond assistant. Ask me about:\n1- Destinations\n2- Itineraries\n3- Travel tips\n4- Packing advice'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const auth = getAuth();
  const { showAlert, showConfirmation } = useSweetAlert();
  const [continueConversation, setContinueConversation] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  // Check auth state on mount and when auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedConversation = sessionStorage.getItem('continueConversation');
      if (savedConversation) {
        try {
          const conversation = JSON.parse(savedConversation);
          
          // Set the full conversation history
          setMessages(conversation.messages);
          ChatbotController.setPreviousMessages(conversation.messages);
          setIsOpen(true);
          
          // Add context message
          setMessages(prev => [...prev, {
            sender: 'bot',
            content: "**Welcome back!** I remember our previous conversation. How can I help you continue?"
          }]);
          
          sessionStorage.removeItem('continueConversation');
        } catch (error) {
          console.error("Error parsing conversation:", error);
        }
      }
    };
    
    // Check on mount
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // Load conversation if continuing from a saved one
    if (continueFrom) {
      setMessages(continueFrom);
      setIsOpen(true);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, continueFrom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (isMinimized && !isOpen) setIsMinimized(false);
    if (!isOpen) setIsMaximized(false);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (isMaximized) setIsMinimized(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!userLoggedIn) {
      showAlert("Login Required", "Please login to chat with the assistant", "warning");
      return;
    }

    if (!message.trim()) return;

    const userMessage = { sender: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const botResponse = await ChatbotController.getTravelAdvice(message);
      setMessages(prev => [...prev, { sender: 'bot', content: botResponse }]);
    } catch (error) {
      console.error("Error getting travel advice:", error);
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        content: "**Error**: Sorry, I encountered a problem. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConversation = async () => {
    if (!auth.currentUser) {
      showAlert("Login Required", "Please login to save conversations", "info");
      return;
    }
    
    if (messages.length < 2) {
      showAlert("Not Enough Messages", "You need at least one exchange to save a conversation", "warning");
      return;
    }
    
    try {
      setSaveLoading(true);
      const savedConv = await SavedConversationService.saveConversation(
        auth.currentUser.uid, 
        messages
      );
      
      // Update UI immediately
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      
      // You could also emit an event to notify other components
      window.dispatchEvent(new Event('conversationSaved'));
      
    } catch (error) {
      console.error("Error saving conversation:", error);
      showAlert("Error", "Failed to save conversation: " + error.message, "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const clearConversation = async () => {
    const result = await showConfirmation(
      "Clear Conversation",
      "Are you sure you want to clear this conversation?",
      "warning",
      "Yes",
      "No",
    );
    
    if (result.isConfirmed) {
      setMessages([{
        sender: 'bot',
        content: '**Hello!** I\'m your TravelBond assistant. Ask me about:\n1- Destinations\n2- Itineraries\n3- Travel tips\n4- Packing advice'
      }]);
    }
  };

  return (
    <div className={`chat-widget-container ${isOpen ? "open" : ""} ${isMaximized ? "maximized" : ""}`}>
      {!isOpen ? (
        <Button 
          variant="primary" 
          className="chat-toggle-btn rounded-circle p-3"
          onClick={toggleChat}
        >
          <FontAwesomeIcon icon={faComment} size="lg" />
        </Button>
      ) : (
        <div className={`chat-window ${isMinimized ? "minimized" : ""} ${isMaximized ? "maximized" : ""}`}>
          <div className="chat-header d-flex justify-content-between align-items-center p-3">
            <h5 className="mb-0">TravelBond AI Assistant</h5>
            <div className="d-flex align-items-center">
              <Dropdown align="end">
                <Dropdown.Toggle 
                  variant="link" 
                  className="chat-control-btn text-dark p-0 px-2"
                >
                  <FontAwesomeIcon icon={faEllipsisV} />
                </Dropdown.Toggle>
                <Dropdown.Menu className="shadow-sm">
                  <Dropdown.Item 
                    onClick={handleSaveConversation}
                    disabled={isSaved || saveLoading || !userLoggedIn}
                    className="d-flex align-items-center"
                  >
                    {saveLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon 
                          icon={isSaved ? faSolidBookmark : faBookmark} 
                          className="me-2" 
                        />
                        {isSaved ? "Saved!" : "Save Conversation"}
                      </>
                    )}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={clearConversation} className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                    Clear Conversation
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Button 
                variant="link" 
                className="chat-control-btn text-dark p-0 px-2"
                onClick={() => setIsMinimized(!isMinimized)}
                disabled={isMaximized}
              >
                <FontAwesomeIcon icon={isMinimized ? faExpand : faMinus} />
              </Button>
              <Button 
                variant="link" 
                className="chat-control-btn text-dark p-0 px-2"
                onClick={toggleMaximize}
              >
                <FontAwesomeIcon icon={isMaximized ? faCompress : faExpand} />
              </Button>
              <Button 
                variant="link" 
                className="chat-control-btn text-dark p-0 ps-2"
                onClick={toggleChat}
              >
                <FontAwesomeIcon icon={faTimes} />
              </Button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              <div className="chat-messages p-3">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`message ${msg.sender === 'bot' ? 'bot-message' : 'user-message'} mb-2 p-3 rounded`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>
                ))}
                {isLoading && (
                  <div className="message bot-message mb-2 p-3 rounded">
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Thinking...
                  </div>
                )}
                {!userLoggedIn && (
                  <div className="message bot-message mb-2 p-3 rounded">
                    <Alert variant="warning" className="mb-0">
                      <FontAwesomeIcon icon={faUserLock} className="me-2" />
                      Please login to chat with the assistant
                    </Alert>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form className="chat-input-form p-3" onSubmit={handleSubmit}>
                <div className="input-group">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={userLoggedIn ? "Ask travel questions..." : "Login to chat..."}
                    disabled={isLoading || !userLoggedIn}
                    className="form-control rounded-start"
                  />
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={!message.trim() || isLoading || !userLoggedIn}
                    className="rounded-end"
                  >
                    {isLoading ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}