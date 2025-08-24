// controllers/predefinedControlController.js
const pool = require('../config/db');

exports.getAllControls = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM predefined_controls');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching predefined controls.' });
  }
};

exports.createControl = async (req, res) => {
  try {
    const { id, text, reference } = req.body;
    const query = 'INSERT INTO predefined_controls (id, text, reference) VALUES (?, ?, ?)';
    const values = [id, text, JSON.stringify(reference || [])];
    await pool.query(query, values);
    res.status(201).json({ message: 'Predefined control created successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating predefined control.' });
  }
};
