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
  FormControl,
  InputLabel,
  Select,
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
  const [activeTab, setActiveTab] = useState<'payslips' | 'compensation' | 'positionDefaults' | 'scaleDefaults' | 'runPayroll'>('payslips');
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

  // Position defaults configuration
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [positionConfig, setPositionConfig] = useState({
    positionName: '',
    basicSalary: '',
    allowances: '',
    bonus: '',
    overtimeMultiplier: '1.5',
    pensionEmployeePct: '0.07',
    taxFixed: '0',
    insuranceEmployeeFixed: '0',
    otherDeductionsFixed: '0',
  });
  const [runPeriod, setRunPeriod] = useState<string>(''); // YYYY-MM
  // Scale defaults configuration (admin)
  const [scaleKeyEditing, setScaleKeyEditing] = useState<string>('');
  const [scaleConfig, setScaleConfig] = useState({
    label: '',
    basicSalary: '',
    allowances: '',
    bonus: '',
    overtimeMultiplier: '1.5',
    pensionEmployeePct: '0.07',
    taxFixed: '0',
    insuranceEmployeeFixed: '0',
    otherDeductionsFixed: '0',
  });

  // Check user role for access control
  const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
  const isEmployee = userRole === 'Employee';
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

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
        headers: { Authorization: { } as any },
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

  // Fetch positions for configuring defaults
  const { data: positions } = useQuery({
    queryKey: ['positions-for-payroll'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/positions', { headers: { Authorization: `Bearer ${token}` } });
      return res.data as Array<{ id: number; name: string }>;
    },
    enabled: isAdmin,
  });

  // Load all scales for admin
  const { data: allScales, refetch: refetchAllScales } = useQuery({
    queryKey: ['payroll-scales-all'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/payroll/scale-config', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return res.data as Record<string, any>;
    },
    enabled: isAdmin,
  });

  // Load a scale when editing key changes
  const { refetch: refetchScale } = useQuery({
    queryKey: ['scale-config', scaleKeyEditing],
    queryFn: async () => {
      if (!scaleKeyEditing) return null;
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/payroll/scale-config/${scaleKeyEditing}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const cfg = res.data || {};
      setScaleConfig({
        label: cfg.label || '',
        basicSalary: String(cfg.basicSalary ?? ''),
        allowances: String(cfg.allowances ?? ''),
        bonus: String(cfg.bonus ?? ''),
        overtimeMultiplier: String(cfg.overtimeMultiplier ?? '1.5'),
        pensionEmployeePct: String(cfg.pensionEmployeePct ?? '0.07'),
        taxFixed: String(cfg.taxFixed ?? '0'),
        insuranceEmployeeFixed: String(cfg.insuranceEmployeeFixed ?? '0'),
        otherDeductionsFixed: String(cfg.otherDeductionsFixed ?? '0'),
      });
      return cfg;
    },
    enabled: isAdmin && !!scaleKeyEditing,
  });

  // Save scale config
  const saveScaleCfg = useMutation({
    mutationFn: async () => {
      if (!scaleKeyEditing) throw new Error('Scale key is required');
      const token = localStorage.getItem('token');
      const payload = {
        ...scaleConfig,
        basicSalary: Number(scaleConfig.basicSalary || 0),
        allowances: Number(scaleConfig.allowances || 0),
        bonus: Number(scaleConfig.bonus || 0),
        overtimeMultiplier: Number(scaleConfig.overtimeMultiplier || 1.5),
        pensionEmployeePct: Number(scaleConfig.pensionEmployeePct || 0.07),
        taxFixed: Number(scaleConfig.taxFixed || 0),
        insuranceEmployeeFixed: Number(scaleConfig.insuranceEmployeeFixed || 0),
        otherDeductionsFixed: Number(scaleConfig.otherDeductionsFixed || 0),
      } as any;
      const res = await api.put(`/api/payroll/scale-config/${scaleKeyEditing}`, payload, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return res.data;
    },
    onSuccess: () => {
      alert('Scale saved');
      refetchAllScales();
    },
    onError: (e: any) => alert(e?.response?.data?.error || e.message),
  });

  // Load a position config when selection changes
  const { refetch: refetchPosConfig } = useQuery({
    queryKey: ['position-config', selectedPositionId],
    queryFn: async () => {
      if (!selectedPositionId) return null;
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/payroll/position-config/${selectedPositionId}`, { headers: { Authorization: `Bearer ${token}` } });
      const cfg = res.data || {};
      setPositionConfig({
        positionName: cfg.positionName || '',
        basicSalary: String(cfg.basicSalary ?? ''),
        allowances: String(cfg.allowances ?? ''),
        bonus: String(cfg.bonus ?? ''),
        overtimeMultiplier: String(cfg.overtimeMultiplier ?? '1.5'),
        pensionEmployeePct: String(cfg.pensionEmployeePct ?? '0.07'),
        taxFixed: String(cfg.taxFixed ?? '0'),
        insuranceEmployeeFixed: String(cfg.insuranceEmployeeFixed ?? '0'),
        otherDeductionsFixed: String(cfg.otherDeductionsFixed ?? '0'),
      });
      return cfg;
    },
    enabled: isAdmin && !!selectedPositionId,
  });

  // Save position config
  const savePosCfg = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const payload = {
        ...positionConfig,
        basicSalary: Number(positionConfig.basicSalary || 0),
        allowances: Number(positionConfig.allowances || 0),
        bonus: Number(positionConfig.bonus || 0),
        overtimeMultiplier: Number(positionConfig.overtimeMultiplier || 1.5),
        pensionEmployeePct: Number(positionConfig.pensionEmployeePct || 0.07),
        taxFixed: Number(positionConfig.taxFixed || 0),
        insuranceEmployeeFixed: Number(positionConfig.insuranceEmployeeFixed || 0),
        otherDeductionsFixed: Number(positionConfig.otherDeductionsFixed || 0),
      } as any;
      const res = await api.put(`/api/payroll/position-config/${selectedPositionId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: () => {
      alert('Position defaults saved');
    },
    onError: (e: any) => alert(e?.response?.data?.error || e.message),
  });

  // Run payroll
  const runPayroll = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/payroll/run', { period: runPeriod || undefined }, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      alert(`Payroll run complete for ${data.period}. Payslips generated/updated: ${data.count}`);
    },
    onError: (e: any) => alert(e?.response?.data?.error || e.message),
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
    setCompensationForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePayslipSubmit = () => {
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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

      {/* Tabs for sections */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Button variant={activeTab === 'payslips' ? 'contained' : 'text'} onClick={() => setActiveTab('payslips')} sx={{ mr: 1 }}>Payslips</Button>
        <Button variant={activeTab === 'compensation' ? 'contained' : 'text'} onClick={() => setActiveTab('compensation')} sx={{ mr: 1 }}>Compensation</Button>
        {!isEmployee && (
          <>
            <Button variant={activeTab === 'positionDefaults' ? 'contained' : 'text'} onClick={() => setActiveTab('positionDefaults')} sx={{ mr: 1 }}>Position Defaults</Button>
            <Button variant={activeTab === 'scaleDefaults' ? 'contained' : 'text'} onClick={() => setActiveTab('scaleDefaults')} sx={{ mr: 1 }}>Scale Defaults</Button>
            <Button variant={activeTab === 'runPayroll' ? 'contained' : 'text'} onClick={() => setActiveTab('runPayroll')}>Run Payroll</Button>
          </>
        )}
      </Box>

      {/* Position Defaults Panel */}
      {!isEmployee && activeTab === 'positionDefaults' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Position Defaults</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 240 }}>
                <InputLabel>Position</InputLabel>
                <Select native label="Position" value={selectedPositionId} onChange={(e) => setSelectedPositionId(String((e.target as any).value))}>
                  <option value="">Select Position</option>
                  {(positions || []).map((p: any) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </Select>
              </FormControl>
              <TextField label="Position Name" value={positionConfig.positionName} onChange={(e) => setPositionConfig({ ...positionConfig, positionName: e.target.value })} />
              <TextField label="Basic Salary" type="number" value={positionConfig.basicSalary} onChange={(e) => setPositionConfig({ ...positionConfig, basicSalary: e.target.value })} />
              <TextField label="Allowances" type="number" value={positionConfig.allowances} onChange={(e) => setPositionConfig({ ...positionConfig, allowances: e.target.value })} />
              <TextField label="Bonus" type="number" value={positionConfig.bonus} onChange={(e) => setPositionConfig({ ...positionConfig, bonus: e.target.value })} />
              <TextField label="Overtime Multiplier" type="number" value={positionConfig.overtimeMultiplier} onChange={(e) => setPositionConfig({ ...positionConfig, overtimeMultiplier: e.target.value })} />
              <TextField label="Pension Employee %" type="number" value={positionConfig.pensionEmployeePct} onChange={(e) => setPositionConfig({ ...positionConfig, pensionEmployeePct: e.target.value })} />
              <TextField label="Tax (fixed)" type="number" value={positionConfig.taxFixed} onChange={(e) => setPositionConfig({ ...positionConfig, taxFixed: e.target.value })} />
              <TextField label="Insurance (employee)" type="number" value={positionConfig.insuranceEmployeeFixed} onChange={(e) => setPositionConfig({ ...positionConfig, insuranceEmployeeFixed: e.target.value })} />
              <TextField label="Other Deductions" type="number" value={positionConfig.otherDeductionsFixed} onChange={(e) => setPositionConfig({ ...positionConfig, otherDeductionsFixed: e.target.value })} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => { if (!selectedPositionId) { alert('Select a position first'); return; } savePosCfg.mutate(); }}>Save Defaults</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Scale Defaults Panel */}
      {!isEmployee && activeTab === 'scaleDefaults' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Scale Defaults</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
              <TextField label="Scale Key" placeholder="e.g., JUNIOR_A" value={scaleKeyEditing} onChange={(e) => setScaleKeyEditing(e.target.value)} />
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel id="scale-select-label">Load Existing</InputLabel>
                <Select native labelId="scale-select-label" label="Load Existing" onChange={(e) => setScaleKeyEditing(String((e.target as any).value))}>
                  <option value="">Select Scale</option>
                  {allScales && Object.keys(allScales).map((k) => (<option key={k} value={k}>{(allScales as any)[k]?.label || k}</option>))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Label" value={scaleConfig.label} onChange={(e) => setScaleConfig({ ...scaleConfig, label: e.target.value })} />
              <TextField label="Basic Salary" type="number" value={scaleConfig.basicSalary} onChange={(e) => setScaleConfig({ ...scaleConfig, basicSalary: e.target.value })} />
              <TextField label="Allowances" type="number" value={scaleConfig.allowances} onChange={(e) => setScaleConfig({ ...scaleConfig, allowances: e.target.value })} />
              <TextField label="Bonus" type="number" value={scaleConfig.bonus} onChange={(e) => setScaleConfig({ ...scaleConfig, bonus: e.target.value })} />
              <TextField label="Overtime Multiplier" type="number" value={scaleConfig.overtimeMultiplier} onChange={(e) => setScaleConfig({ ...scaleConfig, overtimeMultiplier: e.target.value })} />
              <TextField label="Pension Employee %" type="number" value={scaleConfig.pensionEmployeePct} onChange={(e) => setScaleConfig({ ...scaleConfig, pensionEmployeePct: e.target.value })} />
              <TextField label="Tax (fixed)" type="number" value={scaleConfig.taxFixed} onChange={(e) => setScaleConfig({ ...scaleConfig, taxFixed: e.target.value })} />
              <TextField label="Insurance (employee)" type="number" value={scaleConfig.insuranceEmployeeFixed} onChange={(e) => setScaleConfig({ ...scaleConfig, insuranceEmployeeFixed: e.target.value })} />
              <TextField label="Other Deductions" type="number" value={scaleConfig.otherDeductionsFixed} onChange={(e) => setScaleConfig({ ...scaleConfig, otherDeductionsFixed: e.target.value })} />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={() => { if (!scaleKeyEditing) { alert('Enter a scale key'); return; } saveScaleCfg.mutate(); }}>Save Scale</Button>
              <Button variant="text" onClick={() => { if (!scaleKeyEditing) return; refetchScale(); }}>Reload</Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Run Payroll Panel */}
      {!isEmployee && activeTab === 'runPayroll' && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Run Payroll</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Period" type="month" InputLabelProps={{ shrink: true }} value={runPeriod} onChange={(e) => setRunPeriod(e.target.value)} />
              <Button variant="contained" onClick={() => runPayroll.mutate()} disabled={runPayroll.isPending}> {runPayroll.isPending ? 'Running...' : 'Run'} </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Content Tabs below */}

      {/* Payslips Table */}
      {activeTab === 'payslips' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Basic Salary</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Allowances</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Deductions</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Net Salary</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payslips?.map((payslip: any, index: number) => (
                <TableRow key={payslip.id} sx={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff', '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' } }}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{payslip.employee?.fullName || 'Unknown Employee'}</Typography>
                      <Typography variant="caption" color="text.secondary">{payslip.employee?.userName || `ID: ${payslip.employeeId}`}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{payslip.period}</TableCell>
                  <TableCell>{formatCurrency(payslip.basicSalary)}</TableCell>
                  <TableCell>{formatCurrency(payslip.allowances)}</TableCell>
                  <TableCell>{formatCurrency(payslip.deductions)}</TableCell>
                  <TableCell><Typography variant="subtitle2" fontWeight={600} color="primary">{formatCurrency(payslip.netSalary)}</Typography></TableCell>
                  <TableCell><Chip label={payslip.status} size="small" color={getStatusColor(payslip.status) as any} /></TableCell>
                  <TableCell>{!isEmployee && (<IconButton onClick={handleMenuClick}><MoreVertIcon /></IconButton>)}</TableCell>
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
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Position</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Basic Salary</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Allowances</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Bonus</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Total Compensation</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Effective Date</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {compensations?.map((comp: any, index: number) => (
                <TableRow key={comp.id} sx={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff', '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' } }}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{comp.employee?.fullName || 'Unknown Employee'}</Typography>
                      <Typography variant="caption" color="text.secondary">{comp.employee?.userName || `ID: ${comp.employeeId}`}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{comp.position}</TableCell>
                  <TableCell>{formatCurrency(comp.basicSalary)}</TableCell>
                  <TableCell>{formatCurrency(comp.allowances)}</TableCell>
                  <TableCell>{formatCurrency(comp.bonus)}</TableCell>
                  <TableCell><Typography variant="subtitle2" fontWeight={600} color="primary">{formatCurrency(comp.totalCompensation)}</Typography></TableCell>
                  <TableCell>{new Date(comp.effectiveDate).toLocaleDateString()}</TableCell>
                  <TableCell><Chip label={comp.status} size="small" color={getStatusColor(comp.status) as any} /></TableCell>
                  <TableCell>{!isEmployee && (<IconButton onClick={handleMenuClick}><MoreVertIcon /></IconButton>)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}><EditIcon sx={{ mr: 1 }} />Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}><ReceiptIcon sx={{ mr: 1 }} />View Details</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}><DeleteIcon sx={{ mr: 1 }} />Delete</MenuItem>
      </Menu>

      {/* Generate Payslip Dialog */}
      <Dialog open={payslipDialogOpen} onClose={() => setPayslipDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Payslip</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Employee" select SelectProps={{ native: true }} variant="outlined" value={payslipForm.employeeId} onChange={(e) => handlePayslipFormChange('employeeId', e.target.value)}>
                <option value="">Select Employee</option>
                {employees?.map((employee: any) => (<option key={employee.id} value={employee.id}>{employee.fullName}</option>))}
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Period" type="month" variant="outlined" InputLabelProps={{ shrink: true }} value={payslipForm.period} onChange={(e) => handlePayslipFormChange('period', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Basic Salary" type="number" variant="outlined" value={payslipForm.basicSalary} onChange={(e) => handlePayslipFormChange('basicSalary', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Allowances" type="number" variant="outlined" value={payslipForm.allowances} onChange={(e) => handlePayslipFormChange('allowances', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Deductions" type="number" variant="outlined" value={payslipForm.deductions} onChange={(e) => handlePayslipFormChange('deductions', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Net Salary" type="number" variant="outlined" disabled value={payslipForm.netSalary} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayslipDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePayslipSubmit} disabled={createPayslipMutation.isPending}>{createPayslipMutation.isPending ? 'Generating...' : 'Generate Payslip'}</Button>
        </DialogActions>
      </Dialog>

      {/* Update Compensation Dialog */}
      <Dialog open={compensationDialogOpen} onClose={() => setCompensationDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Update Compensation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Employee" select SelectProps={{ native: true }} variant="outlined" value={compensationForm.employeeId} onChange={(e) => handleCompensationFormChange('employeeId', e.target.value)}>
                <option value="">Select Employee</option>
                {employees?.map((employee: any) => (<option key={employee.id} value={employee.id}>{employee.fullName}</option>))}
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Position" variant="outlined" value={compensationForm.position} onChange={(e) => handleCompensationFormChange('position', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Basic Salary" type="number" variant="outlined" value={compensationForm.basicSalary} onChange={(e) => handleCompensationFormChange('basicSalary', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Allowances" type="number" variant="outlined" value={compensationForm.allowances} onChange={(e) => handleCompensationFormChange('allowances', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Bonus" type="number" variant="outlined" value={compensationForm.bonus} onChange={(e) => handleCompensationFormChange('bonus', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Effective Date" type="date" variant="outlined" InputLabelProps={{ shrink: true }} value={compensationForm.effectiveDate} onChange={(e) => handleCompensationFormChange('effectiveDate', e.target.value)} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompensationDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCompensationSubmit} disabled={createCompensationMutation.isPending}>{createCompensationMutation.isPending ? 'Updating...' : 'Update Compensation'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payroll;
