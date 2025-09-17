export interface User {
  id: number;
  fullName: string;
  userName: string;
  password: string;
  gender?: string;
  age?: number;
<<<<<<< HEAD
  status: string; // Changed to string for bit(1)
  role: string;
  locked: string; // Changed to string for bit(1)
  isFirstLogin: string; // Changed to string for bit(1)
  activeStatus: string; // Changed to string for bit(1)
=======
  status: string; 
  role: string;
  locked: string; 
  isFirstLogin: string; 
  activeStatus: string; 
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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
<<<<<<< HEAD
  evaluator: { fullName: string };
  evaluatee: { fullName: string };
=======
  evaluator: { FullName: string };
  evaluatee: { FullName: string };
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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
<<<<<<< HEAD

export interface Criteria {
  id: number;
  name: string;
  description?: string;
  createdDate: string;
  createdBy: number;
=======
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
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
}