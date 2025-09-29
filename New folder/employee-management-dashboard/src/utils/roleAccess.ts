import { UserRole } from '../types/interfaces';

const roleAccess = {
  [UserRole.Employee]: {
    canViewCriteria: true,
    canViewEvaluationResults: true,
    canSetGoals: true,
    canViewPerformance: true,
    canViewScheduledSessions: true,
    canViewReports: true,
    canAccessSettings: true,
  },
  [UserRole.Manager]: {
    canViewCriteria: true,
    canViewEvaluationResults: true,
    canSetGoals: true,
    canViewPerformance: true,
    canViewScheduledSessions: true,
    canViewReports: true,
    canAccessSettings: true,
  },
  [UserRole.Admin]: {
    canViewCriteria: true,
    canViewEvaluationResults: true,
    canSetGoals: true,
    canViewPerformance: true,
    canViewScheduledSessions: true,
    canViewReports: true,
    canAccessSettings: true,
  },
};

export const hasAccess = (role: UserRole, action: keyof typeof roleAccess[UserRole.Employee]): boolean => {
  return roleAccess[role]?.[action] || false;
};