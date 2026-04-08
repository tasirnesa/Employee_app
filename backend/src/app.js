const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const reminderService = require('./services/reminderService');

const app = express();

// Initialize periodic tasks
reminderService.init();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists and serve statically
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Route Imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const positionRoutes = require('./routes/positions');
const criteriaRoutes = require('./routes/criteria');
const recruitmentRoutes = require('./routes/recruitment');
const evaluationRoutes = require('./routes/evaluations');
const sessionRoutes = require('./routes/sessions');
const goalRoutes = require('./routes/goals');
const keyResultProgressRoutes = require('./routes/keyResultProgress');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const leaveTypeRoutes = require('./routes/leaveTypes');
const payrollRoutes = require('./routes/payroll');
const benefitRoutes = require('./routes/benefits');
const projectRoutes = require('./routes/projects');
const timesheetRoutes = require('./routes/timesheets');
const todoRoutes = require('./routes/todos');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const onboardingRoutes = require('./routes/onboarding');
const offboardingRoutes = require('./routes/offboarding');
const documentRoutes = require('./routes/documents');
const performanceRoutes = require('./routes/performance');
const dashboardRoutes = require('./routes/dashboard');

// Public Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/departments', authenticateToken, departmentRoutes);
app.use('/api/positions', authenticateToken, positionRoutes);
app.use('/api/criteria', authenticateToken, criteriaRoutes);
app.use('/api/recruitment', authenticateToken, recruitmentRoutes);
app.use('/api/evaluations', authenticateToken, evaluationRoutes);
app.use('/api/sessions', authenticateToken, sessionRoutes);
app.use('/api/results', authenticateToken, evaluationRoutes); // Redirected to evaluation routes
app.use('/api/goals', authenticateToken, goalRoutes);
app.use('/api/key-result-progress', authenticateToken, keyResultProgressRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/leaves', authenticateToken, leaveRoutes);
app.use('/api/leave-types', authenticateToken, leaveTypeRoutes);
app.use('/api/payroll', authenticateToken, payrollRoutes);
app.use('/api/benefits', authenticateToken, benefitRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/timesheets', authenticateToken, timesheetRoutes);
app.use('/api/todos', authenticateToken, todoRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/onboarding', authenticateToken, onboardingRoutes);
app.use('/api/offboarding', authenticateToken, offboardingRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/performance', authenticateToken, performanceRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date() }));

// Error Handling Middleware (must be last)
app.use(errorHandler);

module.exports = app;