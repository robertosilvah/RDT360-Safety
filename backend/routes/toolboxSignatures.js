// routes/toolboxSignatures.js
const express = require('express');
const router = express.Router();
const toolboxSignatureController = require('../controllers/toolboxSignatureController');

// This route could be nested under toolbox talks, e.g., /api/toolbox-talks/:talkId/signatures
router.get('/for-talk/:talkId', toolboxSignatureController.getSignaturesForTalk);
router.post('/', toolboxSignatureController.addSignature);

module.exports = router;
