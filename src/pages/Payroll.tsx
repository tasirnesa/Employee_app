import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { Payslip, Compensation } from '../types/interfaces';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';

const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'payslips' | 'compensation'>('payslips');
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [compensationDialogOpen, setCompensationDialogOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [selectedCompensation, setSelectedCompensation] = useState<Compensation | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Form states
  const [payslipForm, setPayslipForm] = useState({
    employeeId: '',
    period: '',
    basicSalary: '',
    allowances: '',
    deductions: '',
    netSalary: ''
  });
  
  const [compensationForm, setCompensationForm] = useState({
    employeeId: '',
    position: '',
    basicSalary: '',
    allowances: '',
    bonus: '',
    effectiveDate: ''
  });

  // Check user role for access control
  const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
  const isEmployee = userRole === 'Employee';

  // Fetch payslips data
  const { data: payslips, isLoading: payslipsLoading, error: payslipsError } = useQuery({
    queryKey: ['payslips'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/payroll/payslips', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch compensations data
  const { data: compensations, isLoading: compensationsLoading, error: compensationsError } = useQuery({
    queryKey: ['compensations'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/payroll/compensations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch users for dropdown (payslips reference User model, not Employee model)
  const { data: employees } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Create payslip mutation
  const createPayslipMutation = useMutation({
    mutationFn: async (payslipData: any) => {
      const token = localStorage.getItem('token');
      console.log('Creating payslip with data:', payslipData);
      const response = await api.post('/api/payroll/payslips', payslipData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      setPayslipDialogOpen(false);
      setPayslipForm({
        employeeId: '',
        period: '',
        basicSalary: '',
        allowances: '',
        deductions: '',
        netSalary: ''
      });
    },
    onError: (error: any) => {
      console.error('Error creating payslip:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert('Error creating payslip: ' + (error.response?.data?.error || error.message));
    },
  });

  // Create compensation mutation
  const createCompensationMutation = useMutation({
    mutationFn: async (compensationData: any) => {
      const token = localStorage.getItem('token');
      console.log('Creating compensation with data:', compensationData);
      const response = await api.post('/api/payroll/compensations', compensationData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compensations'] });
      setCompensationDialogOpen(false);
      setCompensationForm({
        employeeId: '',
        position: '',
        basicSalary: '',
        allowances: '',
        bonus: '',
        effectiveDate: ''
      });
    },
    onError: (error: any) => {
      console.error('Error creating compensation:', error);
      alert('Error creating compensation: ' + (error.response?.data?.error || error.message));
    },
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Form handlers
  const handlePayslipFormChange = (field: string, value: string) => {
    setPayslipForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate net salary
      if (field === 'basicSalary' || field === 'allowances' || field === 'deductions') {
        const basicSalary = parseFloat(updated.basicSalary) || 0;
        const allowances = parseFloat(updated.allowances) || 0;
        const deductions = parseFloat(updated.deductions) || 0;
        updated.netSalary = (basicSalary + allowances - deductions).toString();
      }
      
      return updated;
    });
  };

  const handleCompensationFormChange = (field: string, value: string) => {
    setCompensationForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate total compensation
      if (field === 'basicSalary' || field === 'allowances' || field === 'bonus') {
        const basicSalary = parseFloat(updated.basicSalary) || 0;
        const allowances = parseFloat(updated.allowances) || 0;
        const bonus = parseFloat(updated.bonus) || 0;
        // We'll calculate total compensation in the submission
      }
      
      return updated;
    });
  };

  const handlePayslipSubmit = () => {
    console.log('Form data before submission:', payslipForm);
    
    // Validate form data
    if (!payslipForm.employeeId || !payslipForm.period || !payslipForm.basicSalary || !payslipForm.allowances || !payslipForm.deductions) {
      alert('Please fill in all required fields');
      return;
    }
    
    const payslipData = {
      employeeId: parseInt(payslipForm.employeeId),
      period: payslipForm.period,
      basicSalary: parseFloat(payslipForm.basicSalary),
      allowances: parseFloat(payslipForm.allowances),
      deductions: parseFloat(payslipForm.deductions),
      netSalary: parseFloat(payslipForm.netSalary),
      status: 'Generated'
    };
    
    console.log('Sending payslip data:', payslipData);
    createPayslipMutation.mutate(payslipData);
  };

  const handleCompensationSubmit = () => {
    const basicSalary = parseFloat(compensationForm.basicSalary);
    const allowances = parseFloat(compensationForm.allowances);
    const bonus = parseFloat(compensationForm.bonus);
    const totalCompensation = basicSalary + allowances + bonus;
    
    const compensationData = {
      employeeId: parseInt(compensationForm.employeeId),
      position: compensationForm.position,
      basicSalary: basicSalary,
      allowances: allowances,
      bonus: bonus,
      totalCompensation: totalCompensation,
      effectiveDate: new Date(compensationForm.effectiveDate),
      status: 'Active'
    };
    
    createCompensationMutation.mutate(compensationData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
      case 'Active':
        return 'success';
      case 'Generated':
        return 'info';
      case 'Pending':
        return 'warning';
      case 'Inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Payroll Management
        </Typography>
        {!isEmployee && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<ReceiptIcon />}
              onClick={() => setPayslipDialogOpen(true)}
              sx={{ backgroundColor: 'primary.main' }}
            >
              Generate Payslip
            </Button>
            <Button
              variant="contained"
              startIcon={<AttachMoneyIcon />}
              onClick={() => setCompensationDialogOpen(true)}
              sx={{ backgroundColor: 'secondary.main' }}
            >
              Update Compensation
            </Button>
          </Box>
        )}
      </Box>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Button
          variant={activeTab === 'payslips' ? 'contained' : 'text'}
          onClick={() => setActiveTab('payslips')}
          sx={{ mr: 2 }}
        >
          Payslips
        </Button>
        <Button
          variant={activeTab === 'compensation' ? 'contained' : 'text'}
          onClick={() => setActiveTab('compensation')}
        >
          Compensation
        </Button>
      </Box>

      {/* Payslips Table */}
      {activeTab === 'payslips' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Employee
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Period
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Basic Salary
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Allowances
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Deductions
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Net Salary
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payslips?.map((payslip: any, index: number) => (
                <TableRow
                  key={payslip.id}
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                    '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {payslip.employee?.fullName || 'Unknown Employee'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {payslip.employee?.userName || `ID: ${payslip.employeeId}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{payslip.period}</TableCell>
                  <TableCell>{formatCurrency(payslip.basicSalary)}</TableCell>
                  <TableCell>{formatCurrency(payslip.allowances)}</TableCell>
                  <TableCell>{formatCurrency(payslip.deductions)}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600} color="primary">
                      {formatCurrency(payslip.netSalary)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={payslip.status} 
                      size="small" 
                      color={getStatusColor(payslip.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    {!isEmployee && (
                      <IconButton onClick={handleMenuClick}>
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Compensation Table */}
      {activeTab === 'compensation' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Employee
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Position
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Basic Salary
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Allowances
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Bonus
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Total Compensation
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Effective Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {compensations?.map((comp: any, index: number) => (
                <TableRow
                  key={comp.id}
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                    '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {comp.employee?.fullName || 'Unknown Employee'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {comp.employee?.userName || `ID: ${comp.employeeId}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{comp.position}</TableCell>
                  <TableCell>{formatCurrency(comp.basicSalary)}</TableCell>
                  <TableCell>{formatCurrency(comp.allowances)}</TableCell>
                  <TableCell>{formatCurrency(comp.bonus)}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600} color="primary">
                      {formatCurrency(comp.totalCompensation)}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(comp.effectiveDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={comp.status} 
                      size="small" 
                      color={getStatusColor(comp.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    {!isEmployee && (
                      <IconButton onClick={handleMenuClick}>
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ReceiptIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Generate Payslip Dialog */}
      <Dialog open={payslipDialogOpen} onClose={() => setPayslipDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Payslip</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Employee"
                select
                SelectProps={{ native: true }}
                variant="outlined"
                value={payslipForm.employeeId}
                onChange={(e) => handlePayslipFormChange('employeeId', e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees?.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Period"
                type="month"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={payslipForm.period}
                onChange={(e) => handlePayslipFormChange('period', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Basic Salary"
                type="number"
                variant="outlined"
                value={payslipForm.basicSalary}
                onChange={(e) => handlePayslipFormChange('basicSalary', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Allowances"
                type="number"
                variant="outlined"
                value={payslipForm.allowances}
                onChange={(e) => handlePayslipFormChange('allowances', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Deductions"
                type="number"
                variant="outlined"
                value={payslipForm.deductions}
                onChange={(e) => handlePayslipFormChange('deductions', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Net Salary"
                type="number"
                variant="outlined"
                disabled
                value={payslipForm.netSalary}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayslipDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handlePayslipSubmit}
            disabled={createPayslipMutation.isPending}
          >
            {createPayslipMutation.isPending ? 'Generating...' : 'Generate Payslip'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Compensation Dialog */}
      <Dialog open={compensationDialogOpen} onClose={() => setCompensationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Compensation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Employee"
                select
                SelectProps={{ native: true }}
                variant="outlined"
                value={compensationForm.employeeId}
                onChange={(e) => handleCompensationFormChange('employeeId', e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees?.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Position"
                variant="outlined"
                value={compensationForm.position}
                onChange={(e) => handleCompensationFormChange('position', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Basic Salary"
                type="number"
                variant="outlined"
                value={compensationForm.basicSalary}
                onChange={(e) => handleCompensationFormChange('basicSalary', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Allowances"
                type="number"
                variant="outlined"
                value={compensationForm.allowances}
                onChange={(e) => handleCompensationFormChange('allowances', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Bonus"
                type="number"
                variant="outlined"
                value={compensationForm.bonus}
                onChange={(e) => handleCompensationFormChange('bonus', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={compensationForm.effectiveDate}
                onChange={(e) => handleCompensationFormChange('effectiveDate', e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompensationDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCompensationSubmit}
            disabled={createCompensationMutation.isPending}
          >
            {createCompensationMutation.isPending ? 'Updating...' : 'Update Compensation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payroll;
