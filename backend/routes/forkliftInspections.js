// routes/forkliftInspections.js
const express = require('express');
const router = express.Router();
const forkliftInspectionController = require('../controllers/forkliftInspectionController');

router.get('/', forkliftInspectionController.getAllInspections);
router.post('/', forkliftInspectionController.createInspection);

module.exports = router;
