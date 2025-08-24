// routes/incidents.js
const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// GET /api/incidents
router.get('/', incidentController.getAllIncidents);

// POST /api/incidents
router.post('/', incidentController.createIncident);

// You would add more routes here: /:id, etc.

module.exports = router;
