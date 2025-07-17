export interface User {
  Id: number;
  FullName: string;
  UserName: string;
  Password: string;
  Gender: string;
  Age: number;
  Status: boolean; // Changed to boolean
  Role: string;
  Locked: boolean; // Changed to boolean
  IsFirstLogin: boolean; // Changed to boolean
  activeStatus: boolean; // Changed to boolean
  CreatedDate: string;
  CreatedBy: number;
}

export interface Evaluation {
  evaluationID: number;
  evaluatorID: number;
  evaluateeID: number;
  evaluationType: string;
  sessionID: number;
  evaluationDate: string;
}

export interface EvaluationCriteria {
  criteriaID: number;
  title: string;
  description: string;
  createdBy: number;
  createdDate: string;
}

export interface EvaluationResult {
  resultID: number;
  evaluationID: number;
  criteriaID: number;
  score: number;
  feedback: string;
}

export interface EvaluationSession {
  sessionID: number;
  title: string;
  startDate: string;
  endDate: string;
  activatedBy: number;
}