// controllers/userController.js
const pool = require('../config/db');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, status FROM users'); // Exclude password hash
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching users.' });
  }
};

// Create a new user (invitation)
exports.createUser = async (req, res) => {
  try {
    const { id, name, email, role, status } = req.body;

    // In a real app, you would hash the password before saving
    // const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
        INSERT INTO users (id, name, email, role, status)
        VALUES (?, ?, ?, ?, ?)
    `;
    const values = [id, name, email, role, status || 'Pending'];

    await pool.query(query, values);
    res.status(201).json({ message: 'User created successfully.', id, name, email, role });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating user.' });
  }
};
