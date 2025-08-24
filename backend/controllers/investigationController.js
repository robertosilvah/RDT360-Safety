// controllers/investigationController.js
const pool = require('../config/db');

// Get all investigations
exports.getAllInvestigations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM investigations');
    res.json(rows);
  } catch (error)
 {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching investigations.' });
  }
};

// Create a new investigation
exports.createInvestigation = async (req, res) => {
  try {
    const {
        display_id,
        incident_id,
        status,
        root_cause,
        contributing_factors,
        events_history,
        lessons_learned,
        action_plan,
    } = req.body;

    const query = `
        INSERT INTO investigations
        (display_id, incident_id, status, root_cause, contributing_factors, events_history, lessons_learned, action_plan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        display_id,
        incident_id,
        status || 'Open',
        root_cause,
        contributing_factors,
        events_history,
        lessons_learned,
        action_plan,
    ];

    const [result] = await pool.query(query, values);
    res.status(201).json({ investigation_id: result.insertId, ...req.body });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating investigation.' });
  }
};
