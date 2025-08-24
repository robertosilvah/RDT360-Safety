// routes/observations.js
const express = require('express');
const router = express.Router();
const observationController = require('../controllers/observationController');

// GET /api/observations
router.get('/', observationController.getAllObservations);

// POST /api/observations
router.post('/', observationController.createObservation);

// You would add more routes here: /:id for getting, updating, or deleting a single observation.

module.exports = router;
