// controllers/predefinedHazardController.js
const pool = require('../config/db');

exports.getAllHazards = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM predefined_hazards');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching predefined hazards.' });
  }
};

exports.createHazard = async (req, res) => {
  try {
    const { id, text } = req.body;
    const query = 'INSERT INTO predefined_hazards (id, text) VALUES (?, ?)';
    const values = [id, text];
    await pool.query(query, values);
    res.status(201).json({ message: 'Predefined hazard created successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating predefined hazard.' });
  }
};
