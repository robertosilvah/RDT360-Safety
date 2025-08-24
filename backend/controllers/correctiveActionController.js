// controllers/correctiveActionController.js
const pool = require('../config/db');

// Get all corrective actions
exports.getAllCorrectiveActions = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM corrective_actions ORDER BY due_date DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching corrective actions.' });
  }
};

// Create a new corrective action
exports.createCorrectiveAction = async (req, res) => {
  try {
    const {
        display_id,
        description,
        responsible_person,
        due_date,
        status,
        type,
        related_to_incident,
        related_to_observation,
        related_to_investigation,
        related_to_forklift_inspection,
    } = req.body;

    const query = `
        INSERT INTO corrective_actions
        (display_id, description, responsible_person, due_date, created_date, status, type, related_to_incident, related_to_observation, related_to_investigation, related_to_forklift_inspection)
        VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        display_id,
        description,
        responsible_person,
        due_date,
        status || 'Pending',
        type || 'Other',
        related_to_incident,
        related_to_observation,
        related_to_investigation,
        related_to_forklift_inspection,
    ];

    const [result] = await pool.query(query, values);
    res.status(201).json({ action_id: result.insertId, ...req.body });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating corrective action.' });
  }
};
