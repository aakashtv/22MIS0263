const axios = require('axios');
const apiConfig = require('../config/api.config');
const tokenManager = require('./token.manager');
const { Log } = require('logging_middleware');

const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  timeout: 10000,
});

// Request interceptor to inject Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    // Inject token if valid and not already set
    if (tokenManager.isTokenValid()) {
      config.headers['Authorization'] = `Bearer ${tokenManager.getToken()}`;
    }
    await Log('', 'DEBUG', 'axios-client', `Outgoing request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for structured error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response ? error.response.status : null;
    const url = error.config ? error.config.url : 'Unknown URL';
    await Log(error.stack, 'ERROR', 'axios-client', `API call failed: ${url} with status ${status}`);
    
    // Auto-clear token on 401 Unauthorized
    if (status === 401) {
      tokenManager.clearToken();
      await Log('', 'WARN', 'axios-client', 'Token invalidated due to 401 response.');
    }
    return Promise.reject(error);
  }
);

module.exports = apiClient;
