const { Log } = require('logging_middleware');

class AllocatorService {
  /**
   * Optimizes task allocation using 0/1 Knapsack Dynamic Programming
   * @param {number} maxHours - Available mechanic hours (capacity)
   * @param {Array} tasks - Array of tasks { taskId, duration, impact }
   * @returns {Object} Optimized scheduling result
   */
  optimizeForDepot(maxHours, tasks) {
    if (!maxHours || maxHours <= 0) {
      return { totalImpact: 0, totalDuration: 0, selectedTasks: [] };
    }
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return { totalImpact: 0, totalDuration: 0, selectedTasks: [] };
    }

    const n = tasks.length;
    // DP Table initialized
    const dp = Array(n + 1).fill(null).map(() => Array(maxHours + 1).fill(0));

    // Build DP table bottom-up
    for (let i = 1; i <= n; i++) {
      const currentTask = tasks[i - 1];
      const w = currentTask.duration;
      const v = currentTask.impact;

      for (let capacity = 1; capacity <= maxHours; capacity++) {
        if (w <= capacity) {
          dp[i][capacity] = Math.max(dp[i - 1][capacity], dp[i - 1][capacity - w] + v);
        } else {
          dp[i][capacity] = dp[i - 1][capacity];
        }
      }
    }

    // Backtrack to extract the actual tasks selected
    const selectedTasks = [];
    let currentCapacity = maxHours;
    let totalImpact = dp[n][maxHours];
    let totalDuration = 0;

    for (let i = n; i > 0 && totalImpact > 0; i--) {
      // If impact came from this task being included
      if (dp[i][currentCapacity] !== dp[i - 1][currentCapacity]) {
        const task = tasks[i - 1];
        selectedTasks.push(task);
        totalDuration += task.duration;
        totalImpact -= task.impact;
        currentCapacity -= task.duration;
      }
    }

    return {
      totalImpact: dp[n][maxHours],
      totalDuration,
      selectedTasks: selectedTasks.reverse() // Keep original relative order
    };
  }

  async runDepotWiseOptimization(depots, tasks) {
    await Log('', 'INFO', 'allocator-service', 'Starting depot-wise Knapsack optimization');
    
    // Process each depot with the DP algorithm
    const results = depots.map(depot => {
      const optimization = this.optimizeForDepot(depot.mechanicHours, tasks);
      return {
        depotId: depot.depotId,
        mechanicHoursAvailable: depot.mechanicHours,
        allocatedDuration: optimization.totalDuration,
        impactScore: optimization.totalImpact,
        tasks: optimization.selectedTasks
      };
    });

    return results;
  }
}

module.exports = new AllocatorService();
