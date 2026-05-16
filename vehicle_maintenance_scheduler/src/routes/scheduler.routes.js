const express = require('express');
const schedulerController = require('../controllers/scheduler.controller');

const router = express.Router();

// POST /api/scheduler/optimize
router.post('/optimize', schedulerController.optimizeSchedule.bind(schedulerController));

module.exports = router;
