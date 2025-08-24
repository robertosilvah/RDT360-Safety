// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // Point to the root .env file

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // To parse request bodies as JSON

// API Routes
const incidentRoutes = require('./routes/incidents');
app.use('/api/incidents', incidentRoutes);

// ... you would use other routes here ...
// const observationRoutes = require('./routes/observations');
// app.use('/api/observations', observationRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.send('RDT360-Safety Backend API is running.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
