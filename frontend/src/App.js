import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthContext';
import { NotificationProvider } from './components/common/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { FollowProvider } from './contexts/FollowContext';
import NotificationContainer from './components/common/NotificationContainer';
import ToastNotifications from './components/ToastNotifications';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Home from "./Home";
import Login from "./Login";

// Lazy load components for better performance
const Team = React.lazy(() => import("./Team"));
const Profile = React.lazy(() => import("./components/Profile"));
const Dashboard = React.lazy(() => import("./components/Dashboard"));
const Services = React.lazy(() => import("./components/Services"));
const Portfolio = React.lazy(() => import("./components/Portfolio"));
const Blog = React.lazy(() => import("./components/Blog"));
const About = React.lazy(() => import("./components/About"));
const PublicProfile = React.lazy(() => import("./components/PublicProfile"));
const AdminDashboard = React.lazy(() => import("./components/Admin/AdminDashboard"));
const AssetsMarketplace = React.lazy(() => import("./components/Marketplace/AssetsMarketplace"));
const Freelance = React.lazy(() => import("./components/Freelance"));
const Creators = React.lazy(() => import("./components/Creators"));
const SearchResults = React.lazy(() => import("./components/SearchResults"));
const Settings = React.lazy(() => import("./components/Settings"));
const Messages = React.lazy(() => import("./components/Messages/Messages"));
const Notifications = React.lazy(() => import("./components/Notifications"));
const ChatExample = React.lazy(() => import("./components/Chat/ChatExample"));
const CreatePost = React.lazy(() => import("./components/Create/CreatePost"));
const CreateBlog = React.lazy(() => import("./components/Create/CreateBlog"));
const UploadWork = React.lazy(() => import("./components/Create/UploadWork"));
const CreateProject = React.lazy(() => import("./components/Create/CreateProject"));
const Explore = React.lazy(() => import("./components/Explore"));
const Signup = React.lazy(() => import("./components/Signup"));

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <WebSocketProvider>
            <FollowProvider>
              <BrowserRouter>
                <Layout>
                  <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
                      <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/team" element={<Team />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/profile/:username" element={<PublicProfile />} />
            <Route path="/marketplace" element={<AssetsMarketplace />} />
            <Route path="/freelance" element={<Freelance />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat-demo"
              element={
                <ProtectedRoute>
                  <ChatExample />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            
            {/* Content Creation Routes */}
            <Route
              path="/create/post"
              element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create/blog"
              element={
                <ProtectedRoute>
                  <CreateBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create/upload-work"
              element={
                <ProtectedRoute>
                  <UploadWork />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create/project"
              element={
                <ProtectedRoute>
                  <CreateProject />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload-asset"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireStaff={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all route for 404 - redirect to home */}
            <Route path="*" element={<Home />} />
          </Routes>
            </Suspense>
          </Layout>
          <NotificationContainer />
          <ToastNotifications />
        </BrowserRouter>
            </FollowProvider>
          </WebSocketProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;