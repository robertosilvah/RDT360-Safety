// routes/hotWorkPermits.js
const express = require('express');
const router = express.Router();
const hotWorkPermitController = require('../controllers/hotWorkPermitController');

router.get('/', hotWorkPermitController.getAllPermits);
router.post('/', hotWorkPermitController.createPermit);

module.exports = router;
