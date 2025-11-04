const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists and serve statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage for profile images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '') || '';
    cb(null, `employee-${unique}${ext}`);
  },
});
const upload = multer({ storage });

let prisma;
try {
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
  });
  console.log('Prisma Client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Prisma Client:', error);
  process.exit(1);
}

const getAuthHeader = (req) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  console.log('Raw auth header:', authHeader);
  return authHeader; 
};


const SECRET_KEY = 'a-very-secure-secret-key-2025'; 

// Helpers to normalize boolean-like strings stored in DB (e.g. 'true','false','1','0','yes','no','active','inactive')
const toLowerString = (v) => (v == null ? '' : String(v).trim().toLowerCase());
const isTrueLike = (v) => {
  const s = toLowerString(v);
  return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on' || s === 'active';
};
const isFalseLike = (v) => {
  const s = toLowerString(v);
  return s === 'false' || s === '0' || s === 'no' || s === 'n' || s === 'off' || s === 'inactive';
};

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = getAuthHeader(req);
  console.log('Auth header received:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error('Token verification error:', err.message, 'Token:', token);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => (req, res, next) => {
  const userRole = req.user?.role || '';
  console.log(`[authorizeRole] Expected:`, roles, `Got:`, userRole);
  if (!req.user || !roles.includes(userRole)) {
    return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
  }
  next();
};

// Helper to require non-Employee role
const requireNonEmployee = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user?.role === 'Employee') {
      return res.status(403).json({ error: 'Forbidden: Employees are not allowed to perform this action' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
};

// Helper to block employee role (allow admin and superadmin)
const blockEmployee = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role === 'Employee') {
      return res.status(403).json({ error: 'Forbidden: Employees are not allowed to perform this action' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Server error', details: e.message });
  }
};

// Mount modular routes from src where this index.js server is used
const keyResultProgressRoutes = require('./src/routes/keyResultProgress');
app.use('/api/key-result-progress', authenticateToken, keyResultProgressRoutes);

// Add attendance and todos routes
const attendanceRoutes = require('./src/routes/attendance');
const todoRoutes = require('./src/routes/todos');
const payrollRoutes = require('./src/routes/payroll');
const recruitmentRoutes = require('./src/routes/recruitment');
const benefitsRoutes = require('./src/routes/benefits');
const timesheetsRoutes = require('./src/routes/timesheets');
const projectsRoutes = require('./src/routes/projects');
const leavesRoutes = require('./src/routes/leaves');
const leaveTypesRoutes = require('./src/routes/leaveTypes');
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/todos', authenticateToken, todoRoutes);
app.use('/api/payroll', authenticateToken, payrollRoutes);
app.use('/api/recruitment', authenticateToken, recruitmentRoutes);
app.use('/api/benefits', authenticateToken, benefitsRoutes);
app.use('/api/timesheets', authenticateToken, timesheetsRoutes);
app.use('/api/projects', authenticateToken, projectsRoutes);
app.use('/api/leaves', authenticateToken, leavesRoutes);
app.use('/api/leave-types', authenticateToken, leaveTypesRoutes);

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
 
    if (!req.body) {
      console.log('Missing request body');
      return res.status(400).json({ error: 'Request body is missing' });
    }
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password:', { username, password });
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await prisma.user.findFirst({ where: { userName: username } });
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log('Password mismatch for:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isInactive = isFalseLike(user.status) || isFalseLike(user.activeStatus);
    const isLocked = isTrueLike(user.locked);
    if (isInactive || isLocked) {
      return res.status(403).json({ error: 'Your account is Deactiveted. Contact system administrator.' });
    }
   const linkedEmployee = await prisma.employee.findFirst({ where: { userId: user.id } });
    if (linkedEmployee && linkedEmployee.isActive === false) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { activeStatus: 'false', status: 'false', locked: 'true' },
        });
      } catch (syncErr) {
        console.warn('User flag sync on login failed:', syncErr?.message);
      }
      return res.status(403).json({ error: 'Your account is Deactiveted. Contact system administrator.' });
    }
    const token = jwt.sign({ id: user.id, username: user.userName, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Login successful:', username, 'isFirstLogin:', user.isFirstLogin, user.password);
   let profileImageUrl = null;
    try {
      const emp = await prisma.employee.findFirst({ where: { userId: user.id }, select: { profileImageUrl: true } });
      profileImageUrl = emp?.profileImageUrl || null;
    } catch (e) {
      console.warn('Failed to load employee profile image for user:', user.id, e?.message);
    }
    const userResponse = { ...user, profileImageUrl };
    console.log('Sending user data to frontend:', { id: userResponse.id, isFirstLogin: userResponse.isFirstLogin });
    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error.message, error.stack); 
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

function passwordsDifferByAtLeast4Chars(oldPassword, newPassword) {
  if (!oldPassword || !newPassword) return true; 
  
  const old = oldPassword.toLowerCase();
  const newPwd = newPassword.toLowerCase();
  if (old === newPwd) return false;
  const matrix = [];
  for (let i = 0; i <= newPwd.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= old.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= newPwd.length; i++) {
    for (let j = 1; j <= old.length; j++) {
      if (newPwd.charAt(i - 1) === old.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, 
          matrix[i][j - 1] + 1,     
          matrix[i - 1][j] + 1    
        );
      }
    }
  }
  
  return matrix[newPwd.length][old.length] >= 4;
}

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    
   
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    
    if (!passwordsDifferByAtLeast4Chars(currentPassword, newPassword)) {
      return res.status(400).json({ error: 'New password must differ from current password by at least 4 characters' });
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, isFirstLogin: 'false', locked: 'false' },
    });

    console.log('Password change successful. Updated user:', { 
      id: updated.id, 
      isFirstLogin: updated.isFirstLogin,
      userName: updated.userName 
    });

    return res.json({ message: 'Password updated successfully', user: { id: updated.id, isFirstLogin: updated.isFirstLogin } });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});


