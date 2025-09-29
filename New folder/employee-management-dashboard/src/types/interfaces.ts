import { User } from './user';
import { EvaluationCriteria } from './evaluationCriteria';
import { EvaluationResult } from './evaluationResult';
import { Goal } from './goal';
import { ScheduledSession } from './scheduledSession';
import { Report } from './report';

export interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  activeStatus: boolean;
}

export type UserRole = 'employee' | 'manager' | 'admin';

export interface EvaluationCriteria {
  criteriaID: string;
  title: string;
  description: string;
}

export interface EvaluationResult {
  evaluationID: string;
  employeeID: string;
  criteriaID: string;
  score: number;
  comments?: string;
}

export interface Goal {
  goalID: string;
  employeeID: string;
  description: string;
  targetDate: Date;
  achieved: boolean;
}

export interface ScheduledSession {
  sessionID: string;
  employeeID: string;
  date: Date;
  time: string;
  status: 'scheduled' | 'completed' | 'canceled';
}

export interface Report {
  reportID: string;
  employeeID: string;
  content: string;
  createdDate: Date;
}