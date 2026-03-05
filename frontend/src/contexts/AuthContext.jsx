import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken, getCurrentUser } from '../lib/api';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  can_create_rules: 'can_create_rules',
  can_edit_rules: 'can_edit_rules',
  can_delete_rules: 'can_delete_rules',
  can_manage_users: 'can_manage_users',
  can_view_rules: 'can_view_rules',
  can_evaluate: 'can_evaluate',
  can_view_audit: 'can_view_audit',
  can_seed_data: 'can_seed_data',
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    can_create_rules: true,
    can_edit_rules: true,
    can_delete_rules: true,
    can_manage_users: true,
    can_view_rules: true,
    can_evaluate: true,
    can_view_audit: true,
    can_seed_data: true,
  },
  [ROLES.MANAGER]: {
    can_create_rules: true,
    can_edit_rules: true,
    can_delete_rules: true,
    can_manage_users: false,
    can_view_rules: true,
    can_evaluate: true,
    can_view_audit: true,
    can_seed_data: false,
  },
  [ROLES.VIEWER]: {
    can_create_rules: false,
    can_edit_rules: false,
    can_delete_rules: false,
    can_manage_users: false,
    can_view_rules: true,
    can_evaluate: true,
    can_view_audit: false,
    can_seed_data: false,
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (token && storedUser) {
      try {
        setAuthToken(token);
        // Verify token is still valid
        const response = await getCurrentUser();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const loginUser = (token, userData) => {
    setAuthToken(token);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('authUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    return ROLE_PERMISSIONS[user.role]?.[permission] || false;
  };

  const isAdmin = () => user?.role === ROLES.ADMIN;
  const isManager = () => user?.role === ROLES.MANAGER;
  const isViewer = () => user?.role === ROLES.VIEWER;

  const value = {
    user,
    loading,
    isAuthenticated,
    loginUser,
    logout,
    hasPermission,
    isAdmin,
    isManager,
    isViewer,
    ROLES,
    PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
