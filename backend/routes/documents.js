// routes/documents.js
const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// GET /api/documents
router.get('/', documentController.getAllDocuments);

// POST /api/documents
router.post('/', documentController.createDocument);

module.exports = router;
