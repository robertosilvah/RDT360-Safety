// controllers/documentController.js
const pool = require('../config/db');

// Get all documents
exports.getAllDocuments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM safety_docs');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching documents.' });
  }
};

// Create a new document entry
exports.createDocument = async (req, res) => {
  try {
    const { display_id, title, category, file_url, related_modules } = req.body;

    const query = `
        INSERT INTO safety_docs (display_id, title, category, file_url, related_modules)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [display_id, title, category, file_url, JSON.stringify(related_modules || [])];

    const [result] = await pool.query(query, values);
    res.status(201).json({ doc_id: result.insertId, ...req.body });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating document entry.' });
  }
};
