require('dotenv').config();
const express = require('express');
const apiConfig = require('./config/api.config');
const { Log } = require('logging_middleware');
const schedulerRoutes = require('./routes/scheduler.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Scheduler Service is running' });
});

// API Routes
app.use('/api/scheduler', schedulerRoutes);

// Global Error Handling Middleware (must be registered last)
app.use(errorHandler);

// Start the server
const PORT = apiConfig.port;
app.listen(PORT, async () => {
  await Log('', 'INFO', 'scheduler-api', `Vehicle Maintenance Scheduler started on port ${PORT}`);
});
