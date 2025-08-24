// routes/predefinedHazards.js
const express = require('express');
const router = express.Router();
const predefinedHazardController = require('../controllers/predefinedHazardController');

router.get('/', predefinedHazardController.getAllHazards);
router.post('/', predefinedHazardController.createHazard);

module.exports = router;
