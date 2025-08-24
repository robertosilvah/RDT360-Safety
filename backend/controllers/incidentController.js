// controllers/incidentController.js
const pool = require('../config/db');

// Get all incidents
exports.getAllIncidents = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM incidents ORDER BY date DESC');
    // MariaDB doesn't have a native JSON type like PostgreSQL. If you use TEXT to store JSON,
    // you'll need to parse it before sending it.
    const incidents = rows.map(incident => ({
        ...incident,
        comments: typeof incident.comments === 'string' ? JSON.parse(incident.comments) : incident.comments,
        linked_docs: typeof incident.linked_docs === 'string' ? JSON.parse(incident.linked_docs) : incident.linked_docs,
    }));
    res.json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching incidents.' });
  }
};

// Create a new incident (simplified example)
exports.createIncident = async (req, res) => {
    try {
        const { display_id, date, area, type, description, severity, reported_by } = req.body;
        
        // Data validation would go here...

        const query = 'INSERT INTO incidents (display_id, date, area, type, description, severity, reported_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [display_id, date, area, type, description, severity, reported_by, 'Open'];

        const [result] = await pool.query(query, values);
        
        res.status(201).json({ incident_id: result.insertId, ...req.body });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating incident.' });
    }
}

// You would add more functions here: getIncidentById, updateIncident, deleteIncident...
