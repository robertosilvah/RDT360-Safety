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
const observationRoutes = require('./routes/observations');
const correctiveActionRoutes = require('./routes/correctiveActions');
const investigationRoutes = require('./routes/investigations');
const jsaRoutes = require('./routes/jsas');
const safetyWalkRoutes = require('./routes/safetyWalks');
const userRoutes = require('./routes/users');
const documentRoutes = require('./routes/documents');

app.use('/api/incidents', incidentRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/corrective-actions', correctiveActionRoutes);
app.use('/api/investigations', investigationRoutes);
app.use('/api/jsas', jsaRoutes);
app.use('/api/safety-walks', safetyWalkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);


// Welcome route
app.get('/', (req, res) => {
  res.send('RDT360-Safety Backend API is running.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
