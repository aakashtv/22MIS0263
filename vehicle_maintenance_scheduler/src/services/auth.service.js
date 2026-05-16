const apiClient = require('../utils/axios.client');
const tokenManager = require('../utils/token.manager');
const apiConfig = require('../config/api.config');
const { Log } = require('logging_middleware');

class AuthService {
  /**
   * Register with the external API if needed
   */
  async register() {
    try {
      await Log('', 'INFO', 'auth-service', 'Attempting registration...');
      const response = await apiClient.post('/register', {
        email: apiConfig.credentials.email,
        rollNo: apiConfig.credentials.rollNo,
      });
      await Log('', 'INFO', 'auth-service', 'Registration successful');
      return response.data;
    } catch (error) {
      await Log('', 'ERROR', 'auth-service', 'Registration failed');
      throw error;
    }
  }

  /**
   * Authenticate and retrieve Bearer token
   */
  async authenticate() {
    // Return early if we already have a valid token
    if (tokenManager.isTokenValid()) {
      await Log('', 'DEBUG', 'auth-service', 'Using existing valid token');
      return tokenManager.getToken();
    }

    try {
      await Log('', 'INFO', 'auth-service', 'Fetching new access token...');
      const response = await apiClient.post('/auth', {
        clientID: apiConfig.credentials.clientID,
        clientSecret: apiConfig.credentials.clientSecret,
      });

      const { token, expiresIn = 3600 } = response.data; // Default to 1 hour if not provided
      tokenManager.setToken(token, expiresIn);
      
      await Log('', 'INFO', 'auth-service', 'Authentication successful, token cached.');
      return token;
    } catch (error) {
      await Log('', 'ERROR', 'auth-service', 'Authentication failed');
      throw error;
    }
  }

  /**
   * Helper to ensure valid token is present before external calls
   */
  async ensureAuthenticated() {
    if (!tokenManager.isTokenValid()) {
      await this.authenticate();
    }
  }
}

module.exports = new AuthService();
