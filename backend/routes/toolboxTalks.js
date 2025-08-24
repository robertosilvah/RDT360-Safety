// routes/toolboxTalks.js
const express = require('express');
const router = express.Router();
const toolboxTalkController = require('../controllers/toolboxTalkController');

router.get('/', toolboxTalkController.getAllTalks);
router.post('/', toolboxTalkController.createTalk);

module.exports = router;
