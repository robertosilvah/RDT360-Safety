// routes/forklifts.js
const express = require('express');
const router = express.Router();
const forkliftController = require('../controllers/forkliftController');

router.get('/', forkliftController.getAllForklifts);
router.post('/', forkliftController.createForklift);

module.exports = router;
