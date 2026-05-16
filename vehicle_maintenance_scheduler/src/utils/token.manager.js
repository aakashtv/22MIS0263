const { Log } = require('logging_middleware');

class TokenManager {
  constructor() {
    this.token = null;
    this.expiresAt = null;
  }

  setToken(tokenStr, expiresInSeconds) {
    this.token = tokenStr;
    // Preemptively expire 5 seconds early to be safe
    this.expiresAt = Date.now() + (expiresInSeconds - 5) * 1000;
  }

  getToken() {
    return this.token;
  }

  isTokenValid() {
    return this.token && this.expiresAt && Date.now() < this.expiresAt;
  }

  clearToken() {
    this.token = null;
    this.expiresAt = null;
  }
}

// Export as a singleton
module.exports = new TokenManager();
