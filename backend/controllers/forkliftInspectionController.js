// controllers/forkliftInspectionController.js
const pool = require('../config/db');

exports.getAllInspections = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM forklift_inspections ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching forklift inspections.' });
  }
};

exports.createInspection = async (req, res) => {
  try {
    const { display_id, forklift_id, operator_name, date, checklist } = req.body;
    const query = `
        INSERT INTO forklift_inspections (display_id, forklift_id, operator_name, date, checklist) 
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [display_id, forklift_id, operator_name, date, JSON.stringify(checklist || [])];
    await pool.query(query, values);
    res.status(201).json({ message: 'Inspection created successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating inspection.' });
  }
};
