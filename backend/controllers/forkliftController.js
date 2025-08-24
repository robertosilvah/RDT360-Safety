// controllers/forkliftController.js
const pool = require('../config/db');

exports.getAllForklifts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM forklifts');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching forklifts.' });
  }
};

exports.createForklift = async (req, res) => {
  try {
    const { id, name, area, imageUrl } = req.body;
    const query = 'INSERT INTO forklifts (id, name, area, imageUrl) VALUES (?, ?, ?, ?)';
    const values = [id, name, area, imageUrl];
    await pool.query(query, values);
    res.status(201).json({ message: 'Forklift created successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating forklift.' });
  }
};
