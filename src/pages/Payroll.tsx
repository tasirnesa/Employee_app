import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
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

interface Payslip {
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

interface Compensation {
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

const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'payslips' | 'compensation'>('payslips');
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [compensationDialogOpen, setCompensationDialogOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [selectedCompensation, setSelectedCompensation] = useState<Compensation | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
              >
                <option value="">Select Employee</option>
                <option value="EMP001">John Doe</option>
                <option value="EMP002">Jane Smith</option>
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Period"
                type="month"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Basic Salary"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Allowances"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Deductions"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Net Salary"
                type="number"
                variant="outlined"
                disabled
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayslipDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setPayslipDialogOpen(false)}>
            Generate Payslip
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
              >
                <option value="">Select Employee</option>
                <option value="EMP001">John Doe</option>
                <option value="EMP002">Jane Smith</option>
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Position"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Basic Salary"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Allowances"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Bonus"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompensationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCompensationDialogOpen(false)}>
            Update Compensation
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payroll;
