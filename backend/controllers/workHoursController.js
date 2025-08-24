// controllers/workHoursController.js
const pool = require('../config/db');

exports.getAllWorkHours = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM work_hours ORDER BY start_date DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching work hours.' });
  }
};

exports.createWorkHours = async (req, res) => {
  try {
    const { start_date, end_date, hours_worked, notes } = req.body;
    const query = 'INSERT INTO work_hours (id, start_date, end_date, hours_worked, notes) VALUES (UUID(), ?, ?, ?, ?)';
    const values = [start_date, end_date, hours_worked, notes];
    await pool.query(query, values);
    res.status(201).json({ message: 'Work hours log created successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating work hours log.' });
  }
};
