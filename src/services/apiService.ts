import api from '../lib/axios';
import type { 
  User, 
  Evaluation, 
  EvaluationCriteria, 
  Employee, 
  Todo,
  Attendance,
  Payslip,
  Leave,
  LeaveType,
  Project,
  Timesheet
} from '../types/interfaces';

// Generic API service class
class ApiService {
  // User related endpoints
  async getUsers(): Promise<User[]> {
    const response = await api.get('/api/users');
    return response.data;
  }

  async getUserById(id: number): Promise<User> {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await api.post('/api/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/api/users/${id}`);
  }

  // Evaluation related endpoints
  async getEvaluations(): Promise<Evaluation[]> {
    const response = await api.get('/api/evaluations');
    return response.data;
  }

  async getEvaluationById(id: number): Promise<Evaluation> {
    const response = await api.get(`/api/evaluations/${id}`);
    return response.data;
  }

  async createEvaluation(evaluationData: Partial<Evaluation>): Promise<Evaluation> {
    const response = await api.post('/api/evaluations', evaluationData);
    return response.data;
  }

  // Criteria related endpoints
  async getCriteria(): Promise<EvaluationCriteria[]> {
    const response = await api.get('/api/criteria');
    return response.data;
  }

  async createCriteria(criteriaData: Partial<EvaluationCriteria>): Promise<EvaluationCriteria> {
    const response = await api.post('/api/criteria', criteriaData);
    return response.data;
  }

  // Employee related endpoints
  async getEmployees(): Promise<Employee[]> {
    const response = await api.get('/api/employees');
    return response.data;
  }

  async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    const response = await api.post('/api/employees', employeeData);
    return response.data;
  }

  // Todo related endpoints
  async getTodos(userId: number): Promise<Todo[]> {
    const response = await api.get(`/api/todos/user/${userId}`);
    return response.data;
  }

  async createTodo(todoData: Partial<Todo>): Promise<Todo> {
    const response = await api.post('/api/todos', todoData);
    return response.data;
  }

  async updateTodo(id: number, todoData: Partial<Todo>): Promise<Todo> {
    const response = await api.put(`/api/todos/${id}`, todoData);
    return response.data;
  }

  async deleteTodo(id: number): Promise<void> {
    await api.delete(`/api/todos/${id}`);
  }

  // Attendance related endpoints
  async getAttendance(): Promise<Attendance[]> {
    const response = await api.get('/api/attendance');
    return response.data;
  }

  async createAttendance(attendanceData: Partial<Attendance>): Promise<Attendance> {
    const response = await api.post('/api/attendance', attendanceData);
    return response.data;
  }

  // Payroll related endpoints
  async getPayslips(): Promise<Payslip[]> {
    const response = await api.get('/api/payroll/payslips');
    return response.data;
  }

  async createPayslip(payslipData: Partial<Payslip>): Promise<Payslip> {
    const response = await api.post('/api/payroll/payslips', payslipData);
    return response.data;
  }

  // Leave related endpoints
  async getLeaves(): Promise<Leave[]> {
    const response = await api.get('/api/leaves');
    return response.data;
  }

  async getLeaveById(id: number): Promise<Leave> {
    const response = await api.get(`/api/leaves/${id}`);
    return response.data;
  }

  async createLeave(leaveData: Partial<Leave>): Promise<Leave> {
    const response = await api.post('/api/leaves', leaveData);
    return response.data;
  }

  async updateLeave(id: number, leaveData: Partial<Leave>): Promise<Leave> {
    const response = await api.put(`/api/leaves/${id}`, leaveData);
    return response.data;
  }

  async approveLeave(id: number, approvedBy: number, comments?: string): Promise<Leave> {
    const response = await api.patch(`/api/leaves/${id}/approve`, { approvedBy, comments });
    return response.data;
  }

  async rejectLeave(id: number, comments?: string): Promise<Leave> {
    const response = await api.patch(`/api/leaves/${id}/reject`, { comments });
    return response.data;
  }

  async deleteLeave(id: number): Promise<void> {
    await api.delete(`/api/leaves/${id}`);
  }

  // Leave Types related endpoints
  async getLeaveTypes(): Promise<LeaveType[]> {
    const response = await api.get('/api/leave-types');
    return response.data;
  }

  async getLeaveTypeById(id: number): Promise<LeaveType> {
    const response = await api.get(`/api/leave-types/${id}`);
    return response.data;
  }

  async createLeaveType(leaveTypeData: Partial<LeaveType>): Promise<LeaveType> {
    const response = await api.post('/api/leave-types', leaveTypeData);
    return response.data;
  }

  async updateLeaveType(id: number, leaveTypeData: Partial<LeaveType>): Promise<LeaveType> {
    const response = await api.put(`/api/leave-types/${id}`, leaveTypeData);
    return response.data;
  }

  async deleteLeaveType(id: number): Promise<void> {
    await api.delete(`/api/leave-types/${id}`);
  }

  // Project related endpoints
  async getProjects(): Promise<Project[]> {
    const response = await api.get('/api/projects');
    return response.data;
  }

  async createProject(projectData: Partial<Project>): Promise<Project> {
    const response = await api.post('/api/projects', projectData);
    return response.data;
  }

  // Timesheet related endpoints
  async getTimesheets(): Promise<Timesheet[]> {
    const response = await api.get('/api/timesheets');
    return response.data;
  }

  async createTimesheet(timesheetData: Partial<Timesheet>): Promise<Timesheet> {
    const response = await api.post('/api/timesheets', timesheetData);
    return response.data;
  }

  // Department related endpoints
  async getDepartments(): Promise<any[]> {
    const response = await api.get('/api/departments');
    return response.data;
  }

  async getDepartmentById(id: number): Promise<any> {
    const response = await api.get(`/api/departments/${id}`);
    return response.data;
  }

  async createDepartment(data: { name: string; managerId?: number }): Promise<any> {
    const response = await api.post('/api/departments', data);
    return response.data;
  }

  async updateDepartment(id: number, data: { name?: string; managerId?: number }): Promise<any> {
    const response = await api.put(`/api/departments/${id}`, data);
    return response.data;
  }

  async deleteDepartment(id: number): Promise<void> {
    await api.delete(`/api/departments/${id}`);
  }

  // Position related endpoints
  async getPositions(): Promise<any[]> {
    const response = await api.get('/api/positions');
    return response.data;
  }

  async getPositionById(id: number): Promise<any> {
    const response = await api.get(`/api/positions/${id}`);
    return response.data;
  }

  async createPosition(data: { name: string; level: number; reportsTo?: number }): Promise<any> {
    const response = await api.post('/api/positions', data);
    return response.data;
  }

  async updatePosition(id: number, data: { name?: string; level?: number; reportsTo?: number }): Promise<any> {
    const response = await api.put(`/api/positions/${id}`, data);
    return response.data;
  }

  async deletePosition(id: number): Promise<void> {
    await api.delete(`/api/positions/${id}`);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
