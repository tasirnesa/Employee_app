const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
<<<<<<< HEAD
=======
const jwt = require('jsonwebtoken');
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Initialize Prisma Client
=======

>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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

<<<<<<< HEAD
// Middleware to normalize auth headers
const getAuthHeader = (req) => {
  const authHeader = req.headers['authorization'] || req.headers['auth'] || '';
  console.log('getAuthHeader result:', authHeader);
  return authHeader;
=======
const getAuthHeader = (req) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  console.log('Raw auth header:', authHeader);
  return authHeader; 
};


const SECRET_KEY = 'a-very-secure-secret-key-2025'; 

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
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received with body:', req.body);
    if (!req.body) {
      console.log('Missing request body');
      return res.status(400).json({ error: 'Request body is missing' });
    }
    const { username, password } = req.body;
    if (!username || !password) {
      console.log('Missing username or password:', { username, password });
      return res.status(400).json({ error: 'Username and password are required' });
    }
<<<<<<< HEAD
=======
    
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    console.log('Login attempt:', { username, password });
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
<<<<<<< HEAD
    console.log('Login successful:', username);
    res.json({ token: 'dummy-token', user });
  } catch (error) {
    console.error('Login error:', error.message);
=======
    const token = jwt.sign({ id: user.id, username: user.userName }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Login successful:', username);
    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error.message, error.stack); 
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

<<<<<<< HEAD
// Get current user
app.get('/api/users/me', async (req, res) => {
  try {
    console.log('Headers for /api/users/me:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await prisma.user.findUnique({ where: { id: 1 } });
    if (!user) {
      console.log('User not found for id: 1');
=======

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    // console.log('Headers for /api/users/me:', req.headers);
    const userId = req.user.id; 
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log('User not found for id:', userId);
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Current user fetched:', user);
    res.json(user);
  } catch (error) {
    console.error('Fetch current user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

<<<<<<< HEAD
// Update current user
app.put('/api/users/me', async (req, res) => {
  try {
    console.log('Headers for /api/users/me:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
=======
app.put('/api/users/me', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/users/me:', req.headers);
    const userId = req.user.id; 
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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
<<<<<<< HEAD
      where: { id: 1 },
=======
      where: { id: userId },
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
      data: updateData,
    });
    console.log('User updated:', user);
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

<<<<<<< HEAD
// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    console.log('Headers for /api/users/:id:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
=======
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/users/:id:', req.headers);
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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

<<<<<<< HEAD
// Get all users
app.get('/api/users', async (req, res) => {
  try {
    console.log('Headers for /api/users:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
=======

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/users:', req.headers);
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    const users = await prisma.user.findMany();
    console.log('Users fetched:', users);
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

<<<<<<< HEAD
// Get evaluations
app.get('/api/evaluations', async (req, res) => {
  try {
    console.log('Headers for /api/evaluations:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const evaluations = await prisma.evaluation.findMany();
    console.log('Evaluations fetched:', evaluations);
    res.json(evaluations);
  } catch (error) {
    console.error('Fetch evaluations error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get criteria
app.get('/api/criteria', async (req, res) => {
  try {
    console.log('Headers for /api/criteria:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
=======
app.get('/api/evaluations', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching evaluations with headers:', req.headers);
    const evaluations = await prisma.evaluation.findMany({
      include: {
        evaluator: { select: { fullName: true } }, 
        evaluatee: { select: { fullName: true } }, 
      },
    });
    console.log('Evaluations fetched:', JSON.stringify(evaluations, null, 2));
    if (!evaluations.length) {
      console.log('No evaluations found');
      return res.status(404).json({ message: 'No evaluations found' });
    }
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
app.post('/api/evaluations', authenticateToken, async (req, res) => {
  console.log('Create evaluation request received with body:', req.body);
  try {
    const { evaluation, results } = req.body;
    const { evaluatorID, evaluateeID, evaluationType, sessionID } = evaluation;
    if (!evaluatorID || !evaluateeID || !evaluationType || !sessionID) {
      console.log('Missing required fields:', { evaluatorID, evaluateeID, evaluationType, sessionID });
      return res.status(400).json({ error: 'Missing required fields: evaluatorID, evaluateeID, evaluationType, sessionID' });
    }

    if (evaluatorID === evaluateeID) {
      console.log('Evaluator and evaluatee cannot be the same:', { evaluatorID, evaluateeID });
      return res.status(400).json({ error: 'Evaluator and evaluatee cannot be the same person' });
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

    let evaluationResults = { count: 0 }; // Default value
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
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    const criteria = await prisma.evaluationCriteria.findMany();
    console.log('Criteria fetched:', criteria);
    res.json(criteria);
  } catch (error) {
    console.error('Fetch criteria error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

<<<<<<< HEAD
// Get results
app.get('/api/results', async (req, res) => {
  try {
    console.log('Headers for /api/results:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
=======

app.get('/api/results', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/results:', req.headers);
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    const results = await prisma.evaluationResult.findMany();
    console.log('Results fetched:', results);
    res.json(results);
  } catch (error) {
    console.error('Fetch results error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

<<<<<<< HEAD
// Get evaluation sessions
app.get('/api/sessions', async (req, res) => {
  try {
    console.log('Headers for /api/sessions:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
=======
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    console.log('Headers for /api/sessions:', req.headers);
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    const sessions = await prisma.evaluationSession.findMany();
    console.log('Sessions fetched:', sessions);
    res.json(sessions);
  } catch (error) {
    console.error('Fetch sessions error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

<<<<<<< HEAD
app.post('/api/users', async (req, res) => {
=======

app.post('/api/users', authenticateToken, async (req, res) => {
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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

<<<<<<< HEAD
    // Validate required fields
=======
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    if (!fullName || !userName || !password || !role || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

<<<<<<< HEAD
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
=======
    const hashedPassword = await bcrypt.hash(password, 10);

>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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

<<<<<<< HEAD

// New endpoint: Create Criteria
app.post('/api/criteria', async (req, res) => {
=======
app.post('/api/criteria', authenticateToken, async (req, res) => {
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
  console.log('Create criteria request received with body:', req.body);
  try {
    const { title, description, createdBy } = req.body;

    if (!title || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields: title and createdBy' });
    }

    const criteria = await prisma.evaluationCriteria.create({
      data: {
        title,
        description,
        createdDate: new Date(),
        createdBy: parseInt(createdBy),
      },
    });

    console.log('Criteria created:', criteria);
    res.status(201).json(criteria);
  } catch (error) {
    console.error('Create criteria error:', error.message);
    res.status(500).json({ error: 'Failed to create criteria' });
  }
});
<<<<<<< HEAD
// New endpoint: Get Criteria
app.get('/api/criteria', async (req, res) => {
  console.log('Headers for /api/criteria:', req.headers);
  try {
    const criteria = await prisma.criteria.findMany();
    console.log('Criteria fetched:', criteria);
    res.json(criteria);
  } catch (error) {
    console.error('Fetch criteria error:', error.message);
    res.status(500).json({ error: 'Failed to fetch criteria' });
  }
});


app.post('/api/evaluations', async (req, res) => {
  console.log('Create evaluation request received with body:', req.body);
  try {
    const { evaluatorID, evaluateeID, evaluationType, sessionID } = req.body;

    if (!evaluatorID || !evaluateeID || !evaluationType || !sessionID) {
      return res.status(400).json({ error: 'Missing required fields: evaluatorID, evaluateeID, evaluationType, sessionID' });
    }

    if (evaluatorID === evaluateeID) {
      return res.status(400).json({ error: 'Evaluator and evaluatee cannot be the same person' });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        evaluatorID: parseInt(evaluatorID),
        evaluateeID: parseInt(evaluateeID),
        evaluationType,
        sessionID: parseInt(sessionID),
        evaluationDate: new Date(),
      },
    });

    console.log('Evaluation created:', evaluation);
    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Create evaluation error:', error.message);
    res.status(500).json({ error: 'Failed to create evaluation' });
  }
});

// Get evaluations endpoint
app.get('/api/evaluations', async (req, res) => {
  console.log('Headers for /api/evaluations:', req.headers);
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        evaluator: { select: { fullName: true } },
        evaluatee: { select: { fullName: true } },
      },
    });
    console.log('Evaluations fetched:', evaluations);
    res.json(evaluations);
  } catch (error) {
    console.error('Fetch evaluations error:', error.message);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// Graceful shutdown
=======




app.post('/api/evaluation-sessions', authenticateToken, async (req, res) => {
  console.log('Create evaluation session request received with body:', req.body);
  try {
    const { title, startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      console.log('Missing required fields:', { title, startDate, endDate });
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
      },
    });

    console.log('Evaluation session created:', session);
    res.status(201).json(session);
  } catch (error) {
    console.error('Create evaluation session error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
app.get('/api/evaluation-sessions', (req, res) => {
  const sessions = [
    { id: 1, title: "Team Meeting", startDate: "2025-07-30", endDate: "2025-07-31" },
    { id: 2, title: "Evaluation", startDate: "2025-07-28", endDate: "2025-08-03" },
  ];
  res.json(sessions);
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
      meetings: 0 // Placeholder; adjust if "Meetings" has a specific definition
    });
  } catch (error) {
    console.error('Error fetching session stats:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});



app.get('/api/performance', authenticateToken, async (req, res) => {
  console.log('Fetching performance data');
  try {
    const performanceData = await prisma.performance.findMany({
      where: { ActivatedBy: parseInt(req.user.id) }, // Default to user's data
    });
    console.log('Performance data fetched:', performanceData);
    res.status(200).json(performanceData);
  } catch (error) {
    console.error('Fetch performance data error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});




 // goals 

 // GET all goals for the authenticated user
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: {
        activatedBy: req.user.id, // Filter by authenticated user
      },
    });
    console.log('Fetched goals:', goals);
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST a new goal
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
        keyResult: Array.isArray(keyResult) ? keyResult : [keyResult || ''], // Ensure it's an array
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

// PUT (edit) an existing goal
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

// DELETE a goal
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
    res.status(204).send(); // No content on successful delete
  } catch (error) {
    console.error('Error deleting goal:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});