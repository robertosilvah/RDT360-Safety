// controllers/safetyWalkController.js
const pool = require('../config/db');

// Get all safety walks
exports.getAllSafetyWalks = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM safety_walks ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching safety walks.' });
  }
};

// Create a new safety walk
exports.createSafetyWalk = async (req, res) => {
  try {
    const {
        display_id,
        walker,
        date,
        status,
        people_involved,
        safety_feeling_scale,
        checklist_items
    } = req.body;

    const query = `
        INSERT INTO safety_walks
        (display_id, walker, date, status, people_involved, safety_feeling_scale, checklist_items)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        display_id,
        walker,
        date,
        status || 'Scheduled',
        people_involved,
        safety_feeling_scale,
        JSON.stringify(checklist_items || [])
    ];

    const [result] = await pool.query(query, values);
    res.status(201).json({ safety_walk_id: result.insertId, ...req.body });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating safety walk.' });
  }
};
