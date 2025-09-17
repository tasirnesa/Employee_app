const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Prisma Client
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

// Middleware to normalize auth headers
const getAuthHeader = (req) => {
  const authHeader = req.headers['authorization'] || req.headers['auth'] || '';
  console.log('getAuthHeader result:', authHeader);
  return authHeader;
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
    console.log('Login successful:', username);
    res.json({ token: 'dummy-token', user });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

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
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Current user fetched:', user);
    res.json(user);
  } catch (error) {
    console.error('Fetch current user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update current user
app.put('/api/users/me', async (req, res) => {
  try {
    console.log('Headers for /api/users/me:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
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
      where: { id: 1 },
      data: updateData,
    });
    console.log('User updated:', user);
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    console.log('Headers for /api/users/:id:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
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

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    console.log('Headers for /api/users:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const users = await prisma.user.findMany();
    console.log('Users fetched:', users);
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

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
    const criteria = await prisma.evaluationCriteria.findMany();
    console.log('Criteria fetched:', criteria);
    res.json(criteria);
  } catch (error) {
    console.error('Fetch criteria error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get results
app.get('/api/results', async (req, res) => {
  try {
    console.log('Headers for /api/results:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const results = await prisma.evaluationResult.findMany();
    console.log('Results fetched:', results);
    res.json(results);
  } catch (error) {
    console.error('Fetch results error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get evaluation sessions
app.get('/api/sessions', async (req, res) => {
  try {
    console.log('Headers for /api/sessions:', req.headers);
    const authHeader = getAuthHeader(req);
    if (!authHeader || authHeader !== 'Bearer dummy-token') {
      console.log('Unauthorized: Invalid or missing token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const sessions = await prisma.evaluationSession.findMany();
    console.log('Sessions fetched:', sessions);
    res.json(sessions);
  } catch (error) {
    console.error('Fetch sessions error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/users', async (req, res) => {
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

    // Validate required fields
    if (!fullName || !userName || !password || !role || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
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


// New endpoint: Create Criteria
app.post('/api/criteria', async (req, res) => {
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
process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});