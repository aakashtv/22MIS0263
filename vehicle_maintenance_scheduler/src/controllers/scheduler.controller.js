const dataService = require('../services/data.service');
const allocatorService = require('../services/allocator.service');
const { Log } = require('logging_middleware');

class SchedulerController {
  async optimizeSchedule(req, res, next) {
    try {
      await Log('', 'INFO', 'scheduler-controller', 'Received optimization request');

      // 1. Fetch data from external APIs
      const depots = await dataService.fetchDepots();
      const tasks = await dataService.fetchTasks();

      // 2. Validate fetched data gracefully
      if (!depots || !Array.isArray(depots)) {
         return res.status(502).json({ error: 'Invalid depot data received from external API' });
      }

      // 3. Run Optimization DP algorithm
      const optimizedSchedule = await allocatorService.runDepotWiseOptimization(depots, tasks);

      // 4. Return formatted JSON response
      return res.status(200).json({
        success: true,
        message: 'Schedule optimized successfully using Knapsack DP',
        data: optimizedSchedule
      });
    } catch (error) {
      await Log(error.stack, 'ERROR', 'scheduler-controller', 'Failed to optimize schedule');
      next(error);
    }
  }
}

module.exports = new SchedulerController();
