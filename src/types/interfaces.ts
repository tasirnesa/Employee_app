export interface User {
  id: number;
  fullName: string;
  userName: string;
  password: string;
  gender?: string;
  age?: number;
  status: string; // Changed to string for bit(1)
  role: string;
  locked: string; // Changed to string for bit(1)
  isFirstLogin: string; // Changed to string for bit(1)
  activeStatus: string; // Changed to string for bit(1)
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
  evaluator: { fullName: string };
  evaluatee: { fullName: string };
}



export interface EvaluationCriteria {
  criteriaID: number;
  title: string;
  description?: string;
  createdBy: number;
  createdDate: string;
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
  description?: string;
  createdDate: string;
  createdBy: number;
}