import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RulesList from "./pages/RulesList";
import RuleBuilder from "./pages/RuleBuilder";
import RuleTemplates from "./pages/RuleTemplates";
import Stages from "./pages/Stages";
import Scorecards from "./pages/Scorecards";
import Grids from "./pages/Grids";
import RiskBands from "./pages/RiskBands";
import EvaluationConsole from "./pages/EvaluationConsole";
import BulkEvaluation from "./pages/BulkEvaluation";
import AuditLogs from "./pages/AuditLogs";
import Products from "./pages/Products";
import UserManagement from "./pages/UserManagement";

// Protected Route Component
const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Route - Login */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rules" 
        element={
          <ProtectedRoute>
            <Layout><RulesList /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rules/new" 
        element={
          <ProtectedRoute requiredPermission="can_create_rules">
            <Layout><RuleBuilder /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rules/:id" 
        element={
          <ProtectedRoute>
            <Layout><RuleBuilder /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/rules/:id/edit" 
        element={
          <ProtectedRoute requiredPermission="can_edit_rules">
            <Layout><RuleBuilder /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/templates" 
        element={
          <ProtectedRoute>
            <Layout><RuleTemplates /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/stages" 
        element={
          <ProtectedRoute>
            <Layout><Stages /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/scorecards" 
        element={
          <ProtectedRoute>
            <Layout><Scorecards /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/grids" 
        element={
          <ProtectedRoute>
            <Layout><Grids /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/risk-bands" 
        element={
          <ProtectedRoute>
            <Layout><RiskBands /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/evaluate" 
        element={
          <ProtectedRoute>
            <Layout><EvaluationConsole /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bulk-evaluate" 
        element={
          <ProtectedRoute>
            <Layout><BulkEvaluation /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/audit" 
        element={
          <ProtectedRoute requiredPermission="can_view_audit">
            <Layout><AuditLogs /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <Layout><Products /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requiredPermission="can_manage_users">
            <Layout><UserManagement /></Layout>
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App" data-testid="app-root">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