app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
  
    const userId = req.user.id; 
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log('User not found for id:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    let profileImageUrl = null;
    try {
      const emp = await prisma.employee.findFirst({ where: { userId: user.id }, select: { profileImageUrl: true } });
      profileImageUrl = emp?.profileImageUrl || null;
    } catch (e) {
      console.warn('Failed to load employee profile image for current user:', user.id, e?.message);
    }
    const enriched = { ...user, profileImageUrl };
    console.log('Current user fetched from DB:', { 
      id: enriched.id, 
      userName: enriched.userName, 
      isFirstLogin: enriched.isFirstLogin 
    });
    res.json(enriched);
  } catch (error) {
    console.error('Fetch current user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/debug/user-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, userName: true, isFirstLogin: true, locked: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Debug - User status:', user);
    res.json(user);
  } catch (error) {
    console.error('Debug user status error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/users/me:', req.headers);
    const userId = req.user.id; 
    const { fullName, userName, password } = req.body;
    if (!fullName || !userName) {
      console.log('Missing required fields:', { fullName, userName });
      return res.status(400).json({ error: 'FullName and userName are required' });
    }
    const updateData = {
      fullName,
      userName,
      ...(password && { password: await bcrypt.hash(password, 10) }),
    };
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    console.log('User updated:', user);
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/users/:id:', req.headers);
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      console.log('Invalid user ID:', req.params.id);
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log(`User not found for id: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('User fetched:', user);
    res.json(user);
  } catch (error) {
    console.error('User fetch error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


app.get('/api/users', authenticateToken, blockEmployee, async (req, res) => {
  try {
    console.log('Headers for /api/users:', req.headers);
    const users = await prisma.user.findMany();
    console.log('Users fetched:', users);
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, blockEmployee, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const {
      fullName,
      userName,
      password,
      gender,
      age,
      role,
      status,
      locked,
      isFirstLogin,
      activeStatus,
    } = req.body || {};

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (userName !== undefined) updateData.userName = userName;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (gender !== undefined) updateData.gender = gender;
    if (age !== undefined) updateData.age = age == null ? null : parseInt(age);
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = String(status);
    if (locked !== undefined) updateData.locked = String(locked);
    if (isFirstLogin !== undefined) updateData.isFirstLogin = String(isFirstLogin);
    if (activeStatus !== undefined) updateData.activeStatus = String(activeStatus);

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
    return res.json(updated);
  } catch (error) {
    console.error('Update user error:', error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, blockEmployee, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return res.status(404).json({ error: 'User not found' });
    await prisma.user.delete({ where: { id: userId } });
    return res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.put('/api/users/:id/authorize', authenticateToken, blockEmployee, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'true',
        activeStatus: 'true',
        locked: 'false',
        isFirstLogin: 'false',
      },
    });
    return res.json({ message: 'User authorized', user: updated });
  } catch (error) {
    console.error('Authorize user error:', error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/evaluations', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching evaluations with headers:', req.headers);
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    const whereClause = currentUser?.role === 'Employee' ? { evaluateeID: req.user.id } : {};
    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        evaluator: { select: { fullName: true } },
        evaluatee: { select: { fullName: true } },
      },
      orderBy: { evaluationDate: 'desc' },
    });
    res.json(evaluations);
  } catch (error) {
    console.error('Get evaluations error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.get('/api/evaluations/:evaluationId/details', authenticateToken, async (req, res) => {
  try {
    const evaluationId = parseInt(req.params.evaluationId);
    if (Number.isNaN(evaluationId)) return res.status(400).json({ error: 'Invalid evaluationId' });

    const evaluation = await prisma.evaluation.findUnique({
      where: { evaluationID: evaluationId },
      include: {
        evaluator: { select: { fullName: true, id: true } },
        evaluatee: { select: { fullName: true, id: true } },
      },
    });
    if (!evaluation) return res.status(404).json({ error: 'Evaluation not found' });

    const [results, goals] = await Promise.all([
      prisma.evaluationResult.findMany({
        where: { evaluationID: evaluationId },
        include: { criteria: { select: { title: true, description: true, criteriaID: true } } },
        orderBy: { resultID: 'asc' },
      }),
      prisma.goal.findMany({
        where: { activatedBy: evaluation.evaluateeID },
        orderBy: { gid: 'desc' },
      }),
    ]);

    return res.json({ evaluation, results, goals });
  } catch (error) {
    console.error('Evaluation details error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.post('/api/evaluations', authenticateToken, requireNonEmployee, async (req, res) => {
  console.log('Create evaluation request received with body:', req.body);
  try {
    const { evaluation, results } = req.body;
    let { evaluatorID, evaluateeID, evaluationType, sessionID, evaluateeEmployeeId } = evaluation;
    if (!evaluatorID || (!evaluateeID && !evaluateeEmployeeId) || !evaluationType || !sessionID) {
      console.log('Missing required fields:', { evaluatorID, evaluateeID, evaluateeEmployeeId, evaluationType, sessionID });
      return res.status(400).json({ error: 'Missing required fields: evaluatorID, evaluateeID or evaluateeEmployeeId, evaluationType, sessionID' });
    }

    if (evaluatorID === evaluateeID) {
      console.log('Evaluator and evaluatee cannot be the same:', { evaluatorID, evaluateeID });
      return res.status(400).json({ error: 'Evaluator and evaluatee cannot be the same person' });
    }

    if (!evaluateeID && evaluateeEmployeeId) {
      const empId = parseInt(evaluateeEmployeeId);
      const employee = await prisma.employee.findUnique({ where: { id: empId } });
      if (!employee) return res.status(400).json({ error: `Employee with id ${empId} does not exist` });
      if (!employee.userId) {
        
        const baseUserName = (employee.email?.split('@')[0] || `${employee.firstName}.${employee.lastName}`).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
        let userName = baseUserName || `emp${empId}`;
       
        let suffix = 0;
        while (true) {
          const exists = await prisma.user.findFirst({ where: { userName } });
          if (!exists) break;
          suffix += 1;
          userName = `${baseUserName}${suffix}`;
        }
        const passwordPlain = Math.random().toString(36).slice(-8) + 'A1!';
        const hashedPassword = await bcrypt.hash(passwordPlain, 10);
        const createdUser = await prisma.user.create({
          data: {
            fullName: `${employee.firstName} ${employee.lastName}`.trim(),
            userName,
            password: hashedPassword,
            gender: null,
            age: null,
            role: 'Employee',
            status: 'true',
            locked: 'false',
            isFirstLogin: 'true',
            activeStatus: 'true',
            createdDate: new Date(),
            createdBy: req.user.id,
          },
        });
        await prisma.employee.update({ where: { id: empId }, data: { userId: createdUser.id } });
        evaluateeID = createdUser.id;
      } else {
        evaluateeID = employee.userId;
      }
    }
 if (evaluateeID && !Number.isNaN(parseInt(evaluateeID))) {
      const userCandidate = await prisma.user.findUnique({ where: { id: parseInt(evaluateeID) } });
      if (!userCandidate) {
        const empIdFromEvaluatee = parseInt(evaluateeID);
        const employee = await prisma.employee.findUnique({ where: { id: empIdFromEvaluatee } });
        if (employee) {
          if (!employee.userId) {
            const baseUserName = (employee.email?.split('@')[0] || `${employee.firstName}.${employee.lastName}`).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || `emp${empIdFromEvaluatee}`;
            let userName = baseUserName;
            let suffix = 0;
            while (true) {
              const exists = await prisma.user.findFirst({ where: { userName } });
              if (!exists) break;
              suffix += 1;
              userName = `${baseUserName}${suffix}`;
            }
            const passwordPlain = Math.random().toString(36).slice(-8) + 'A1!';
            const hashedPassword = await bcrypt.hash(passwordPlain, 10);
            const createdUser = await prisma.user.create({
              data: {
                fullName: `${employee.firstName} ${employee.lastName}`.trim(),
                userName,
                password: hashedPassword,
                gender: null,
                age: null,
                role: 'Employee',
                status: 'true',
                locked: 'false',
                isFirstLogin: 'true',
                activeStatus: 'true',
                createdDate: new Date(),
                createdBy: req.user.id,
              },
            });
            await prisma.employee.update({ where: { id: empIdFromEvaluatee }, data: { userId: createdUser.id } });
            evaluateeID = createdUser.id;
          } else {
            evaluateeID = employee.userId;
          }
        }
      }
    }
    const [evaluatorExists, evaluateeExists, sessionExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: parseInt(evaluatorID) } }),
      prisma.user.findUnique({ where: { id: parseInt(evaluateeID) } }),
      prisma.evaluationSession.findUnique({ where: { sessionID: parseInt(sessionID) } }),
    ]);

    if (!evaluatorExists) {
      return res.status(400).json({ error: `Evaluator with id ${evaluatorID} does not exist` });
    }
    if (!evaluateeExists) {
      return res.status(400).json({ error: `Evaluatee with id ${evaluateeID} does not exist` });
    }
    if (!sessionExists) {
      return res.status(400).json({ error: `Session with id ${sessionID} does not exist` });
    }
    {
      const session = await prisma.evaluationSession.findUnique({ where: { sessionID: parseInt(sessionID) } });
      if (!session) {
        return res.status(400).json({ error: `Session with id ${sessionID} does not exist` });
      }
      const now = new Date();
      const isOn = String(session.type || '').toLowerCase() === 'on';
      if (!isOn) {
        return res.status(403).json({ error: 'Evaluation is not active for this session' });
      }
      if (now < new Date(session.startDate) || now > new Date(session.endDate)) {
        return res.status(403).json({ error: 'Evaluation is outside the active date range' });
      }
      if (session.department) {
        const evaluateeEmployee = await prisma.employee.findFirst({ where: { userId: parseInt(evaluateeID) } });
        const evaluateeDept = evaluateeEmployee?.department || null;
        if (!evaluateeDept || String(evaluateeDept).trim().toLowerCase() !== String(session.department).trim().toLowerCase()) {
          return res.status(403).json({ error: 'Evaluatee not in the session department' });
        }
      }
    }

    const evaluationResult = await prisma.evaluation.create({
      data: {
        evaluationID: undefined,
        evaluatorID: parseInt(evaluatorID),
        evaluateeID: parseInt(evaluateeID),
        evaluationType,
        sessionID: parseInt(sessionID),
        evaluationDate: new Date(),
      },
    });

    console.log('Evaluation created:', evaluationResult);

    let evaluationResults = { count: 0 };
    if (results && Array.isArray(results) && results.length > 0) {
      const validResults = results.filter(result => result.criteriaID !== undefined && result.criteriaID !== null);
      if (validResults.length !== results.length) {
        console.warn('Some results had invalid criteriaID, filtered out:', results.filter(r => r.criteriaID === undefined || r.criteriaID === null));
      }
      if (validResults.length > 0) {
        evaluationResults = await prisma.evaluationResult.createMany({
          data: validResults.map(result => ({
            evaluationID: evaluationResult.evaluationID,
            criteriaID: result.criteriaID,
            score: result.score,
            feedback: result.feedback || null,
          })),
        });
        console.log('Evaluation results created:', evaluationResults);
      } else {
        console.log('No valid evaluation results to create');
      }
    } else {
      console.log('No evaluation results provided');
    }

    res.status(201).json({
      ...evaluationResult,
      resultsCount: evaluationResults.count,
    });
  } catch (error) {
    console.error('Create evaluation error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
      requestBody: req.body,
    });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.get('/api/criteria', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/criteria:', req.headers);
    const criteria = await prisma.evaluationCriteria.findMany({
      include: {
        creator: { select: { fullName: true } },
      },
    });
    const missing = criteria.filter(c => !c.creator && c.createdBy != null).map(c => c.createdBy);
    let idToName = {};
    if (missing.length) {
      const users = await prisma.user.findMany({ where: { id: { in: Array.from(new Set(missing)) } }, select: { id: true, fullName: true } });
      idToName = users.reduce((acc, u) => { acc[u.id] = u.fullName; return acc; }, {});
    }
    const enriched = criteria.map(c => ({
      ...c,
      creatorName: c.creator?.fullName || (idToName[c.createdBy] || null),
    }));
    console.log('Criteria fetched:', enriched);
    res.json(enriched);
  } catch (error) {
    console.error('Fetch criteria error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


app.get('/api/results', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/results:', req.headers);
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    const whereClause = currentUser?.role === 'Employee'
      ? { evaluation: { evaluateeID: req.user.id } }
      : {};
    const results = await prisma.evaluationResult.findMany({
      where: whereClause,
    });
    res.json(results);
  } catch (error) {
    console.error('Fetch results error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/sessions:', req.headers);
    const sessions = await prisma.evaluationSession.findMany();
    console.log('Sessions fetched:', sessions);
    res.json(sessions);
  } catch (error) {
    console.error('Fetch sessions error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


app.post('/api/users', authenticateToken, blockEmployee, async (req, res) => {
  console.log('Create user request received with body:', req.body);
  try {
    const {
      fullName,
      userName,
      password,
      gender,
      age,
      role,
      status = 'true',
      locked = 'false',
      isFirstLogin = 'true',
      activeStatus = 'true',
      createdBy,
    } = req.body;

    if (!fullName || !userName || !password || !role || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        userName,
        password: hashedPassword,
        gender,
        age,
        role,
        status,
        locked,
        isFirstLogin,
        activeStatus,
        createdDate: new Date(),
        createdBy: parseInt(createdBy),
      },
    });

    console.log('User created:', user);
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/criteria', authenticateToken, requireNonEmployee, async (req, res) => {
  console.log('Create criteria request received with body:', req.body);
  try {
    const { title, description } = req.body || {};

    if (!title || String(title).trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const criteria = await prisma.evaluationCriteria.create({
      data: {
        title: String(title).trim(),
        description: description == null || String(description).trim() === '' ? null : String(description),
        createdDate: new Date(),
        createdBy: req.user.id,
      },
      include: { creator: { select: { fullName: true } } }
    });

    console.log('Criteria created:', criteria);
    res.status(201).json({ ...criteria, creatorName: criteria.creator?.fullName || null });
  } catch (error) {
    console.error('Create criteria error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create criteria', details: error.message });
  }
});
app.post('/api/criteria/bulk', authenticateToken, requireNonEmployee, async (req, res) => {
  console.log('Bulk create criteria request with body:', req.body?.length ?? 0, 'items');
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    if (!items.length) {
      return res.status(400).json({ error: 'Request body must be a non-empty array' });
    }
    const now = new Date();
    const payload = items
      .map((it) => ({ title: it.title, description: it.description }))
      .filter((it) => it.title && String(it.title).trim() !== '')
      .map((it) => ({
        title: String(it.title).trim(),
        description: it.description == null || String(it.description).trim() === '' ? null : String(it.description),
        createdDate: now,
        createdBy: req.user.id,
      }));

    if (!payload.length) {
      return res.status(400).json({ error: 'No valid criteria in payload' });
    }

    const result = await prisma.evaluationCriteria.createMany({ data: payload });
    console.log('Bulk criteria created count:', result.count);
    return res.status(201).json({ count: result.count });
  } catch (error) {
    console.error('Bulk create criteria error:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to create criteria in bulk', details: error.message });
  }
});

app.put('/api/criteria/:id', authenticateToken, requireNonEmployee, async (req, res) => {
  console.log('Update criteria request with params:', req.params, 'body:', req.body);
  try {
    const id = parseInt(req.params.id);
    const { title, description } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid criteria id' });
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const existing = await prisma.evaluationCriteria.findUnique({ where: { criteriaID: id } });
    if (!existing) return res.status(404).json({ error: 'Criteria not found' });

    const updated = await prisma.evaluationCriteria.update({
      where: { criteriaID: id },
      data: { title, description },
    });
    res.json(updated);
  } catch (error) {
    console.error('Update criteria error:', error.message);
    res.status(500).json({ error: 'Failed to update criteria' });
  }
});
app.delete('/api/criteria/:id', authenticateToken, requireNonEmployee, async (req, res) => {
  console.log('Delete criteria request with params:', req.params);
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid criteria id' });
    const existing = await prisma.evaluationCriteria.findUnique({ where: { criteriaID: id } });
    if (!existing) return res.status(404).json({ error: 'Criteria not found' });

    await prisma.evaluationCriteria.delete({ where: { criteriaID: id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete criteria error:', error.message);
    res.status(500).json({ error: 'Failed to delete criteria' });
  }
});
app.post('/api/criteria/:id/authorize', authenticateToken, async (req, res) => {
  console.log('Authorize criteria request with params:', req.params);
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid criteria id' });
    const existing = await prisma.evaluationCriteria.findUnique({ where: { criteriaID: id } });
    if (!existing) return res.status(404).json({ error: 'Criteria not found' });

    const updated = await prisma.evaluationCriteria.update({
      where: { criteriaID: id },
      data: { createdBy: req.user.id },
    });
    res.json({ message: 'Authorized', criteria: updated });
  } catch (error) {
    console.error('Authorize criteria error:', error.message);
    res.status(500).json({ error: 'Failed to authorize criteria' });
  }
});

app.post('/api/evaluation-sessions', authenticateToken, requireNonEmployee, async (req, res) => {
  console.log('Create evaluation session request received with body:', req.body);
  try {
    const { title, startDate, endDate, department } = req.body;

    if (!title || !startDate || !endDate) {
      console.log('Missing required fields:', { title, startDate, endDate, department });
      return res.status(400).json({ error: 'Missing required fields: title, startDate, endDate' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      console.log('endDate must be after startDate:', { startDate, endDate });
      return res.status(400).json({ error: 'endDate must be after startDate' });
    }

    const activatedBy = req.user.id; 
    if (!activatedBy) {
      console.log('No user ID found in token:', req.user);
      return res.status(400).json({ error: 'No user ID available to set activatedBy' });
    }

    const session = await prisma.evaluationSession.create({
      data: {
        title,
        startDate: start,
        endDate: end,
        activatedBy: activatedBy, 
        type: 'on',
        department: department || null,
      },
    });

    console.log('Evaluation session created:', session);
    res.status(201).json(session);
  } catch (error) {
    console.error('Create evaluation session error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.get('/api/evaluation-sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.evaluationSession.findMany({
      where: { activatedBy: req.user.id },
      orderBy: { startDate: 'desc' },
    });
    res.json(sessions);
  } catch (error) {
    console.error('Fetch sessions error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.put('/api/evaluation-sessions/:id/status', authenticateToken, requireNonEmployee, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, startDate, endDate, department } = req.body || {};
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid session id' });
    if (!status) return res.status(400).json({ error: 'status is required (on/off)' });
    const existing = await prisma.evaluationSession.findUnique({ where: { sessionID: id } });
    if (!existing) return res.status(404).json({ error: 'Session not found' });
    const desired = String(status).toLowerCase();
    const alreadyOn = String(existing.type || '').toLowerCase() === 'on';
    if (desired === 'on' && alreadyOn) {
      return res.status(409).json({ error: 'Session is already activated' });
    }

    const data = { type: desired };
    if (startDate) Object.assign(data, { startDate: new Date(startDate) });
    if (endDate) Object.assign(data, { endDate: new Date(endDate) });
    if (department !== undefined) Object.assign(data, { department: department || null });

    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      return res.status(400).json({ error: 'endDate must be after startDate' });
    }

    const updated = await prisma.evaluationSession.update({ where: { sessionID: id }, data });
    res.json(updated);
  } catch (error) {
    console.error('Update session status error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/evaluation-sessions/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); 

    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE "StartDate" <= ${today} AND "EndDate" >= ${weekStart}) AS this_week,
        COUNT(*) FILTER (WHERE "EndDate" = ${today}) AS today,
        COUNT(*) FILTER (WHERE "EndDate" >= ${today}) AS pending
      FROM "EvaluationSession"
      WHERE "ActivatedBy" = ${req.user.id}
    `;

    res.json({
      thisWeek: Number(stats[0].this_week) || 0,
      today: Number(stats[0].today) || 0,
      pending: Number(stats[0].pending) || 0,
      meetings: 0 
    });
  } catch (error) {
    console.error('Error fetching session stats:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});



app.get('/api/performance', authenticateToken, async (req, res) => {
  console.log('Fetching performance data');
  try {
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isAdmin = ['Admin', 'SuperAdmin'].includes(currentUser?.role || '');
    const whereClause = isAdmin ? {} : { userId: req.user.id };
    const performanceData = await prisma.performance.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, userName: true } },
        evaluator: { select: { id: true, fullName: true, userName: true } },
      },
    });
    console.log('Performance data fetched:', performanceData);
    res.status(200).json(performanceData);
  } catch (error) {
    console.error('Fetch performance data error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
const toStartOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const coercePeriod = (body) => {
  const now = new Date();
  const start = body?.periodStart ? toStartOfDay(body.periodStart) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = body?.periodEnd ? toStartOfDay(body.periodEnd) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const label = body?.evaluationPeriod || `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  return { start, end, label };
};

const mapScoreTo100 = (score, min = 1, max = 5) => {
  if (score == null) return null;
  const clamped = Math.max(min, Math.min(max, Number(score)));
  return ((clamped - min) / (max - min)) * 100;
};

const safeAvg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// Calculate on-time threshold 09:15 local time
const getOnTimeThreshold = (d) => {
  const t = new Date(d);
  t.setHours(9, 15, 0, 0);
  return t;
};

// Helper: count business days (Mon-Fri) inclusive
const countBusinessDays = (start, end) => {
  const s = toStartOfDay(start);
  const e = toStartOfDay(end);
  let days = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) days += 1; // Mon-Fri
  }
  return Math.max(days, 1);
};

// Reusable calculator for performance components
async function calculatePerformanceComponents(prisma, userId, start, end) {
  // Evaluation results → 0..100
  const evalResults = await prisma.evaluationResult.findMany({
    where: {
      evaluation: {
        evaluateeID: userId,
        evaluationDate: { gte: start, lte: end },
      },
    },
    select: { score: true },
  });
  const evalScores100 = evalResults.map((r) => mapScoreTo100(r.score)).filter((x) => x != null);
  const evaluation = safeAvg(evalScores100);

  // Goals progress → 0..100 average
  const goals = await prisma.goal.findMany({
    where: { activatedBy: userId, OR: [{ duedate: { gte: start, lte: end } }, { duedate: null }] },
    select: { progress: true },
  });
  const goalProgress = goals.map((g) => (g.progress == null ? 0 : Number(g.progress))).filter((n) => !Number.isNaN(n));
  const goalsScore = safeAvg(goalProgress);

  // Productivity from timesheets (hoursWorked vs expected hours)
  const times = await prisma.timesheet.findMany({
    where: { employeeId: userId, date: { gte: start, lte: end } },
    select: { hoursWorked: true, overtimeHours: true },
  });
  const totalHours = times.reduce((s, r) => s + (r.hoursWorked || 0) + (r.overtimeHours || 0), 0);
  const businessDays = countBusinessDays(start, end);
  const expectedHours = businessDays * 8; // 8h per business day
  const productivity = Math.min(100, Math.round((totalHours / expectedHours) * 100));

  // Punctuality from attendance (on-time check-ins / attendance days)
  const attendance = await prisma.attendance.findMany({
    where: { employeeId: userId, date: { gte: start, lte: end } },
    select: { date: true, checkInTime: true },
  });
  const punctualDays = attendance.filter((a) => {
    if (!a.checkInTime) return false;
    const threshold = getOnTimeThreshold(a.date);
    return new Date(a.checkInTime) <= threshold;
  }).length;
  const punctuality = attendance.length ? Math.round((punctualDays / attendance.length) * 100) : 0;

  return { evaluation, goalsScore, productivity, punctuality, totals: { totalHours, tasksCount: times.length } };
}


app.post('/api/performance/recalculate', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const { start, end, label } = coercePeriod(req.body);

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(400).json({ error: `User ${userId} does not exist` });

    const { evaluation, goalsScore, productivity, punctuality, totals } = await calculatePerformanceComponents(prisma, parseInt(userId), start, end);

    const weights = { evaluation: 0.5, goals: 0.25, productivity: 0.15, punctuality: 0.1 };
    const components = {
      evaluation: isNaN(evaluation) ? 0 : evaluation,
      goals: isNaN(goalsScore) ? 0 : goalsScore,
      productivity: isNaN(productivity) ? 0 : productivity,
      punctuality: isNaN(punctuality) ? 0 : punctuality,
    };
    const overallRating100 =
      components.evaluation * weights.evaluation +
      components.goals * weights.goals +
      components.productivity * weights.productivity +
      components.punctuality * weights.punctuality;
    const overallRating = Math.round((overallRating100 / 20) * 10) / 10; // scale 0..100 -> 1..5 by /20

    const existing = await prisma.performance.findFirst({ where: { userId: parseInt(userId), evaluationPeriod: label } });
    const baseData = {
      evaluatorId: req.user.id,
      tasksCompleted: totals.tasksCount,
      hoursWorked: totals.totalHours,
      efficiencyScore: null,
      qualityScore: null,
      punctualityScore: components.punctuality,
      collaborationScore: null,
      innovationScore: null,
      overallRating,
      feedback: null,
      evaluationPeriod: label,
      date: end,
    };
    let saved;
    if (existing) {
      saved = await prisma.performance.update({ where: { id: existing.id }, data: baseData });
    } else {
      saved = await prisma.performance.create({ data: { userId: parseInt(userId), ...baseData } });
    }

    return res.status(200).json({ message: 'Recalculated', period: { start, end, label }, components, overallRating, performance: saved });
  } catch (error) {
    console.error('Recalculate performance error:', error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/performance/recalculate-all', authenticateToken, async (req, res) => {
  try {
    const { start, end, label } = coercePeriod(req.body);
    const users = await prisma.user.findMany({ select: { id: true } });
    const weights = { evaluation: 0.5, goals: 0.25, productivity: 0.15, punctuality: 0.1 };
    const results = [];
    for (const u of users) {
      const { evaluation, goalsScore, productivity, punctuality, totals } = await calculatePerformanceComponents(prisma, u.id, start, end);
      const components = {
        evaluation: isNaN(evaluation) ? 0 : evaluation,
        goals: isNaN(goalsScore) ? 0 : goalsScore,
        productivity: isNaN(productivity) ? 0 : productivity,
        punctuality: isNaN(punctuality) ? 0 : punctuality,
      };
      const overallRating100 =
        components.evaluation * weights.evaluation +
        components.goals * weights.goals +
        components.productivity * weights.productivity +
        components.punctuality * weights.punctuality;
      const overallRating = Math.round((overallRating100 / 20) * 10) / 10;

      const existing = await prisma.performance.findFirst({ where: { userId: u.id, evaluationPeriod: label } });
      const baseData = {
        evaluatorId: req.user.id,
        tasksCompleted: totals.tasksCount,
        hoursWorked: totals.totalHours,
        punctualityScore: components.punctuality,
        overallRating,
        evaluationPeriod: label,
        date: end,
      };
      if (existing) {
        await prisma.performance.update({ where: { id: existing.id }, data: baseData });
      } else {
        await prisma.performance.create({ data: { userId: u.id, ...baseData } });
      }
      results.push({ userId: u.id, components, overallRating });
    }
    return res.status(200).json({ message: 'Recalculated for all users', period: { start, end, label }, results });
  } catch (error) {
    console.error('Recalculate-all error:', error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.post('/api/performance', authenticateToken, async (req, res) => {
  console.log('Create performance record with body:', req.body);
  try {
    const {
      userId,
      evaluatorId,
      tasksCompleted,
      hoursWorked,
      efficiencyScore,
      qualityScore,
      punctualityScore,
      collaborationScore,
      innovationScore,
      overallRating,
      feedback,
      evaluationPeriod,
      date,
    } = req.body;

    if (!userId || !evaluatorId || tasksCompleted === undefined || hoursWorked === undefined || !evaluationPeriod || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [userExists, evaluatorExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: parseInt(userId) } }),
      prisma.user.findUnique({ where: { id: parseInt(evaluatorId) } }),
    ]);
    if (!userExists) return res.status(400).json({ error: `User ${userId} does not exist` });
    if (!evaluatorExists) return res.status(400).json({ error: `Evaluator ${evaluatorId} does not exist` });

    const created = await prisma.performance.create({
      data: {
        userId: parseInt(userId),
        evaluatorId: parseInt(evaluatorId),
        tasksCompleted: parseInt(tasksCompleted),
        hoursWorked: parseInt(hoursWorked),
        efficiencyScore: efficiencyScore != null ? Number(efficiencyScore) : null,
        qualityScore: qualityScore != null ? Number(qualityScore) : null,
        punctualityScore: punctualityScore != null ? Number(punctualityScore) : null,
        collaborationScore: collaborationScore != null ? Number(collaborationScore) : null,
        innovationScore: innovationScore != null ? Number(innovationScore) : null,
        overallRating: overallRating != null ? Number(overallRating) : null,
        feedback: feedback || null,
        evaluationPeriod,
        date: new Date(date),
      },
    });
    return res.status(201).json(created);
  } catch (error) {
    console.error('Create performance error:', error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: {
        activatedBy: req.user.id,
      },
    });
    console.log('Fetched goals:', goals);
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.post('/api/goals', authenticateToken, async (req, res) => {
  console.log('Create goal request received with body:', req.body);
  try {
    const { objective, keyResult, priority, status, progress, duedate, category } = req.body;

    if (!objective || !duedate) {
      console.log('Missing required fields:', { objective, duedate });
      return res.status(400).json({ error: 'Missing required fields: objective, duedate' });
    }

    if (!req.user || !req.user.id) {
      console.log('No user ID found in token:', req.user);
      return res.status(401).json({ error: 'Authentication error: No user ID available' });
    }

    const goal = await prisma.goal.create({
      data: {
        objective,
        keyResult: Array.isArray(keyResult) ? keyResult : [keyResult || ''], 
        priority,
        status,
        progress: parseInt(progress) || 0,
        duedate: new Date(duedate),
        category,
        activatedBy: req.user.id,
      },
    });

    console.log('Goal created:', goal);
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.put('/api/goals/:gid', authenticateToken, async (req, res) => {
  console.log('Edit goal request received with params:', req.params, 'body:', req.body);
  try {
    const { gid } = req.params;
    const { objective, keyResult, priority, status, progress, duedate, category } = req.body;

    const existingGoal = await prisma.goal.findUnique({
      where: { gid: parseInt(gid) },
    });

    if (!existingGoal) {
      console.log('Goal not found:', gid);
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (existingGoal.activatedBy !== req.user.id) {
      console.log('Unauthorized access to goal:', gid);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const goal = await prisma.goal.update({
      where: { gid: parseInt(gid) },
      data: {
        objective,
        keyResult,
        priority,
        status,
        progress,
        duedate: duedate ? new Date(duedate) : undefined,
        category,
      },
    });

    console.log('Goal updated:', goal);
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.post('/api/goals/:gid/key-results/:keyIndex/progress', authenticateToken, async (req, res) => {
  try {
    const gid = parseInt(req.params.gid);
    const keyIndex = parseInt(req.params.keyIndex);
    const { progress } = req.body;

    if (Number.isNaN(gid) || Number.isNaN(keyIndex)) {
      return res.status(400).json({ error: 'Invalid goal id or key index' });
    }
    const progressInt = parseInt(progress);
    if (Number.isNaN(progressInt) || progressInt < 0 || progressInt > 100) {
      return res.status(400).json({ error: 'Progress must be an integer 0..100' });
    }

    const goal = await prisma.goal.findUnique({ where: { gid } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.activatedBy !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const keyResults = Array.isArray(goal.keyResult) ? goal.keyResult : [];
    if (keyIndex < 0 || keyIndex >= keyResults.length) {
      return res.status(400).json({ error: 'keyIndex out of range' });
    }

    const created = await prisma.keyResultProgress.create({
      data: {
        goalId: gid,
        keyIndex,
        progress: progressInt,
        notedBy: req.user.id,
      },
    });
    const latestByKey = await prisma.$queryRaw`
      SELECT DISTINCT ON ("keyIndex") "keyIndex", "progress"
      FROM "KeyResultProgress"
      WHERE "goalId" = ${gid}
      ORDER BY "keyIndex", "notedAt" DESC
    `;
    const values = (latestByKey || []).map(r => Number(r.progress)).filter(n => !Number.isNaN(n));
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
    await prisma.goal.update({ where: { gid }, data: { progress: avg } });

    res.status(201).json({ progress: created, goalProgress: avg });
  } catch (error) {
    console.error('Record key result progress error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.get('/api/goals/:gid/key-results/progress', authenticateToken, async (req, res) => {
  try {
    const gid = parseInt(req.params.gid);
    if (Number.isNaN(gid)) return res.status(400).json({ error: 'Invalid goal id' });

    const goal = await prisma.goal.findUnique({ where: { gid } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.activatedBy !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const latestByKey = await prisma.$queryRaw`
      SELECT DISTINCT ON ("keyIndex") "keyIndex", "progress", "notedAt"
      FROM "KeyResultProgress"
      WHERE "goalId" = ${gid}
      ORDER BY "keyIndex", "notedAt" DESC
    `;
    res.json({ keyResults: goal.keyResult || [], latestProgress: latestByKey });
  } catch (error) {
    console.error('Get key result progress error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/api/goals/:gid', authenticateToken, async (req, res) => {
  console.log('Delete goal request received with params:', req.params);
  try {
    const { gid } = req.params;

    const existingGoal = await prisma.goal.findUnique({
      where: { gid: parseInt(gid) },
    });

    if (!existingGoal) {
      console.log('Goal not found:', gid);
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (existingGoal.activatedBy !== req.user.id) {
      console.log('Unauthorized access to goal:', gid);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.goal.delete({
      where: { gid: parseInt(gid) },
    });

    console.log('Goal deleted:', gid);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting goal:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/employees', authenticateToken, blockEmployee, async (req, res) => {
  try {
    const { isActive } = req.query;
    const where = {};
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    const items = await prisma.employee.findMany({ where, orderBy: { id: 'desc' } });
    res.json(items);
  } catch (error) {
    console.error('Fetch employees error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/employees/:id', authenticateToken, blockEmployee, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const item = await prisma.employee.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Employee not found' });
    res.json(item);
  } catch (error) {
    console.error('Get employee error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/employees', authenticateToken, blockEmployee, upload.fields([{ name: 'profileImage', maxCount: 1 }]), async (req, res) => {
  try {
    const pick = (v) => Array.isArray(v) ? v[0] : v;
    const firstName = pick(req.body.firstName);
    const lastName = pick(req.body.lastName);
    const email = pick(req.body.email);
    const phone = pick(req.body.phone);
    const department = pick(req.body.department);
    const position = pick(req.body.position);
    const departmentIdRaw = pick(req.body.departmentId);
    const positionIdRaw = pick(req.body.positionId);
    const hireDate = pick(req.body.hireDate);
    const isActive = pick(req.body.isActive);
    const userId = pick(req.body.userId);
    const gender = pick(req.body.gender);
    const age = pick(req.body.age);
    const birthDate = pick(req.body.birthDate);
    const profileImageUrl = pick(req.body.profileImageUrl);
    const username = pick(req.body.username);
    const password = pick(req.body.password);

    const firstNameTrim = typeof firstName === 'string' ? firstName.trim() : '';
    const lastNameTrim = typeof lastName === 'string' ? lastName.trim() : '';
    const emailTrim = typeof email === 'string' ? email.trim() : '';
    if (!firstNameTrim || !lastNameTrim || !emailTrim) {
      return res.status(400).json({ error: 'firstName, lastName, email are required' });
    }

    const uploadedFile = Array.isArray(req.files?.profileImage) ? req.files.profileImage[0] : null;
    const existingByEmail = await prisma.employee.findFirst({ where: { email: emailTrim } });
    if (existingByEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Resolve department/position names if IDs provided
    let departmentResolved = department || null;
    let positionResolved = position || null;
    let departmentIdFK = null;
    let positionIdFK = null;
    if (departmentIdRaw != null && String(departmentIdRaw).trim() !== '') {
      const depId = parseInt(departmentIdRaw, 10);
      if (!Number.isNaN(depId)) {
        const dep = await prisma.department.findUnique({ where: { id: depId } });
        if (dep) {
          departmentResolved = dep.name;
          departmentIdFK = dep.id;
        }
      }
    }
    if (positionIdRaw != null && String(positionIdRaw).trim() !== '') {
      const posId = parseInt(positionIdRaw, 10);
      if (!Number.isNaN(posId)) {
        const pos = await prisma.position.findUnique({ where: { id: posId } });
        if (pos) {
          positionResolved = pos.name;
          positionIdFK = pos.id;
        }
      }
    }

    const baseEmployeeData = {
      firstName: firstNameTrim,
      lastName: lastNameTrim,
      email: emailTrim,
      phone: phone || null,
      department: departmentResolved,
      position: positionResolved,
      hireDate: hireDate ? new Date(hireDate) : null,
      gender: gender || null,
      age: age == null || age === '' ? null : parseInt(age, 10),
      birthDate: birthDate ? new Date(birthDate) : null,
      profileImageUrl: uploadedFile ? `/uploads/${path.basename(uploadedFile.path)}` : (profileImageUrl || null),
      isActive: isActive == null ? true : isTrueLike(isActive),
      userId: userId != null && userId !== '' && !Number.isNaN(parseInt(userId, 10)) ? parseInt(userId, 10) : null,
    };
    const created = await prisma.$transaction(async (tx) => {
      const data = { ...baseEmployeeData };
      if (!data.userId && username && password) {
        let userName = String(username).trim().toLowerCase();
        const exists = await tx.user.findFirst({ where: { userName } });
        if (exists) throw Object.assign(new Error('Username already exists'), { httpCode: 409 });
        const hashed = await bcrypt.hash(String(password), 10);
        const createdUser = await tx.user.create({
          data: {
            fullName: `${data.firstName} ${data.lastName}`.trim(),
            userName,
            password: hashed,
            gender: data.gender || null,
            age: data.age == null ? null : Number(data.age),
            role: 'Employee',
            status: 'true',
            locked: 'false',
            isFirstLogin: 'true',
            activeStatus: 'true',
            createdDate: new Date(),
            createdBy: req.user.id,
          },
        });
        data.userId = createdUser.id;
      }

      const createdEmployee = await tx.employee.create({ data });

      if (createdEmployee.userId) {
        await tx.user.update({
          where: { id: createdEmployee.userId },
          data: {
            ...(createdEmployee.isActive
              ? { activeStatus: 'true', status: 'true', locked: 'false' }
              : { activeStatus: 'false', status: 'false', locked: 'true' }),
            ...(departmentIdFK ? { departmentId: departmentIdFK } : {}),
            ...(positionIdFK ? { positionId: positionIdFK } : {}),
          },
        });
      }

      return createdEmployee;
    });

    res.status(201).json(created);
  } catch (error) {
    if (error?.httpCode) return res.status(error.httpCode).json({ error: error.message });
    if (error.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    console.error('Create employee error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/employees/:id', authenticateToken, blockEmployee, upload.fields([{ name: 'profileImage', maxCount: 1 }]), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Employee not found' });

    const pick = (v) => Array.isArray(v) ? v[0] : v;
    const firstName = pick(req.body.firstName);
    const lastName = pick(req.body.lastName);
    const email = pick(req.body.email);
    const phone = pick(req.body.phone);
    const department = pick(req.body.department);
    const position = pick(req.body.position);
    const departmentIdRaw = pick(req.body.departmentId);
    const positionIdRaw = pick(req.body.positionId);
    const hireDate = pick(req.body.hireDate);
    const isActive = pick(req.body.isActive);
    const userId = pick(req.body.userId);
    const gender = pick(req.body.gender);
    const age = pick(req.body.age);
    const birthDate = pick(req.body.birthDate);
    const profileImageUrl = pick(req.body.profileImageUrl);

    const uploadedFile = Array.isArray(req.files?.profileImage) ? req.files.profileImage[0] : null;

    // Resolve department/position when ids are provided
    let departmentResolved = department === undefined ? existing.department : department;
    let positionResolved = position === undefined ? existing.position : position;
    let departmentIdFK = undefined;
    let positionIdFK = undefined;
    if (departmentIdRaw !== undefined) {
      if (departmentIdRaw == null || String(departmentIdRaw).trim() === '') {
        departmentResolved = null;
        departmentIdFK = null;
      } else {
        const depId = parseInt(departmentIdRaw, 10);
        if (!Number.isNaN(depId)) {
          const dep = await prisma.department.findUnique({ where: { id: depId } });
          if (dep) {
            departmentResolved = dep.name;
            departmentIdFK = dep.id;
          }
        }
      }
    }
    if (positionIdRaw !== undefined) {
      if (positionIdRaw == null || String(positionIdRaw).trim() === '') {
        positionResolved = null;
        positionIdFK = null;
      } else {
        const posId = parseInt(positionIdRaw, 10);
        if (!Number.isNaN(posId)) {
          const pos = await prisma.position.findUnique({ where: { id: posId } });
          if (pos) {
            positionResolved = pos.name;
            positionIdFK = pos.id;
          }
        }
      }
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        email: email ?? existing.email,
        phone: phone === undefined ? existing.phone : phone,
        department: departmentResolved,
        position: positionResolved,
        hireDate: hireDate === undefined ? existing.hireDate : (hireDate ? new Date(hireDate) : null),
        gender: gender === undefined ? existing.gender : gender,
        age: age === undefined ? existing.age : (age == null || age === '' ? null : parseInt(age, 10)),
        birthDate: birthDate === undefined ? existing.birthDate : (birthDate ? new Date(birthDate) : null),
        profileImageUrl: uploadedFile ? `/uploads/${path.basename(uploadedFile.path)}` : (profileImageUrl === undefined ? existing.profileImageUrl : profileImageUrl),
        isActive: isActive === undefined ? existing.isActive : isTrueLike(isActive),
        userId: userId === undefined ? existing.userId : (userId != null && userId !== '' ? parseInt(userId, 10) : null),
      },
    });
    if (updated.userId != null) {
      const activeData = updated.isActive !== existing.isActive
        ? (updated.isActive
          ? { activeStatus: 'true', status: 'true', locked: 'false' }
          : { activeStatus: 'false', status: 'false', locked: 'true' })
        : {};
      const orgData = {
        ...(departmentIdFK !== undefined ? { departmentId: departmentIdFK } : {}),
        ...(positionIdFK !== undefined ? { positionId: positionIdFK } : {}),
      };
      if (Object.keys(activeData).length || Object.keys(orgData).length) {
        await prisma.user.update({ where: { id: updated.userId }, data: { ...activeData, ...orgData } });
      }
    }
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Update employee error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.patch('/api/employees/:id/activate', authenticateToken, blockEmployee, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: true } });
    if (updated.userId) {
      await prisma.user.update({
        where: { id: updated.userId },
        data: {
          activeStatus: 'true',
          status: 'true',
          locked: 'false',
        },
      });
    }
    res.json(updated);
  } catch (error) {
    console.error('Activate employee error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.patch('/api/employees/:id/deactivate', authenticateToken, blockEmployee, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: false } });
    if (updated.userId) {
      await prisma.user.update({
        where: { id: updated.userId },
        data: {
          activeStatus: 'false',
          status: 'false',
          locked: 'true',
        },
      });
    }
    res.json(updated);
  } catch (error) {
    console.error('Deactivate employee error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});



// Create Department
app.post('/api/departments', authenticateToken, authorizeRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { name, managerId } = req.body;
  try {
    const department = await prisma.department.create({
      data: {
        name,
        managerId: managerId ? parseInt(managerId) : null,
      },
    });
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Get All Departments
app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: { manager: { select: { fullName: true } }, users: { select: { id: true, fullName: true } } },
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Update Department
app.put('/api/departments/:id', authenticateToken, authorizeRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { id } = req.params;
  const { name, managerId } = req.body;
  try {
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: {
        name,
        managerId: managerId ? parseInt(managerId) : null,
      },
    });
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete Department
app.delete('/api/departments/:id', authenticateToken, authorizeRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.department.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// === POSITIONS ENDPOINTS ===

// Create Position
app.post('/api/positions', authenticateToken, authorizeRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { name, level, reportsTo } = req.body;
  try {
    const position = await prisma.position.create({
      data: {
        name,
        level: parseInt(level),
        reportsTo: reportsTo ? parseInt(reportsTo) : null,
      },
    });
    res.status(201).json(position);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create position' });
  }
});

// Get All Positions
app.get('/api/positions', authenticateToken, async (req, res) => {
  try {
    const positions = await prisma.position.findMany({
      include: { subordinates: true, users: { select: { id: true, fullName: true } } },
    });
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Update Position
app.put('/api/positions/:id', authenticateToken, authorizeRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { id } = req.params;
  const { name, level, reportsTo } = req.body;
  try {
    const position = await prisma.position.update({
      where: { id: parseInt(id) },
      data: {
        name,
        level: parseInt(level),
        reportsTo: reportsTo ? parseInt(reportsTo) : null,
      },
    });
    res.json(position);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update position' });
  }
});

// Delete Position
app.delete('/api/positions/:id', authenticateToken, authorizeRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.position.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete position' });
  }
});
// Removed duplicate inline key-result-progress route.

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});