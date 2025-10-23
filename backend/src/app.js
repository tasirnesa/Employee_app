const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { authenticateToken } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static serving for uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
const evalRoutes = require('./routes/evaluations');
const empRoutes = require('./routes/employees');
const userRoutes = require('./routes/users');
const criteriaRoutes = require('./routes/criteria');
const goalsRoutes = require('./routes/goals');
const keyResultProgressRoutes = require('./routes/keyResultProgress');
const attendanceRoutes = require('./routes/attendance');
const todoRoutes = require('./routes/todos');
const payrollRoutes = require('./routes/payroll');
const recruitmentRoutes = require('./routes/recruitment');
const benefitsRoutes = require('./routes/benefits');

app.use('/api/evaluations', authenticateToken, evalRoutes);
app.use('/api/employees', authenticateToken, empRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/criteria', authenticateToken, criteriaRoutes);
app.use('/api/goals', authenticateToken, goalsRoutes);
app.use('/api/key-result-progress', authenticateToken, keyResultProgressRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/todos', authenticateToken, todoRoutes);
app.use('/api/payroll', authenticateToken, payrollRoutes);
app.use('/api/recruitment', authenticateToken, recruitmentRoutes);
app.use('/api/benefits', authenticateToken, benefitsRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

module.exports = app;