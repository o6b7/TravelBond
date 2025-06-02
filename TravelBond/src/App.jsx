// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Header from "./views/components/Header/Header";
// import Sidebar from "./views/components/Sidebar/Sidebar";
// import Dashboard from "./views/pages/Dashboard/Dashboard";
// import Events from "./views/pages/Events/Events";
// import Footer from "./views/components/Footer/Footer";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "./App.css";
// import NewEvent from "./views/pages/Events/newEvent";
// import Groups from "./views/pages/Groups/Groups";
// import NewGroup from "./views/pages/Groups/NewGroup";

// export default function App() {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   return (
//     <Router>
//       <div className="app">
//         <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
//         <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
//         <div className="main-content">
//           <Routes>
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/events" element={<Events />} />
//             <Route path="/events/new" element={<NewEvent />} />
//             <Route path="/groups" element={<Groups />} />
//             <Route path="/groups/new" element={<NewGroup />} />
//             <Route path="/inbox" element={<Dashboard />} />
//             <Route path="/profile" element={<Dashboard />} />
//           </Routes>
//         </div>
//         <Footer />
//       </div>
//     </Router>
//   );
// }

// import React, { useState, useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Header from "./views/components/Header/Header";
// import Sidebar from "./views/components/Sidebar/Sidebar";
// import Dashboard from "./views/pages/Dashboard/Dashboard";
// import Events from "./views/pages/Events/Events";
// import Footer from "./views/components/Footer/Footer";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "./App.css";
// import Groups from "./views/pages/Groups/Groups";
// import Login from "./views/pages/Auth/Login";
// import Register from "./views/pages/Auth/Register";
// import ProtectedRoute from "./utils/ProtectedRoute";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import Profile from "./views/pages/Profile/Profile";
// import { COLORS } from "./utils/config";
// import ViewGroup from "./views/pages/Groups/ViewGroup";
// import ViewDiscussion from "./views/pages/Groups/ViewDiscussion";
// import ViewEvent from "./views/pages/Events/ViewEvent"; // Import the ViewEvent component
// import FilteredData from "./views/pages/FilteredData/FilteredData";
// import Reports from "./views/pages/Reports/Reports";
// import ProfileView from "./views/pages/Profile/ProfileView";
// import ChatPage from "./views/pages/Chat/ChatPage";
// import ChatWidget from "./views/components/ChatWidget/ChatWidget";
// import SavedConversations from "./views/pages/Chatbot/SavedConversations";
// import ViewChatbotConversation from "./views/pages/Chatbot/ViewChatbotConversation";
// import PostView from "./views/components/ProfileComponents/PostCard/PostView";
// import LoadingComponent from "./views/components/Common/LoadingComponent/LoadingComponent";
// import CreateForm from "./views/pages/CreateForm/CreateForm";

// export default function App() {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [isAuthChecked, setIsAuthChecked] = useState(false);

//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setIsAuthChecked(true);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Inject CSS variables
//   useEffect(() => {
//     const root = document.documentElement;
//     root.style.setProperty("--identity-color", COLORS.identity);
//     root.style.setProperty("--primary-color", COLORS.primary);
//     root.style.setProperty("--secondary-color", COLORS.secondary);
//     root.style.setProperty("--success-color", COLORS.success);
//     root.style.setProperty("--danger-color", COLORS.danger);
//   }, []);

//   if (!isAuthChecked) {
//     return <LoadingComponent/>;
//   }

