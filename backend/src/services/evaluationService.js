const evaluationRepository = require('../repositories/evaluationRepository');
const employeeRepository = require('../repositories/employeeRepository');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/prisma'); // For transaction if needed, but repo handles most
const bcrypt = require('bcrypt');

const evaluationService = {
  getAllEvaluations: async () => {
    return await evaluationRepository.findAll();
  },

  getEvaluationDetails: async (evaluationId) => {
    const evaluation = await evaluationRepository.findById(evaluationId);
    if (!evaluation) throw new Error('Evaluation not found');

    const [results, goals] = await Promise.all([
      evaluationRepository.findResultsByEvaluationId(evaluationId),
      prisma.goal.findMany({
        where: { activatedBy: evaluation.evaluateeID },
        orderBy: { gid: 'desc' },
      }),
    ]);

    return { evaluation, results, goals };
  },

  getUserSummary: async (userId) => {
    const results = await evaluationRepository.findResultsByEvaluateeId(userId);
    if (!results.length) return { averagePercent: 0, count: 0 };

    const to100 = (s) => ((Math.max(1, Math.min(5, Number(s))) - 1) / 4) * 100;
    const percents = results.map(r => to100(r.score));
    const avg = percents.reduce((a, b) => a + b, 0) / percents.length;

    return { averagePercent: Math.round(avg), count: results.length };
  },

  getAllResults: async (user) => {
    const whereClause = user.role === 'Employee' ? { evaluation: { evaluateeID: user.id } } : {};
    return await prisma.evaluationResult.findMany({ where: whereClause });
  },

  getSessions: async () => {
    return await evaluationRepository.findAllSessions();
  },

  createEvaluation: async (payload, authUserId) => {
    const { evaluation, results } = payload;
    let { evaluatorID, evaluateeID, evaluationType, sessionID, evaluateeEmployeeId } = evaluation;

    if (!evaluatorID || (!evaluateeID && !evaluateeEmployeeId) || !evaluationType || !sessionID) {
      throw new Error('Missing required fields: evaluatorID, evaluateeID or evaluateeEmployeeId, evaluationType, sessionID');
    }

    // Workflow: Ensure evaluatee has a user account
    if (evaluateeEmployeeId && !evaluateeID) {
      const employee = await employeeRepository.findById(evaluateeEmployeeId);
      if (!employee) throw new Error(`Employee with id ${evaluateeEmployeeId} does not exist`);
      
      if (!employee.userId) {
        evaluateeID = await evaluationService._createLinkedUserForEmployee(employee, authUserId);
      } else {
        evaluateeID = employee.userId;
      }
    } else if (evaluateeID && !isNaN(parseInt(evaluateeID))) {
      // Logic from index.js/evaluations.js: check if evaluateeID is actually a user, if not try treating as employee ID
      const user = await userRepository.findById(evaluateeID);
      if (!user) {
        const employee = await employeeRepository.findById(evaluateeID);
        if (employee) {
          if (!employee.userId) {
            evaluateeID = await evaluationService._createLinkedUserForEmployee(employee, authUserId);
          } else {
            evaluateeID = employee.userId;
          }
        }
      }
    }

    if (parseInt(evaluatorID) === parseInt(evaluateeID)) {
      throw new Error('Evaluator and evaluatee cannot be the same person');
    }

    // Validation
    const [evaluatorExists, evaluateeExists, sessionExists] = await Promise.all([
      userRepository.findById(evaluatorID),
      userRepository.findById(evaluateeID),
      prisma.evaluationSession.findUnique({ where: { sessionID: parseInt(sessionID) } }),
    ]);

    if (!evaluatorExists) throw new Error(`Evaluator with id ${evaluatorID} does not exist`);
    if (!evaluateeExists) throw new Error(`Evaluatee with id ${evaluateeID} does not exist`);
    if (!sessionExists) throw new Error(`Session with id ${sessionID} does not exist`);

    // Session Validation logic from index.js
    const now = new Date();
    const isOn = String(sessionExists.type || '').toLowerCase() === 'on';
    if (!isOn) throw new Error('Evaluation is not active for this session');
    
    if (now < new Date(sessionExists.startDate) || now > new Date(sessionExists.endDate)) {
      throw new Error('Evaluation is outside the active date range');
    }

    if (sessionExists.department) {
      const evaluateeEmployee = await employeeRepository.findByUserId(evaluateeID);
      const evaluateeDept = evaluateeEmployee?.department || null;
      if (!evaluateeDept || evaluateeDept.trim().toLowerCase() !== sessionExists.department.trim().toLowerCase()) {
        throw new Error('Evaluatee not in the session department');
      }
    }

    // Create Evaluation Record
    const evaluationRecord = await evaluationRepository.create({
      evaluatorID: parseInt(evaluatorID),
      evaluateeID: parseInt(evaluateeID),
      evaluationType,
      sessionID: parseInt(sessionID),
      evaluationDate: new Date(),
    });

    // Create Results
    let resultsCount = 0;
    if (results && Array.isArray(results) && results.length > 0) {
      const validResults = results.filter((r) => r.criteriaID != null).map((r) => ({
        evaluationID: evaluationRecord.evaluationID,
        criteriaID: r.criteriaID,
        score: r.score,
        feedback: r.feedback || null,
      }));

      if (validResults.length) {
        const createdResults = await evaluationRepository.createManyResults(validResults);
        resultsCount = createdResults.count;
      }
    }

    // Create Notification
    try {
      const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
      const avgScore = (totalScore / results.length).toFixed(1);

      await prisma.notification.create({
        data: {
          userId: parseInt(evaluateeID),
          title: 'Evaluation Completed',
          message: `Your ${evaluationType} evaluation has been completed by ${evaluatorExists.fullName} with an average score of ${avgScore}/5.`,
          type: 'SUCCESS',
          link: `/evaluations/${evaluationRecord.evaluationID}`
        }
      });
    } catch (notifErr) {
      console.warn('Failed to create notification for evaluation:', notifErr.message);
    }

    return { ...evaluationRecord, resultsCount };
  },

  _createLinkedUserForEmployee: async (employee, authUserId) => {
    const empId = employee.id;
    const baseUserName = (employee.email?.split('@')[0] || `${employee.firstName}.${employee.lastName}`).replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || `emp${empId}`;
    let userName = baseUserName;
    let suffix = 0;
    
    // ensure uniqueness
    while (true) {
      const exists = await userRepository.findByUsername(userName);
      if (!exists) break;
      suffix += 1;
      userName = `${baseUserName}${suffix}`;
    }

    const passwordPlain = Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    const createdUser = await userRepository.create({
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
      createdBy: authUserId || 1,
    });
    
    await employeeRepository.update(empId, { userId: createdUser.id });
    return createdUser.id;
  }
};

module.exports = evaluationService;
