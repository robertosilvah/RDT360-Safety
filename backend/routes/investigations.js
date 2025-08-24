// routes/investigations.js
const express = require('express');
const router = express.Router();
const investigationController = require('../controllers/investigationController');

// GET /api/investigations
router.get('/', investigationController.getAllInvestigations);

// POST /api/investigations
router.post('/', investigationController.createInvestigation);

module.exports = router;
