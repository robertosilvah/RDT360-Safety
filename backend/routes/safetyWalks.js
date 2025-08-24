// routes/safetyWalks.js
const express = require('express');
const router = express.Router();
const safetyWalkController = require('../controllers/safetyWalkController');

// GET /api/safety-walks
router.get('/', safetyWalkController.getAllSafetyWalks);

// POST /api/safety-walks
router.post('/', safetyWalkController.createSafetyWalk);

module.exports = router;
