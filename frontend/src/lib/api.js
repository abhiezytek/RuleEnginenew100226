import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
  }
};

// Initialize token from localStorage
const storedToken = localStorage.getItem('authToken');
if (storedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

// Convert snake_case to camelCase for requests
const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const convertKeys = (obj, converter) => {
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeys(item, converter));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[converter(key)] = convertKeys(obj[key], converter);
      return acc;
    }, {});
  }
  return obj;
};

// Request interceptor - log requests
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle 401 - only redirect for auth/me endpoint (token validation)
    // For other endpoints, just show the error and let the component handle it
    if (error.response?.status === 401) {
      const isAuthMeEndpoint = error.config?.url?.includes('/auth/me');
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');
      
      // Only auto-redirect if it's the auth/me check failing (token expired/invalid)
      // Don't redirect for login failures or other API calls
      if (isAuthMeEndpoint && !isLoginEndpoint) {
        setAuthToken(null);
        localStorage.removeItem('authUser');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      // For other 401 errors, just log and let the error propagate
      // The component can show appropriate error message
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const login = (username, password) => api.post('/auth/login', { username, password });
export const getCurrentUser = () => api.get('/auth/me');
export const changePassword = (currentPassword, newPassword) => 
  api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword });

// ==================== USER MANAGEMENT API ====================
export const getUsers = () => api.get('/users');
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const resetUserPassword = (id, newPassword) => 
  api.post(`/users/${id}/reset-password?new_password=${encodeURIComponent(newPassword)}`);

// ==================== RULE TEMPLATES API ====================
export const getRuleTemplates = (params) => api.get('/templates', { params });
export const getRuleTemplate = (id) => api.get(`/templates/${id}`);
export const createRuleFromTemplate = (templateId, stageId) => 
  api.post(`/templates/${templateId}/create-rule${stageId ? `?stage_id=${stageId}` : ''}`);
export const getTemplateCategories = () => api.get('/templates/categories/list');

// Health & Dashboard
export const healthCheck = () => api.get('/health');
export const getDashboardStats = () => api.get('/dashboard/stats');

// Rules API
export const getRules = (params) => api.get('/rules', { params });
export const getRule = (id) => api.get(`/rules/${id}`);
export const createRule = (data) => api.post('/rules', data);
export const updateRule = (id, data) => api.put(`/rules/${id}`, data);
export const deleteRule = (id) => api.delete(`/rules/${id}`);
export const toggleRule = (id) => api.patch(`/rules/${id}/toggle`);

// Scorecards API
export const getScorecards = (params) => api.get('/scorecards', { params });
export const getScorecard = (id) => api.get(`/scorecards/${id}`);
export const createScorecard = (data) => api.post('/scorecards', data);
export const updateScorecard = (id, data) => api.put(`/scorecards/${id}`, data);
export const deleteScorecard = (id) => api.delete(`/scorecards/${id}`);

// Grids API
export const getGrids = (params) => api.get('/grids', { params });
export const getGrid = (id) => api.get(`/grids/${id}`);
export const createGrid = (data) => api.post('/grids', data);
export const updateGrid = (id, data) => api.put(`/grids/${id}`, data);
export const deleteGrid = (id) => api.delete(`/grids/${id}`);

// Products API
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Stages API
export const getStages = () => api.get('/stages');
export const getStage = (id) => api.get(`/stages/${id}`);
export const createStage = (data) => api.post('/stages', data);
export const updateStage = (id, data) => api.put(`/stages/${id}`, data);
export const deleteStage = (id) => api.delete(`/stages/${id}`);
export const toggleStage = (id) => api.patch(`/stages/${id}/toggle`);
export const getRulesByStage = (stageId) => api.get(`/stages/${stageId}/rules`);

// Risk Bands API
export const getRiskBands = (category) => api.get('/risk-bands', { params: { category } });
export const getRiskBand = (id) => api.get(`/risk-bands/${id}`);
export const createRiskBand = (data) => api.post('/risk-bands', data);
export const updateRiskBand = (id, data) => api.put(`/risk-bands/${id}`, data);
export const deleteRiskBand = (id) => api.delete(`/risk-bands/${id}`);
export const toggleRiskBand = (id) => api.patch(`/risk-bands/${id}/toggle`);

// Underwriting Evaluation API
export const evaluateProposal = (data) => api.post('/underwriting/evaluate', data);

// Evaluations History API
export const getEvaluations = (params) => api.get('/evaluations', { params });
export const getEvaluation = (id) => api.get(`/evaluations/${id}`);

// Audit Logs API
export const getAuditLogs = (params) => api.get('/audit-logs', { params });

// Seed Data API
export const seedData = () => api.post('/seed');

export default api;
