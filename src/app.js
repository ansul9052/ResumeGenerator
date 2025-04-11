const express = require('express');
const path = require('path');
const config = require('./config/config');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
const resumeRoutes = require('./routes/resumeRoutes');
app.use('/', resumeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
}); 