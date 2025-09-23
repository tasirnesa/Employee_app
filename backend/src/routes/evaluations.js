const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma/client');
const bcrypt = require('bcrypt');

router.get('/', async (req, res) => {
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        evaluator: { select: { fullName: true } },
        evaluatee: { select: { fullName: true } },
      },
    });
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Create evaluation; supports either evaluateeID (user) or evaluateeEmployeeId (employee)
router.post('/', async (req, res) => {
  try {
    const { evaluation, results } = req.body;
    if (!evaluation) return res.status(400).json({ error: 'Missing evaluation payload' });
    let { evaluatorID, evaluateeID, evaluationType, sessionID, evaluateeEmployeeId } = evaluation;
    if (!evaluatorID || (!evaluateeID && !evaluateeEmployeeId) || !evaluationType || !sessionID) {
      return res.status(400).json({ error: 'Missing required fields: evaluatorID, evaluateeID or evaluateeEmployeeId, evaluationType, sessionID' });
    }

    if (evaluateeEmployeeId && !evaluateeID) {
      const empId = parseInt(evaluateeEmployeeId);
      const employee = await prisma.employee.findUnique({ where: { id: empId } });
      if (!employee) return res.status(400).json({ error: `Employee with id ${empId} does not exist` });
      if (!employee.userId) {
        const baseUserName = (employee.email?.split('@')[0] || `${employee.firstName}.${employee.lastName}`).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || `emp${empId}`;
        let userName = baseUserName;
        let suffix = 0;
        // ensure uniqueness
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

    if (parseInt(evaluatorID) === parseInt(evaluateeID)) {
      return res.status(400).json({ error: 'Evaluator and evaluatee cannot be the same person' });
    }

    // If evaluateeID provided but not a user, treat as employee id
    if (evaluateeID && !Number.isNaN(parseInt(evaluateeID))) {
      const userCandidate = await prisma.user.findUnique({ where: { id: parseInt(evaluateeID) } });
      if (!userCandidate) {
        const empId = parseInt(evaluateeID);
        const employee = await prisma.employee.findUnique({ where: { id: empId } });
        if (employee) {
          if (!employee.userId) {
            const baseUserName = (employee.email?.split('@')[0] || `${employee.firstName}.${employee.lastName}`).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || `emp${empId}`;
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
            await prisma.employee.update({ where: { id: empId }, data: { userId: createdUser.id } });
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

    if (!evaluatorExists) return res.status(400).json({ error: `Evaluator with id ${evaluatorID} does not exist` });
    if (!evaluateeExists) return res.status(400).json({ error: `Evaluatee with id ${evaluateeID} does not exist` });
    if (!sessionExists) return res.status(400).json({ error: `Session with id ${sessionID} does not exist` });

    const evaluationResult = await prisma.evaluation.create({
      data: {
        evaluatorID: parseInt(evaluatorID),
        evaluateeID: parseInt(evaluateeID),
        evaluationType,
        sessionID: parseInt(sessionID),
        evaluationDate: new Date(),
      },
    });

    let createManyResult = { count: 0 };
    if (results && Array.isArray(results) && results.length > 0) {
      const validResults = results.filter((r) => r.criteriaID != null);
      if (validResults.length) {
        createManyResult = await prisma.evaluationResult.createMany({
          data: validResults.map((r) => ({
            evaluationID: evaluationResult.evaluationID,
            criteriaID: r.criteriaID,
            score: r.score,
            feedback: r.feedback || null,
          })),
        });
      }
    }

    return res.status(201).json({ ...evaluationResult, resultsCount: createManyResult.count });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;


