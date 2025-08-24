// controllers/toolboxTalkController.js
const pool = require('../config/db');

exports.getAllTalks = async (req, res) => {
  try {
    // This query would likely need a JOIN to get signature counts
    const [rows] = await pool.query('SELECT * FROM toolbox_talks ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching toolbox talks.' });
  }
};

exports.createTalk = async (req, res) => {
  try {
    const { display_id, topic, title, date, leader, location, department, observations, attachments } = req.body;
    const query = `
        INSERT INTO toolbox_talks (display_id, topic, title, date, leader, location, department, observations, attachments) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [display_id, topic, title, date, leader, location, department, observations, JSON.stringify(attachments || [])];
    await pool.query(query, values);
    res.status(201).json({ message: 'Toolbox talk created successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating toolbox talk.' });
  }
};

// You would also add controllers for signatures
