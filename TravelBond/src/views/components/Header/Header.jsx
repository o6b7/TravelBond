import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBars, faUser, faEnvelope, faUsers, faCalendar, 
  faTachometerAlt, faSignOutAlt, faSearch, faTimes,
  faChartBar,
  faBookmark
} from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../utils/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "./header.css";
import useSweetAlert from "../../../hooks/useSweetAlert"; // Import the custom hook

export default function Header({ toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [unreadCount, setUnreadCount] = useState(0);
  const [localSearchQuery, setLocalSearchQuery] = useState(""); 
  const searchRef = useRef(null);
  const auth = getAuth();
  const { showAlert, showConfirmation } = useSweetAlert(); // Initialize the hook

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
        // Clear all local storage items
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

  const navItems = React.useMemo(() => {
    const isLoggedIn = !!auth.currentUser;
    const currentPath = location.pathname;
  
    const baseItems = [
      { path: "/dashboard", title: "Dashboard", icon: faTachometerAlt },
      { path: "/events", title: "Events", icon: faCalendar },
      { path: "/groups", title: "Groups", icon: faUsers },
      { path: "/chat", title: "Chat", icon: faEnvelope},
      { path: "/profile", title: "Profile", icon: faUser },
      { path: "/saved-conversations", title: "Saved Chats", icon: faBookmark },
    ];
  
    // Show admin-only Reports
    if (isLoggedIn && userRole === "admin") {
      baseItems.push({ path: "/reports", title: "Reports", icon: faChartBar });
    }
  
    // Append authentication buttons
    if (isLoggedIn) {
      baseItems.push({
        path: "/logout",
        title: "Logout",
        icon: faSignOutAlt,
        customAction: handleLogout,
      });
    } else {
      if (currentPath === "/login") {
        baseItems.push({ path: "/register", title: "Register", icon: faUser });
      } else if (currentPath === "/register") {
        baseItems.push({ path: "/login", title: "Login", icon: faUser });
      } else {
        baseItems.push({ path: "/login", title: "Login", icon: faUser });
      }
    }
  
    return baseItems;
  }, [auth.currentUser, userRole, location.pathname]);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
    if (isSearchOpen) {
      searchRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const userId = JSON.parse(localStorage.getItem("userData"))?.id;
    if (!userId) return;

    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let totalUnread = 0;
      querySnapshot.forEach((doc) => {
        const conversation = doc.data();
        totalUnread += conversation.unreadCount?.[userId] || 0;
      });
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!localSearchQuery.trim()) {
      showAlert(
        'Empty Search',
        'Please enter something to search for',
        'warning',
        'OK'
      );
      return;
    }
    
    navigate("/filtered-data", {
      state: {
        query: localSearchQuery
      }
    });
    
    setLocalSearchQuery("");
    setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-custom">
      <div className="container-fluid">
        <div className="d-flex d-lg-none align-items-center">
          <button 
            className="navbar-toggler me-2" 
            type="button" 
            onClick={toggleSidebar}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <button 
            className="btn btn-link text-white p-2" 
            onClick={toggleSearch}
          >
            <FontAwesomeIcon icon={faSearch} size="lg" />
          </button>
        </div>

        <Link className="navbar-brand mx-auto mx-lg-0" to="/dashboard">
          TravelBond
        </Link>

        <button 
          className="btn btn-link text-white p-2 d-none d-lg-block me-3" 
          onClick={toggleSearch}
        >
          <FontAwesomeIcon icon={faSearch} size="lg" />
        </button>

        <div className={`search-container ${isSearchOpen ? "open" : ""}`}>
          <form className="search-form" onSubmit={handleSearch}>
            <div className="input-group">
              <input
                ref={searchRef}
                type="text"
                className="form-control"
                placeholder="Search events, groups, users..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="btn btn-outline-light" type="submit">
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <button 
                className="btn btn-outline-light" 
                type="button" 
                onClick={toggleSearch}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </form>
        </div>

        <div className={`collapse navbar-collapse ${isNavOpen ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                {item.customAction ? (
                  <button 
                    className={`nav-link ${
                      item.path === "/chat" && location.pathname.startsWith("/chatbot-conversation")
                        ? ""
                        : location.pathname.startsWith(item.path)
                          ? "active"
                          : ""
                    }`}
                    onClick={item.customAction}
                  >
                    {item.path === "/chat" ? (
                      <div className="position-relative">
                        <FontAwesomeIcon icon={item.icon} className="me-2" />
                        {item.title}
                        {unreadCount > 0 && (
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={item.icon} className="me-2" />
                        {item.title}
                      </>
                    )}
                  </button>
                ) : (
                  <Link 
                    className={`nav-link ${(location.pathname === item.path || location.pathname.startsWith('/chatbot-conversation')) && item.path === '/saved-conversations' ? "active" : location.pathname === item.path ? "active" : ""}`} 
                    to={item.path}
                  >
                    <FontAwesomeIcon icon={item.icon} className="me-2" />
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}