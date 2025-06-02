// Sidebar.js
import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faTachometerAlt, 
  faUsers, 
  faCalendar, 
  faEnvelope, 
  faUser, 
  faSignOutAlt,
  faChartBar,
  faBookmark,
  faSignInAlt,
  faUserPlus
} from "@fortawesome/free-solid-svg-icons";
import { NavLink, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./sidebar.css";
import useSweetAlert from "../../../hooks/useSweetAlert";

export default function Sidebar({ isOpen, toggleSidebar, unreadCount }) {
  const location = useLocation();
  const auth = getAuth();
  const { showAlert, showConfirmation } = useSweetAlert();
  const [userRole, setUserRole] = useState("user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        const role = localStorage.getItem("role") || "user";
        setUserRole(role);
      } else {
        setUserRole("user");
      }
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggleSidebar();
      }
    };

    // Add when the component mounts
    document.addEventListener("mousedown", handleClickOutside);
    
    // Return function to be called when unmounted
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, toggleSidebar]);

  const handleLogout = async () => {
    try {
      const result = await showConfirmation(
        'Are you sure?',
        'You will be logged out of your account',
        'warning',
        'Yes, log me out',
        'Cancel'
      );

      if (result.isConfirmed) {
        await signOut(auth);
        localStorage.clear();
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      showAlert(
        'Logout Failed',
        error.message,
        'error',
        'OK'
      );
    }
  };

  const handleChatNavigation = (e) => {
    e.preventDefault();
    const userId = JSON.parse(localStorage.getItem("userData"))?.id;
    if (!userId) {
      showAlert(
        'Error',
        'You need to be logged in to access chat',
        'error',
        'OK'
      );
      return;
    }
    window.location.href = "/chat";
    toggleSidebar();
  };

  const getAuthButton = () => {
    if (isLoggedIn) {
      return (
        <button className="nav-link" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Logout
        </button>
      );
    } else {
      if (location.pathname === "/login") {
        return (
          <NavLink 
            to="/register" 
            className="nav-link" 
            onClick={toggleSidebar}
          >
            <FontAwesomeIcon icon={faUserPlus} className="me-2" /> Register
          </NavLink>
        );
      } else {
        return (
          <NavLink 
            to="/login" 
            className="nav-link" 
            onClick={toggleSidebar}
          >
            <FontAwesomeIcon icon={faSignInAlt} className="me-2" /> Login
          </NavLink>
        );
      }
    }
  };

  return (
    <div className={`sidebar ${isOpen ? "open shadow-lg" : ""}`} ref={sidebarRef}>
      {/* Close Button for Sidebar */}
      <button className="btn side-close w-100" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faTimes} size="lg" />
      </button>

      {/* Sidebar Links */}
      <div className="sidebar-links w-100">
          <>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                isActive ? "nav-link active" : "nav-link"
              } 
              onClick={toggleSidebar}
            >
              <FontAwesomeIcon icon={faTachometerAlt} className="me-2" /> Dashboard
            </NavLink>

            <NavLink 
              to="/events" 
              className={({ isActive }) => 
                isActive ? "nav-link active" : "nav-link"
              } 
              onClick={toggleSidebar}
            >
              <FontAwesomeIcon icon={faCalendar} className="me-2" /> Events
            </NavLink>

            <NavLink 
              to="/groups" 
              className={({ isActive }) => 
                isActive ? "nav-link active" : "nav-link"
              } 
              onClick={toggleSidebar}
            >
              <FontAwesomeIcon icon={faUsers} className="me-2" /> Groups
            </NavLink>

            <button 
              className="nav-link" 
              onClick={handleChatNavigation}
            >
              <div className="position-relative">
                <FontAwesomeIcon icon={faEnvelope} className="me-2" /> Chat
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </button>

            {userRole === "admin" && (
              <NavLink 
                to="/reports" 
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                } 
                onClick={toggleSidebar}
              >
                <FontAwesomeIcon icon={faChartBar} className="me-2" /> Reports
              </NavLink>
            )}

            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                isActive ? "nav-link active" : "nav-link"
              } 
              onClick={toggleSidebar}
            >
              <FontAwesomeIcon icon={faUser} className="me-2" /> Profile
            </NavLink>

            <NavLink 
              to="/saved-conversations" 
              className={({ isActive }) => 
                isActive ? "nav-link active" : "nav-link"
              } 
              onClick={toggleSidebar}
            >
              <FontAwesomeIcon icon={faBookmark} className="me-2" /> Saved Chats
            </NavLink>
            <hr />
          </>
        
        
        {/* Authentication Button (Login/Register/Logout) */}
        {getAuthButton()}
      </div>
    </div>
  );
}