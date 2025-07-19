import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from "./Home";
import Team from "./Team";
import Dashboard from "./components/Dashboard";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Blog from "./components/Blog";
import PublicProfile from "./components/PublicProfile";
import PublicProfilesList from "./components/PublicProfilesList";
import AdminDashboard from "./components/Admin/AdminDashboard";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AssetsMarketplace from "./components/Marketplace/AssetsMarketplace";
import AssetUpload from "./components/Marketplace/AssetUpload";
import Freelance from "./components/Freelance";
import Login from "./Login";
import APIDebugger from "./components/APIDebugger";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <APIDebugger />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/team" element={<Team />} />
            <Route path="/members" element={<PublicProfilesList />} />
            <Route path="/profile/:username" element={<PublicProfile />} />
            <Route path="/marketplace" element={<AssetsMarketplace />} />
            <Route path="/freelance" element={<Freelance />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload-asset"
              element={
                <ProtectedRoute>
                  <AssetUpload />
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
        </Layout>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;