// routes/correctiveActions.js
const express = require('express');
const router = express.Router();
const correctiveActionController = require('../controllers/correctiveActionController');

// GET /api/corrective-actions
router.get('/', correctiveActionController.getAllCorrectiveActions);

// POST /api/corrective-actions
router.post('/', correctiveActionController.createCorrectiveAction);

module.exports = router;
