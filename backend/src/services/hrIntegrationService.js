const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const communicationService = require('./communicationService');
const userRepository = require('../repositories/userRepository');

const CONFIG_FILE = path.join(__dirname, '..', '..', 'hr.integration.config.json');

const DEFAULT_CONFIG = {
  meritTiers: [
    { minRating: 4.5, tier: 'Outstanding', bonusPercent: 15, salaryIncreasePercent: 8 },
    { minRating: 4.0, tier: 'Excellent', bonusPercent: 10, salaryIncreasePercent: 5 },
    { minRating: 3.5, tier: 'Good', bonusPercent: 5, salaryIncreasePercent: 2 },
    { minRating: 3.0, tier: 'Meets Expectations', bonusPercent: 2, salaryIncreasePercent: 0 },
    { minRating: 0, tier: 'Needs Improvement', bonusPercent: 0, salaryIncreasePercent: 0 },
  ],
  autoCreateMeritProposalMinRating: 3.5,
  premiumPerkMinRating: 4.0,
  premiumBenefitMinRating: 3.5,
  performanceBonusUsesApprovedMeritFirst: true,
  recurringPerformanceBonusFromRating: false,
};

const hrIntegrationService = {
  loadConfig: () => {
    try {
      if (!fs.existsSync(CONFIG_FILE)) return DEFAULT_CONFIG;
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8') || '{}') };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  getMeritTier: (rating) => {
    const cfg = hrIntegrationService.loadConfig();
    const sorted = [...cfg.meritTiers].sort((a, b) => b.minRating - a.minRating);
    return sorted.find((t) => rating >= t.minRating) || sorted[sorted.length - 1];
  },

  buildPeriodLabel: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      return `${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  },

  /** Session-scoped performance recalculation */
  recalculatePerformance: async (userId, evaluatorId, options = {}) => {
    const uid = parseInt(userId);
    const eid = parseInt(evaluatorId);
    const { sessionId, periodStart, periodEnd, feedback } = options;

    let rangeStart = periodStart ? new Date(periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let rangeEnd = periodEnd ? new Date(periodEnd) : new Date();
    let periodLabel = hrIntegrationService.buildPeriodLabel(rangeStart, rangeEnd);
    let sessionFilter = {};

    if (sessionId) {
      const session = await prisma.evaluationSession.findUnique({ where: { sessionID: parseInt(sessionId) } });
      if (session) {
        rangeStart = new Date(session.startDate);
        rangeEnd = new Date(session.endDate);
        periodLabel = `${session.title} (${hrIntegrationService.buildPeriodLabel(rangeStart, rangeEnd)})`;
        sessionFilter = { sessionID: parseInt(sessionId) };
      }
    }

    const [evaluations, timesheets, goals] = await Promise.all([
      prisma.evaluation.findMany({
        where: {
          evaluateeID: uid,
          ...sessionFilter,
          evaluationDate: sessionFilter.sessionID ? undefined : { gte: rangeStart, lte: rangeEnd },
        },
        include: { results: true },
      }),
      prisma.timesheet.findMany({
        where: {
          employeeId: uid,
          status: 'Approved',
          date: { gte: rangeStart, lte: rangeEnd },
        },
      }),
      prisma.goal.findMany({
        where: {
          activatedBy: uid,
          OR: [
            { status: 'Completed', duedate: { gte: rangeStart, lte: rangeEnd } },
            { status: 'Completed', duedate: null },
            { duedate: { gte: rangeStart, lte: rangeEnd } },
          ],
        },
      }),
    ]);

    const allScores = evaluations.flatMap((e) => e.results.map((r) => Number(r.score || 0))).filter((s) => s > 0);
    const overallRating = allScores.length
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;
    const tasksCompleted = goals.filter((g) => g.status === 'Completed').length;
    const hoursWorked = Math.round(timesheets.reduce((sum, t) => sum + (t.hoursWorked || 0), 0));
    const now = new Date();

    const existing = await prisma.performance.findFirst({
      where: { userId: uid, evaluationPeriod: periodLabel },
    });

    const payload = {
      tasksCompleted,
      hoursWorked,
      overallRating: overallRating || null,
      feedback: feedback || 'Recalculated from evaluations, goals, and timesheets for the review period.',
      date: now,
    };

    let performance;
    if (existing) {
      performance = await prisma.performance.update({ where: { id: existing.id }, data: payload });
    } else {
      performance = await prisma.performance.create({
        data: {
          userId: uid,
          evaluatorId: eid,
          evaluationPeriod: periodLabel,
          ...payload,
        },
      });
    }

    if (overallRating > 0) {
      await hrIntegrationService.syncBenefitsPerksEligibility(uid, overallRating);
    }

    return performance;
  },

  /** Called after evaluation submission */
  onEvaluationCompleted: async ({
    evaluateeId,
    evaluatorId,
    evaluationId,
    sessionId,
    avgScore,
  }) => {
    const uid = parseInt(evaluateeId);
    const rating = Number(avgScore) || 0;

    const performance = await hrIntegrationService.recalculatePerformance(uid, evaluatorId, {
      sessionId,
      feedback: `Updated from evaluation #${evaluationId} (avg score ${rating.toFixed(1)}/5).`,
    });

    const cfg = hrIntegrationService.loadConfig();
    let meritProposal = null;

    if (rating >= cfg.autoCreateMeritProposalMinRating) {
      meritProposal = await hrIntegrationService.createMeritProposal({
        employeeId: uid,
        evaluationID: evaluationId,
        sessionID: sessionId,
        performanceRating: rating,
        proposedBy: parseInt(evaluatorId),
      });
    }

    return { performance, meritProposal };
  },

  createMeritProposal: async ({
    employeeId,
    evaluationID,
    sessionID,
    performanceRating,
    proposedBy,
  }) => {
    const uid = parseInt(employeeId);
    const rating = Number(performanceRating) || 0;
    const tier = hrIntegrationService.getMeritTier(rating);

    const comp = await prisma.compensation.findFirst({
      where: { employeeId: uid, status: 'Active' },
      orderBy: { effectiveDate: 'desc' },
    });
    const basicSalary = Number(comp?.basicSalary || 0);
    const bonusAmount = basicSalary * (tier.bonusPercent / 100);

    const existing = await prisma.meritProposal.findFirst({
      where: {
        employeeId: uid,
        evaluationID: evaluationID ? parseInt(evaluationID) : undefined,
        status: 'Pending',
      },
    });
    if (existing) return existing;

    const proposal = await prisma.meritProposal.create({
      data: {
        employeeId: uid,
        evaluationID: evaluationID ? parseInt(evaluationID) : null,
        sessionID: sessionID ? parseInt(sessionID) : null,
        proposedBy: parseInt(proposedBy),
        performanceRating: rating,
        meritTier: tier.tier,
        bonusPercent: tier.bonusPercent,
        bonusAmount,
        salaryIncreasePercent: tier.salaryIncreasePercent,
        status: 'Pending',
      },
      include: {
        employee: { select: { id: true, fullName: true } },
        proposer: { select: { id: true, fullName: true } },
      },
    });

    try {
      const admins = await userRepository.findManyByRole('Admin');
      for (const admin of admins) {
        await communicationService.notify(
          admin.id,
          'Merit Increase Proposal',
          `${proposal.employee.fullName}: ${tier.tier} rating (${rating.toFixed(1)}/5) — proposed ${tier.bonusPercent}% bonus ($${bonusAmount.toFixed(2)}).`,
          'INFO',
          '/payroll?tab=merit'
        );
      }
      await communicationService.notify(
        uid,
        'Performance Review — Compensation Review',
        `Your evaluation score of ${rating.toFixed(1)}/5 qualifies for a ${tier.tier} merit review. HR will confirm any adjustment.`,
        'SUCCESS',
        '/analytics-performance'
      );
    } catch (e) {
      console.warn('[HR Integration] Merit notification failed:', e.message);
    }

    return proposal;
  },

  getMeritProposals: async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = parseInt(filters.employeeId);
    return prisma.meritProposal.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, userName: true } },
        proposer: { select: { id: true, fullName: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  approveMeritProposal: async (id, reviewerId, { applyToCompensation = true } = {}) => {
    const proposal = await prisma.meritProposal.findUnique({ where: { id: parseInt(id) } });
    if (!proposal) throw new Error('Merit proposal not found');
    if (proposal.status !== 'Pending') throw new Error('Proposal is not pending');

    const now = new Date();
    let updatedComp = null;

    if (applyToCompensation) {
      const comp = await prisma.compensation.findFirst({
        where: { employeeId: proposal.employeeId, status: 'Active' },
        orderBy: { effectiveDate: 'desc' },
      });

      if (comp) {
        let newBasic = Number(comp.basicSalary || 0);
        if (proposal.salaryIncreasePercent > 0) {
          newBasic = newBasic * (1 + proposal.salaryIncreasePercent / 100);
        }
        const allowances = Number(comp.allowances || 0);
        const bonus = Number(comp.bonus || 0);
        // Merit cash bonus is paid on the next payroll run (performanceBonus line), not stacked into comp.bonus
        updatedComp = await prisma.compensation.update({
          where: { id: comp.id },
          data: {
            basicSalary: newBasic,
            totalCompensation: newBasic + allowances + bonus,
          },
        });
      }
    }

    const updated = await prisma.meritProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'Approved',
        reviewedBy: parseInt(reviewerId),
        reviewedAt: now,
        appliedAt: applyToCompensation ? now : null,
      },
      include: {
        employee: { select: { id: true, fullName: true } },
      },
    });

    await communicationService.notify(
      proposal.employeeId,
      'Merit Increase Approved',
      `Your ${proposal.meritTier} merit proposal has been approved.${applyToCompensation ? ' Compensation has been updated.' : ''}`,
      'SUCCESS',
      '/payroll'
    );

    return { proposal: updated, compensation: updatedComp };
  },

  rejectMeritProposal: async (id, reviewerId, reviewNotes = '') => {
    const proposal = await prisma.meritProposal.findUnique({ where: { id: parseInt(id) } });
    if (!proposal) throw new Error('Merit proposal not found');
    if (proposal.status !== 'Pending') throw new Error('Proposal is not pending');

    const updated = await prisma.meritProposal.update({
      where: { id: proposal.id },
      data: {
        status: 'Rejected',
        reviewedBy: parseInt(reviewerId),
        reviewedAt: new Date(),
        reviewNotes,
      },
    });

    await communicationService.notify(
      proposal.employeeId,
      'Merit Proposal Update',
      `Your merit compensation review was not approved at this time.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
      'WARNING',
      '/analytics-performance'
    );

    return updated;
  },

  /** Payroll: performance-linked bonus for a pay period */
  calculatePerformanceBonus: async (userId, comp, periodStart, periodEnd) => {
    const cfg = hrIntegrationService.loadConfig();
    const uid = parseInt(userId);
    const basic = Number(comp?.basicSalary || 0);
    const empty = { amount: 0, meritTier: null, source: 'none', rating: 0, meritProposalId: null };

    if (cfg.performanceBonusUsesApprovedMeritFirst) {
      const approved = await prisma.meritProposal.findFirst({
        where: {
          employeeId: uid,
          status: 'Approved',
          bonusPaidAt: null,
        },
        orderBy: [{ appliedAt: 'desc' }, { reviewedAt: 'desc' }],
      });
      if (approved) {
        return {
          amount: Number(approved.bonusAmount || 0),
          meritTier: approved.meritTier,
          source: 'approved_merit',
          rating: approved.performanceRating,
          meritProposalId: approved.id,
        };
      }
    }

    if (!cfg.recurringPerformanceBonusFromRating) {
      return empty;
    }

    const performance = await prisma.performance.findFirst({
      where: {
        userId: uid,
        date: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { date: 'desc' },
    });

    const rating = Number(performance?.overallRating || 0);
    if (rating <= 0) {
      return empty;
    }

    const tier = hrIntegrationService.getMeritTier(rating);
    const amount = basic * (tier.bonusPercent / 100);

    return {
      amount,
      meritTier: tier.tier,
      source: 'performance_rating',
      rating,
      meritProposalId: null,
    };
  },

  markMeritBonusPaid: async (meritProposalId) => {
    if (!meritProposalId) return null;
    return prisma.meritProposal.update({
      where: { id: parseInt(meritProposalId) },
      data: { bonusPaidAt: new Date() },
    });
  },

  /** Activate/deactivate premium benefits & perks based on rating */
  syncBenefitsPerksEligibility: async (userId, overallRating) => {
    const cfg = hrIntegrationService.loadConfig();
    const uid = parseInt(userId);
    const rating = Number(overallRating) || 0;

    const [benefits, perks] = await Promise.all([
      prisma.benefit.findMany({ where: { employeeId: uid } }),
      prisma.perk.findMany({ where: { employeeId: uid } }),
    ]);

    for (const b of benefits) {
      const minRating = Number(b.minPerformanceRating ?? cfg.premiumBenefitMinRating);
      if (b.eligibilityTier === 'Premium' || b.minPerformanceRating != null) {
        const eligible = rating >= minRating;
        const nextStatus = eligible ? 'Active' : 'Inactive';
        if (b.status !== nextStatus && b.status !== 'Expired') {
          await prisma.benefit.update({
            where: { id: b.id },
            data: { status: nextStatus },
          });
        }
      }
    }

    for (const p of perks) {
      const minRating = Number(p.minPerformanceRating ?? cfg.premiumPerkMinRating);
      if (p.eligibilityTier === 'Premium' || p.minPerformanceRating != null) {
        const eligible = rating >= minRating;
        const nextStatus = eligible ? 'Active' : 'Inactive';
        if (p.status !== nextStatus) {
          await prisma.perk.update({
            where: { id: p.id },
            data: { status: nextStatus },
          });
        }
      }
    }
  },

  meetsEligibility: (item, rating) => {
    const min = item.minPerformanceRating;
    if (min == null && item.eligibilityTier !== 'Premium') return true;
    const cfg = hrIntegrationService.loadConfig();
    const threshold = Number(min ?? (item.eligibilityTier === 'Premium' ? cfg.premiumPerkMinRating : 0));
    return rating >= threshold;
  },

  getLatestRating: async (userId) => {
    const perf = await prisma.performance.findFirst({
      where: { userId: parseInt(userId) },
      orderBy: { date: 'desc' },
    });
    return Number(perf?.overallRating || 0);
  },

  /** Unified HR summary for an employee */
  getEmployeeHrSummary: async (userId) => {
    const uid = parseInt(userId);
    const [performance, evaluations, comp, benefits, perks, meritProposals, latestPayslip] = await Promise.all([
      prisma.performance.findMany({
        where: { userId: uid },
        orderBy: { date: 'desc' },
        take: 3,
      }),
      prisma.evaluation.findMany({
        where: { evaluateeID: uid },
        include: { session: true, results: true },
        orderBy: { evaluationDate: 'desc' },
        take: 5,
      }),
      prisma.compensation.findFirst({
        where: { employeeId: uid, status: 'Active' },
        orderBy: { effectiveDate: 'desc' },
      }),
      prisma.benefit.findMany({ where: { employeeId: uid } }),
      prisma.perk.findMany({ where: { employeeId: uid } }),
      prisma.meritProposal.findMany({
        where: { employeeId: uid },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.payslip.findFirst({
        where: { employeeId: uid },
        orderBy: { generatedDate: 'desc' },
      }),
    ]);

    const latestRating = performance[0]?.overallRating || 0;
    const tier = latestRating > 0 ? hrIntegrationService.getMeritTier(latestRating) : null;

    const activeBenefits = benefits.filter((b) => b.status === 'Active');
    const activePerks = perks.filter((p) => p.status === 'Active');
    const eligibleBenefits = benefits.filter((b) => hrIntegrationService.meetsEligibility(b, latestRating));
    const eligiblePerks = perks.filter((p) => hrIntegrationService.meetsEligibility(p, latestRating));

    return {
      latestRating,
      meritTier: tier?.tier || null,
      projectedBonusPercent: tier?.bonusPercent || 0,
      performance,
      evaluations: evaluations.map((e) => ({
        evaluationID: e.evaluationID,
        sessionTitle: e.session?.title,
        evaluationDate: e.evaluationDate,
        avgScore: e.results.length
          ? e.results.reduce((s, r) => s + Number(r.score || 0), 0) / e.results.length
          : 0,
      })),
      compensation: comp,
      benefits: { active: activeBenefits.length, total: benefits.length, eligible: eligibleBenefits.length },
      perks: { active: activePerks.length, total: perks.length, eligible: eligiblePerks.length },
      meritProposals,
      latestPayslip: latestPayslip
        ? {
            period: latestPayslip.period,
            netSalary: latestPayslip.netSalary,
            performanceBonus: latestPayslip.performanceBonus,
            meritTier: latestPayslip.meritTier,
          }
        : null,
      integrationStatus: {
        evaluationToPerformance: evaluations.length > 0 && performance.length > 0,
        performanceToPayroll: latestRating > 0 && !!comp,
        benefitsLinked: benefits.length > 0,
        perksLinked: perks.length > 0,
        meritWorkflow: meritProposals.some((m) => m.status === 'Approved' || m.status === 'Pending'),
      },
    };
  },
};

module.exports = hrIntegrationService;
