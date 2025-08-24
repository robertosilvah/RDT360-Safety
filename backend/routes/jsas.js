// routes/jsas.js
const express = require('express');
const router = express.Router();
const jsaController = require('../controllers/jsaController');

// GET /api/jsas
router.get('/', jsaController.getAllJsas);

// POST /api/jsas
router.post('/', jsaController.createJsa);

module.exports = router;
