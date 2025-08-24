// controllers/observationController.js
const pool = require('../config/db');

// Get all observations
exports.getAllObservations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM observations ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching observations.' });
  }
};

// Create a new observation
exports.createObservation = async (req, res) => {
    try {
        const {
            display_id,
            report_type,
            submitted_by,
            date,
            areaId,
            person_involved,
            risk_level,
            description,
            actions,
            unsafe_category,
            status,
            imageUrl,
            safety_walk_id
        } = req.body;

        // Simple validation
        if (!display_id || !report_type || !submitted_by || !date || !areaId || !description) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const query = `
            INSERT INTO observations 
            (display_id, report_type, submitted_by, date, created_date, areaId, person_involved, risk_level, description, actions, unsafe_category, status, imageUrl, safety_walk_id) 
            VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            display_id,
            report_type,
            submitted_by,
            date,
            areaId,
            person_involved,
            risk_level,
            description,
            actions,
            unsafe_category,
            status || 'Open',
            imageUrl,
            safety_walk_id
        ];

        const [result] = await pool.query(query, values);
        
        res.status(201).json({ observation_id: result.insertId, ...req.body });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating observation.' });
    }
}
