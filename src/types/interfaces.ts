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
  evaluator: { FullName: string };
  evaluatee: { FullName: string };
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
export interface Goal {
  gid: number;
  objective: string;
  keyResult?: string;
  priority?: string;
  status?: string;
  progress?: string;
  duedate: string;
  category?: string;
}
export interface Criteria {
  criteriaID: number; // Match the log's field name
  title: string;
  description: string;
  createdBy: number;
  createdDate: Date;
}

export interface Session {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  completed?: boolean;
}