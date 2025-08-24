// controllers/areaController.js
const pool = require('../config/db');

// Get all areas (hierarchical structure will need to be built on the frontend)
exports.getAllAreas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM areas');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching areas.' });
  }
};

// Create a new area
exports.createArea = async (req, res) => {
  try {
    const { area_id, name, machines, parentId } = req.body;
    const query = 'INSERT INTO areas (area_id, name, machines, parentId) VALUES (?, ?, ?, ?)';
    const values = [area_id, name, JSON.stringify(machines || []), parentId];
    await pool.query(query, values);
    res.status(201).json({ message: 'Area created successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating area.' });
  }
};
