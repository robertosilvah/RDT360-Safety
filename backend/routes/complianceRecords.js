// routes/complianceRecords.js
const express = require('express');
const router = express.Router();
const complianceRecordController = require('../controllers/complianceRecordController');

router.get('/', complianceRecordController.getAllComplianceRecords);
router.post('/', complianceRecordController.createComplianceRecord);

module.exports = router;
