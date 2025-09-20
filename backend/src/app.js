const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { authenticateToken } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const evalRoutes = require('./routes/evaluations');

app.use('/api/evaluations', authenticateToken, evalRoutes);

module.exports = app;


