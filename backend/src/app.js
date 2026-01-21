const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { authenticateToken } = require('./middleware/auth');
const { securityHeaders, generalLimiter, authLimiter } = require('./middleware/security');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(generalLimiter);

// CORS configuration - allow any origin (adjust to a whitelist for production)
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Static serving for uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Import auth dependencies
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const SECRET_KEY = process.env.JWT_SECRET || 'a-very-secure-secret-key-2025';
const prisma = new PrismaClient();

// Login route (BEFORE authentication middleware)
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { userName: username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.userName, role: user.role },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

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
const timesheetsRoutes = require('./routes/timesheets');
const projectsRoutes = require('./routes/projects');
const leavesRoutes = require('./routes/leaves');
const leaveTypesRoutes = require('./routes/leaveTypes');
const departmentsRoutes = require('./routes/departments');
const positionsRoutes = require('./routes/positions');
const notificationsRoutes = require('./routes/notifications');
const onboardingRoutes = require('./routes/onboarding');

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
app.use('/api/timesheets', authenticateToken, timesheetsRoutes);
app.use('/api/projects', authenticateToken, projectsRoutes);
app.use('/api/leaves', authenticateToken, leavesRoutes);
app.use('/api/leave-types', authenticateToken, leaveTypesRoutes);
app.use('/api/departments', authenticateToken, departmentsRoutes);
app.use('/api/positions', authenticateToken, positionsRoutes);
app.use('/api/notifications', authenticateToken, notificationsRoutes);
app.use('/api/onboarding', authenticateToken, onboardingRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// User info route (protected)
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;