//   return (
//     <Router>
//       <div className="app">
//         <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
//         <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
//         <div className="main-content">
//           <Routes>
//             <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//             <Route
//               path="/dashboard"
//               element={
//                 <ProtectedRoute>
//                   <Dashboard />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/reports"
//               element={
//                 <ProtectedRoute>
//                   <Reports />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/filtered-data"
//               element={
//                 <ProtectedRoute>
//                   <FilteredData />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/events"
//               element={
//                 <ProtectedRoute>
//                   <Events />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/events/new"
//               element={
//                 <ProtectedRoute>
//                   <CreateForm />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/events/:eventId" // Add route for ViewEvent
//               element={
//                 <ProtectedRoute>
//                   <ViewEvent />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/groups"
//               element={
//                 <ProtectedRoute>
//                   <Groups />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/groups/new"
//               element={
//                 <ProtectedRoute>
//                   <CreateForm />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/groups/:groupId"
//               element={
//                 <ProtectedRoute>
//                   <ViewGroup />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/groups/:groupId/discussions/:discussionId"
//               element={
//                 <ProtectedRoute>
//                   <ViewDiscussion />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/chat"
//               element={
//                 <ProtectedRoute>
//                   <ChatPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/chat/:conversationId"
//               element={
//                 <ProtectedRoute>
//                   <ChatPage />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/saved-conversations"
//               element={
//                 <ProtectedRoute>
//                   <SavedConversations />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/chatbot-conversation/:conversationId"
//               element={
//                 <ProtectedRoute>
//                   <ViewChatbotConversation />
//                 </ProtectedRoute>
//               }
//             />

//             <Route
//               path="/profile"
//               element={
//                 <ProtectedRoute>
//                   <Profile />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/profile/:userId"
//               element={
//                 <ProtectedRoute>
//                   <ProfileView />
//                 </ProtectedRoute>
//               }
//             />
//             <Route
//               path="/posts/:postId"
//               element={
//                 <ProtectedRoute>
//                   <PostView /> 
//                 </ProtectedRoute>
//               }
//             />
//           </Routes>

//         </div>
//         <Footer />
//         <ChatWidget />
//       </div>
//     </Router>
//   );
// }


import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./views/components/Header/Header";
import Sidebar from "./views/components/Sidebar/Sidebar";
import Dashboard from "./views/pages/Dashboard/Dashboard";
import Events from "./views/pages/Events/Events";
import Footer from "./views/components/Footer/Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Groups from "./views/pages/Groups/Groups";
import Login from "./views/pages/Auth/Login";
import Register from "./views/pages/Auth/Register";
import ProtectedRoute from "./utils/ProtectedRoute";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Profile from "./views/pages/Profile/Profile";
import { COLORS } from "./utils/config";
import ViewGroup from "./views/pages/Groups/ViewGroup";
import ViewDiscussion from "./views/pages/Groups/ViewDiscussion";
import ViewEvent from "./views/pages/Events/ViewEvent";
import FilteredData from "./views/pages/FilteredData/FilteredData";
import Reports from "./views/pages/Reports/Reports";
import ProfileView from "./views/pages/Profile/ProfileView";
import ChatPage from "./views/pages/Chat/ChatPage";
import ChatWidget from "./views/components/ChatWidget/ChatWidget";
import SavedConversations from "./views/pages/Chatbot/SavedConversations";
import ViewChatbotConversation from "./views/pages/Chatbot/ViewChatbotConversation";
import PostView from "./views/components/ProfileComponents/PostCard/PostView";
import LoadingComponent from "./views/components/Common/LoadingComponent/LoadingComponent";
import CreateForm from "./views/pages/CreateForm/CreateForm";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // Inject CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--identity-color", COLORS.identity);
    root.style.setProperty("--primary-color", COLORS.primary);
    root.style.setProperty("--secondary-color", COLORS.secondary);
    root.style.setProperty("--success-color", COLORS.success);
    root.style.setProperty("--danger-color", COLORS.danger);
  }, []);

  return (
    <Router>
      <div className="app">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/filtered-data" element={<FilteredData />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventId" element={<ViewEvent />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:groupId" element={<ViewGroup />} />

            {/* Protected routes */}
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/new"
              element={
                <ProtectedRoute>
                  <CreateForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/new"
              element={
                <ProtectedRoute>
                  <CreateForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId/discussions/:discussionId"
              element={
                <ProtectedRoute>
                  <ViewDiscussion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:conversationId"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-conversations"
              element={
                <ProtectedRoute>
                  <SavedConversations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chatbot-conversation/:conversationId"
              element={
                <ProtectedRoute>
                  <ViewChatbotConversation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/posts/:postId"
              element={
                <ProtectedRoute>
                  <PostView /> 
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
        <ChatWidget />
      </div>
    </Router>
  );
}