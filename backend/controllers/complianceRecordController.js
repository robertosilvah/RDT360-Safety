// controllers/complianceRecordController.js
const pool = require('../config/db');

exports.getAllComplianceRecords = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM compliance_records');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching compliance records.' });
  }
};

exports.createComplianceRecord = async (req, res) => {
  try {
    const { employee_id, display_id, name, training_completed, cert_renewals_due, next_review_date } = req.body;
    const query = `
        INSERT INTO compliance_records (employee_id, display_id, name, training_completed, cert_renewals_due, next_review_date) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [employee_id, display_id, name, JSON.stringify(training_completed || []), cert_renewals_due, next_review_date];
    await pool.query(query, values);
    res.status(201).json({ message: 'Compliance record created successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating compliance record.' });
  }
};
