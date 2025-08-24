// controllers/jsaController.js
const pool = require('../config/db');

// Get all JSAs
exports.getAllJsas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jsas');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching JSAs.' });
  }
};

// Create a new JSA
exports.createJsa = async (req, res) => {
  try {
    const {
        display_id,
        title,
        job_description,
        areaId,
        required_ppe,
        steps,
        created_by,
        valid_from,
        valid_to,
        status
    } = req.body;

    const query = `
        INSERT INTO jsas
        (display_id, title, job_description, areaId, required_ppe, steps, created_by, created_date, valid_from, valid_to, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
    `;
    const values = [
        display_id,
        title,
        job_description,
        areaId,
        JSON.stringify(required_ppe || []),
        JSON.stringify(steps || []),
        created_by,
        valid_from,
        valid_to,
        status || 'Draft'
    ];

    const [result] = await pool.query(query, values);
    res.status(201).json({ jsa_id: result.insertId, ...req.body });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating JSA.' });
  }
};
