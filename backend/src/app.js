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
const empRoutes = require('./routes/employees');
const userRoutes = require('./routes/users');
const criteriaRoutes = require('./routes/criteria');
const goalsRoutes = require('./routes/goals');

app.use('/api/evaluations', authenticateToken, evalRoutes);
app.use('/api/employees', authenticateToken, empRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/criteria', authenticateToken, criteriaRoutes);
app.use('/api/goals', authenticateToken, goalsRoutes);

module.exports = app;


