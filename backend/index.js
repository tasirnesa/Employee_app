const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

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
    const token = jwt.sign({ id: user.id, username: user.userName }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Login successful:', username);
    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error.message, error.stack); 
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    // console.log('Headers for /api/users/me:', req.headers);
    const userId = req.user.id; 
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log('User not found for id:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Current user fetched:', user);
    res.json(user);
  } catch (error) {
    console.error('Fetch current user error:', error.message);
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


app.get('/api/users', authenticateToken, async (req, res) => {
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
    let { evaluatorID, evaluateeID, evaluationType, sessionID, evaluateeEmployeeId } = evaluation;
    if (!evaluatorID || (!evaluateeID && !evaluateeEmployeeId) || !evaluationType || !sessionID) {
      console.log('Missing required fields:', { evaluatorID, evaluateeID, evaluateeEmployeeId, evaluationType, sessionID });
      return res.status(400).json({ error: 'Missing required fields: evaluatorID, evaluateeID or evaluateeEmployeeId, evaluationType, sessionID' });
    }

    if (evaluatorID === evaluateeID) {
      console.log('Evaluator and evaluatee cannot be the same:', { evaluatorID, evaluateeID });
      return res.status(400).json({ error: 'Evaluator and evaluatee cannot be the same person' });
    }

    // If evaluatee supplied via employee, resolve to user id (auto-create and link if needed)
    if (!evaluateeID && evaluateeEmployeeId) {
      const empId = parseInt(evaluateeEmployeeId);
      const employee = await prisma.employee.findUnique({ where: { id: empId } });
      if (!employee) return res.status(400).json({ error: `Employee with id ${empId} does not exist` });
      if (!employee.userId) {
        // Auto-create a user for this employee and link
        const baseUserName = (employee.email?.split('@')[0] || `${employee.firstName}.${employee.lastName}`).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
        let userName = baseUserName || `emp${empId}`;
        // ensure unique username
        let suffix = 0;
        // eslint-disable-next-line no-constant-condition
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

    // If evaluateeID is provided, but does not correspond to a user, treat it as an employee id
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
            // eslint-disable-next-line no-constant-condition
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

    // Validate foreign keys before create to avoid FK constraint errors
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
    const criteria = await prisma.evaluationCriteria.findMany({
      include: {
        creator: { select: { fullName: true } },
      },
    });
    // Fallback: if some rows have creator null but createdBy set, enrich names
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
    const results = await prisma.evaluationResult.findMany();
    console.log('Results fetched:', results);
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


app.post('/api/users', authenticateToken, async (req, res) => {
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

app.post('/api/criteria', authenticateToken, async (req, res) => {
  console.log('Create criteria request received with body:', req.body);
  try {
    const { title, description } = req.body;

    if (!title || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields: title and createdBy' });
    }

    const criteria = await prisma.evaluationCriteria.create({
      data: {
        title,
        description,
        createdDate: new Date(),
        createdBy: req.user.id,
      },
      include: { creator: { select: { fullName: true } } }
    });

    console.log('Criteria created:', criteria);
    res.status(201).json({ ...criteria, creatorName: criteria.creator?.fullName || null });
  } catch (error) {
    console.error('Create criteria error:', error.message);
    res.status(500).json({ error: 'Failed to create criteria' });
  }
});

// Update criteria
app.put('/api/criteria/:id', authenticateToken, async (req, res) => {
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

// Delete criteria
app.delete('/api/criteria/:id', authenticateToken, async (req, res) => {
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

// Authorize criteria (assign current user as creator)
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
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    console.log('Performance data fetched:', performanceData);
    res.status(200).json(performanceData);
  } catch (error) {
    console.error('Fetch performance data error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Helpers for performance calculation
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

// POST /api/performance/recalculate { userId, periodStart?, periodEnd?, evaluationPeriod? }
app.post('/api/performance/recalculate', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const { start, end, label } = coercePeriod(req.body);

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(400).json({ error: `User ${userId} does not exist` });

    // 1) Evaluation score (normalize 1-5 to 0-100)
    const evalResults = await prisma.evaluationResult.findMany({
      where: {
        evaluation: {
          evaluateeID: parseInt(userId),
          evaluationDate: { gte: start, lte: end },
        },
      },
      select: { score: true },
    });
    const evalScores100 = evalResults.map((r) => mapScoreTo100(r.score)).filter((x) => x != null);
    const evaluationScore = safeAvg(evalScores100); // 0..100

    // 2) Goals score: use average progress (0..100) for goals with duedate in period (fallback all goals)
    let goals = await prisma.goal.findMany({
      where: {
        activatedBy: parseInt(userId),
        OR: [
          { duedate: { gte: start, lte: end } },
          { duedate: null },
        ],
      },
      select: { progress: true },
    });
    const goalProgress = goals.map((g) => (g.progress == null ? 0 : Number(g.progress))).filter((n) => !Number.isNaN(n));
    const goalsScore = safeAvg(goalProgress); // already 0..100 convention

    // 3) Productivity: if raw perf records exist in period, derive a score vs benchmark
    const rawPerf = await prisma.performance.findMany({
      where: { userId: parseInt(userId), date: { gte: start, lte: end } },
      select: { tasksCompleted: true, hoursWorked: true },
    });
    let productivityScore = null;
    if (rawPerf.length) {
      const totalTasks = rawPerf.reduce((s, r) => s + (r.tasksCompleted || 0), 0);
      // Simple benchmark: 40 tasks per period → 100
      const targetTasks = 40;
      productivityScore = Math.min(100, (totalTasks / targetTasks) * 100);
    }

    // 4) Punctuality: placeholder unless you track it elsewhere
    const punctualityScore = null;

    // Weights (adjustable)
    const weights = { evaluation: 0.5, goals: 0.25, productivity: 0.15, punctuality: 0.1 };
    const components = {
      evaluation: isNaN(evaluationScore) ? 0 : evaluationScore,
      goals: isNaN(goalsScore) ? 0 : goalsScore,
      productivity: productivityScore == null ? 0 : productivityScore,
      punctuality: punctualityScore == null ? 0 : punctualityScore,
    };
    const overallRating =
      components.evaluation * weights.evaluation +
      components.goals * weights.goals +
      components.productivity * weights.productivity +
      components.punctuality * weights.punctuality;

    // Upsert (find existing by userId + period label)
    const existing = await prisma.performance.findFirst({ where: { userId: parseInt(userId), evaluationPeriod: label } });
    let saved;
    if (existing) {
      saved = await prisma.performance.update({
        where: { id: existing.id },
        data: {
          evaluatorId: req.user.id,
          tasksCompleted: rawPerf.reduce((s, r) => s + (r.tasksCompleted || 0), 0),
          hoursWorked: rawPerf.reduce((s, r) => s + (r.hoursWorked || 0), 0),
          efficiencyScore: null,
          qualityScore: null,
          punctualityScore: punctualityScore,
          collaborationScore: null,
          innovationScore: null,
          overallRating,
          feedback: null,
          evaluationPeriod: label,
          date: end,
        },
      });
    } else {
      saved = await prisma.performance.create({
        data: {
          userId: parseInt(userId),
          evaluatorId: req.user.id,
          tasksCompleted: rawPerf.reduce((s, r) => s + (r.tasksCompleted || 0), 0),
          hoursWorked: rawPerf.reduce((s, r) => s + (r.hoursWorked || 0), 0),
          overallRating,
          evaluationPeriod: label,
          date: end,
        },
      });
    }

    return res.status(200).json({
      message: 'Recalculated',
      period: { start, end, label },
      components,
      overallRating,
      performance: saved,
    });
  } catch (error) {
    console.error('Recalculate performance error:', error.message);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/performance/recalculate-all { periodStart?, periodEnd?, evaluationPeriod? }
app.post('/api/performance/recalculate-all', authenticateToken, async (req, res) => {
  try {
    const { start, end, label } = coercePeriod(req.body);
    const users = await prisma.user.findMany({ select: { id: true } });
    const results = [];
    for (const u of users) {
      const r = await fetch(`http://localhost:3000/api/performance/recalculate`); // placeholder to satisfy linter
      // Instead of HTTP, call the same logic inline for efficiency:
      const evalResults = await prisma.evaluationResult.findMany({
        where: { evaluation: { evaluateeID: u.id, evaluationDate: { gte: start, lte: end } } },
        select: { score: true },
      });
      const evalScores100 = evalResults.map((r) => mapScoreTo100(r.score)).filter((x) => x != null);
      const evaluationScore = safeAvg(evalScores100);
      let goals = await prisma.goal.findMany({
        where: { activatedBy: u.id, OR: [{ duedate: { gte: start, lte: end } }, { duedate: null }] },
        select: { progress: true },
      });
      const goalProgress = goals.map((g) => (g.progress == null ? 0 : Number(g.progress))).filter((n) => !Number.isNaN(n));
      const goalsScore = safeAvg(goalProgress);
      const rawPerf = await prisma.performance.findMany({ where: { userId: u.id, date: { gte: start, lte: end } }, select: { tasksCompleted: true, hoursWorked: true } });
      let productivityScore = null;
      if (rawPerf.length) {
        const totalTasks = rawPerf.reduce((s, r) => s + (r.tasksCompleted || 0), 0);
        const targetTasks = 40;
        productivityScore = Math.min(100, (totalTasks / targetTasks) * 100);
      }
      const components = {
        evaluation: isNaN(evaluationScore) ? 0 : evaluationScore,
        goals: isNaN(goalsScore) ? 0 : goalsScore,
        productivity: productivityScore == null ? 0 : productivityScore,
        punctuality: 0,
      };
      const weights = { evaluation: 0.5, goals: 0.25, productivity: 0.15, punctuality: 0.1 };
      const overallRating =
        components.evaluation * weights.evaluation +
        components.goals * weights.goals +
        components.productivity * weights.productivity +
        components.punctuality * weights.punctuality;
      const existing = await prisma.performance.findFirst({ where: { userId: u.id, evaluationPeriod: label } });
      if (existing) {
        await prisma.performance.update({ where: { id: existing.id }, data: { overallRating, evaluationPeriod: label, date: end } });
      } else {
        await prisma.performance.create({ data: { userId: u.id, evaluatorId: req.user.id, tasksCompleted: 0, hoursWorked: 0, overallRating, evaluationPeriod: label, date: end } });
      }
      results.push({ userId: u.id, overallRating });
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

// Employees CRUD and activation
app.get('/api/employees', authenticateToken, async (req, res) => {
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

app.get('/api/employees/:id', authenticateToken, async (req, res) => {
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

app.post('/api/employees', authenticateToken, async (req, res) => {
  console.log('Create employee request:', req.body);
  try {
    const { firstName, lastName, email, phone, department, position, hireDate, isActive, userId } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, email are required' });
    }
    const created = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        department: department || null,
        position: position || null,
        hireDate: hireDate ? new Date(hireDate) : null,
        isActive: isActive == null ? true : Boolean(isActive),
        userId: userId != null && !Number.isNaN(parseInt(userId)) ? parseInt(userId) : null,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Create employee error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  console.log('Update employee request:', req.params, req.body);
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Employee not found' });
    const { firstName, lastName, email, phone, department, position, hireDate, isActive, userId } = req.body;
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        email: email ?? existing.email,
        phone: phone === undefined ? existing.phone : phone,
        department: department === undefined ? existing.department : department,
        position: position === undefined ? existing.position : position,
        hireDate: hireDate === undefined ? existing.hireDate : (hireDate ? new Date(hireDate) : null),
        isActive: isActive === undefined ? existing.isActive : Boolean(isActive),
        userId: userId === undefined ? existing.userId : (userId != null ? parseInt(userId) : null),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Update employee error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.patch('/api/employees/:id/activate', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: true } });
    res.json(updated);
  } catch (error) {
    console.error('Activate employee error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.patch('/api/employees/:id/deactivate', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await prisma.employee.update({ where: { id }, data: { isActive: false } });
    res.json(updated);
  } catch (error) {
    console.error('Deactivate employee error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});