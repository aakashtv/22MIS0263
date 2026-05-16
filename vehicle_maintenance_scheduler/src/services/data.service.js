const apiClient = require('../utils/axios.client');
const authService = require('./auth.service');
const { Log } = require('logging_middleware');

class DataService {
  async fetchDepots() {
    await authService.ensureAuthenticated();
    await Log('', 'INFO', 'data-service', 'Fetching depots data...');
    try {
      const response = await apiClient.get('/depots');
      return response.data.depots; 
    } catch (error) {
      await Log(error.stack, 'ERROR', 'data-service', 'Failed to fetch depots');
      throw new Error('Could not fetch depot data from external service');
    }
  }

  async fetchTasks() {
    await authService.ensureAuthenticated();
    await Log('', 'INFO', 'data-service', 'Fetching tasks data...');
    try {
      const response = await apiClient.get('/tasks');
      return response.data.tasks;
    } catch (error) {
      await Log(error.stack, 'ERROR', 'data-service', 'Failed to fetch tasks');
      throw new Error('Could not fetch task data from external service');
    }
  }
}

module.exports = new DataService();
