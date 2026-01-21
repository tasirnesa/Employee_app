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
  departmentId?: number | null; // New field
  positionId?: number | null;  // New field
  managerId?: number | null;   // Existing hierarchy field
  // Relations (optional, for TypeScript typing)
  department?: Department | null;
  position?: Position | null;
  manager?: User | null;
  directReports?: User[];
  profileImageUrl?: string;
  managedDepartments?: Department[];
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
  isAuthorized?: boolean;
  authorizedBy?: number;
  authorizedDate?: string;
  creator?: { fullName?: string; FullName?: string };
  creatorName?: string;
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

// ../types/interfaces.ts
export interface KeyResult {
  title: string;
  progress?: number;
}

export interface Goal {
  gid: number;
  objective: string;
  keyResult: (string | KeyResult)[] | null; // Allow mixed array of strings or KeyResult objects
  priority?: string;
  status?: string;
  progress?: number;
  duedate?: string;
  category?: string;
  activatedBy?: number;
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
  gender?: string | null;
  age?: number | null;
  birthDate?: string | null;
  profileImageUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId?: number | null;
}

export interface Department {
  id: number;
  name: string;
  managerId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: number;
  name: string;
  level: number;
  reportsTo?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  hoursWorked?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  timeType?: 'working' | 'break' | 'overnight' | 'holiday' | 'overtime-regular' | 'overtime-sunday';
  notes?: string;
}

export interface AttendanceSummary {
  employeeId: number;
  employeeName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  totalHours: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'Generated' | 'Paid' | 'Pending';
  generatedDate: string;
  paidDate?: string;
}

export interface Compensation {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  basicSalary: number;
  allowances: number;
  bonus: number;
  totalCompensation: number;
  effectiveDate: string;
  status: 'Active' | 'Inactive';
}

export interface Benefit {
  id: string;
  employeeId: string;
  employeeName: string;
  benefitType: 'Health Insurance' | 'Dental' | 'Vision' | 'Life Insurance' | 'Retirement' | 'Gym Membership' | 'Education' | 'Transportation' | 'Meal Allowance';
  provider: string;
  coverage: string;
  monthlyCost: number;
  employeeContribution: number;
  companyContribution: number;
  effectiveDate: string;
  expiryDate?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Expired';
  notes?: string;
}

export interface Perk {
  id: string;
  employeeId: string;
  employeeName: string;
  perkType: 'Flexible Hours' | 'Remote Work' | 'Professional Development' | 'Wellness Program' | 'Company Events' | 'Free Meals' | 'Parking' | 'Childcare';
  description: string;
  value: number;
  frequency: 'Monthly' | 'Quarterly' | 'Annually' | 'One-time';
  status: 'Active' | 'Inactive' | 'Pending';
  startDate: string;
  endDate?: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  education: string;
  skills: string[];
  status: 'Applied' | 'Screening' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  appliedDate: string;
  resumeUrl?: string;
  interviewDate?: string;
  notes?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Cancelled';
  managerId: number;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: number;
    fullName: string;
    userName: string;
  };
  timesheets?: Timesheet[];
}

export interface Timesheet {
  id: number;
  employeeId: number;
  projectId?: number;
  taskDescription: string;
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  overtimeHours: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: number;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    fullName: string;
    userName: string;
  };
  project?: {
    id: number;
    name: string;
  };
  approver?: {
    id: number;
    fullName: string;
  };
}

export interface Message {
  id: string;
  senderId: number;
  receiverId: number;
  text?: string;
  image?: string;
  status: string;
  parentId?: string | null;
  parent?: Message | null;
  createdAt: string;
}

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  maxDays?: number;
  isPaid: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Attendance {
  id: number;
  userId: number;
  checkIn: string;
  checkOut?: string;
  status: string;
  notes?: string;
  user?: User;
}

export interface Leave {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  approvedBy?: number;
  approvedAt?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    fullName: string;
    userName: string;
  };
  leaveType?: {
    id: number;
    name: string;
    description?: string;
    maxDays?: number;
    isPaid: boolean;
  };
  approver?: {
    id: number;
    fullName: string;
  };
}