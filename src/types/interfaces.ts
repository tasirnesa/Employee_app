export interface User {
  id: number;
  fullName: string;
  userName: string;
  password: string;
  gender?: string;
  age?: number;
  status: string; 
  role: string;
  locked: string; 
  isFirstLogin: string; 
  activeStatus: string; 
  createdDate: string;
  createdBy: number;
}

export interface Evaluation {
  evaluationID: number;
  evaluatorID: number;
  evaluateeID: number;
  evaluationType: string;
  sessionID: number;
  evaluationDate: string;
  evaluator?: { fullName?: string; FullName?: string };
  evaluatee?: { fullName?: string; FullName?: string };
}

export interface EvaluationCriteria {
  criteriaID: number;
  title: string;
  description?: string;
  createdBy: number;
  createdDate: string;
  creator?: { fullName?: string; FullName?: string };
}

export interface EvaluationResult {
  resultID: number;
  evaluationID: number;
  criteriaID: number;
  score: number;
  feedback?: string;
}

export interface EvaluationSession {
  sessionID: number;
  title: string;
  startDate: string;
  endDate: string;
  activatedBy: number;
}

export interface Criteria {
  id: number;
  name: string;
  description?: string; // Unified as optional to match other contexts
  createdDate: string;
  createdBy: number;
}

export interface Goal {
  gid: number;
  objective: string;
  keyResult?: string[];
  priority?: string;
  status?: string;
  progress?: number;
  duedate: string;
  category?: string;
}

export interface Session {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  completed?: boolean;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  hireDate?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: number | null;
}