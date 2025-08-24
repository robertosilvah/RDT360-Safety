// controllers/toolboxSignatureController.js
const pool = require('../config/db');

// Get all signatures for a specific talk
exports.getSignaturesForTalk = async (req, res) => {
  try {
    const { talkId } = req.params;
    const [rows] = await pool.query('SELECT * FROM toolbox_signatures WHERE toolbox_talk_id = ?', [talkId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching signatures.' });
  }
};

// Add a signature to a talk
exports.addSignature = async (req, res) => {
  try {
    const { id, toolbox_talk_id, name, signature_image_url } = req.body;
    const query = 'INSERT INTO toolbox_signatures (id, toolbox_talk_id, name, signature_image_url, signed_at) VALUES (?, ?, ?, ?, NOW())';
    const values = [id, toolbox_talk_id, name, signature_image_url];
    await pool.query(query, values);
    res.status(201).json({ message: 'Signature added successfully.', ...req.body });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding signature.' });
  }
};
