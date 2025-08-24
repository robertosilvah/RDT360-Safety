// routes/predefinedControls.js
const express = require('express');
const router = express.Router();
const predefinedControlController = require('../controllers/predefinedControlController');

router.get('/', predefinedControlController.getAllControls);
router.post('/', predefinedControlController.createControl);

module.exports = router;
