import React, { useState, useEffect } from 'react';
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
  DialogContentText,
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
  Tooltip,
  Alert,
  Snackbar,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import MeritProposalsPanel from '../components/MeritProposalsPanel';

const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'payslips' | 'compensation' | 'merit' | 'positionDefaults' | 'scaleDefaults' | 'runPayroll'
  >('payslips');

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'merit') setActiveTab('merit');
  }, []);
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
    overtimePay: '0',
    lateDeduction: '0',
    attendanceBonus: '0',
    attendancePenalty: '0',
    performanceBonus: '0',
    perksAllowance: '0',
    benefitsDeduction: '0',
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
    gradeId: '',
    positionAllowance: '',
    fuelAllowance: '',
    qualifications: '',
  });
  const [runPeriod, setRunPeriod] = useState<string>(''); // YYYY-MM
  const [payNotify, setPayNotify] = useState<{ msg: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const payFlash = (msg: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setPayNotify({ msg, severity });
    setTimeout(() => setPayNotify(null), 4500);
  };
  // Scale defaults configuration (admin)
  const [scaleKeyEditing, setScaleKeyEditing] = useState<string>('');
  const [scaleConfig, setScaleConfig] = useState({
    name: '',
    minSalary: '',
    midSalary: '',
    maxSalary: '',
    housingPct: '',
    transportPct: '',
  });

  // Check user role for access control
  const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
  const isEmployee = userRole === 'Employee';
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
  const canReviewMerit = isAdmin || userRole === 'Manager' || userRole === 'SuperAdmin';

  // Fetch payslips data
  const { data: payslips, isLoading: payslipsLoading, error: payslipsError } = useQuery({
    queryKey: ['payslips'],
    queryFn: async () => (await api.get('/api/payroll/payslips')).data,
  });

  const { data: compensations, isLoading: compensationsLoading, error: compensationsError } = useQuery({
    queryKey: ['compensations'],
    queryFn: async () => (await api.get('/api/payroll/compensations')).data,
  });

  const { data: employees } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/api/users')).data,
  });

  const { data: positions } = useQuery({
    queryKey: ['positions-for-payroll'],
    queryFn: async () => (await api.get('/api/positions')).data as Array<{ id: number; name: string }>,
    enabled: isAdmin,
  });

  const { data: allScales, refetch: refetchAllScales } = useQuery({
    queryKey: ['payroll-scales-all'],
    queryFn: async () => (await api.get('/api/payroll/scale-config')).data as Record<string, any>,
    enabled: isAdmin,
  });

  // Load a scale when editing key changes
  const { refetch: refetchScale } = useQuery({
    queryKey: ['scale-config', scaleKeyEditing],
    queryFn: async () => {
      if (!scaleKeyEditing) return null;
      const res = await api.get(`/api/payroll/scale-config/${scaleKeyEditing}`);
      const cfg = res.data || {};
      setScaleConfig({
        name: cfg.name || cfg.label || '',
        minSalary: String(cfg.minSalary ?? ''),
        midSalary: String(cfg.midSalary ?? ''),
        maxSalary: String(cfg.maxSalary ?? ''),
        housingPct: String(cfg.housingPct ?? '0'),
        transportPct: String(cfg.transportPct ?? '0'),
      });
      return cfg;
    },
    enabled: isAdmin && !!scaleKeyEditing,
  });

  const saveScaleCfg = useMutation({
    mutationFn: async () => {
      if (!scaleKeyEditing) throw new Error('Scale key is required');
      const payload = {
        ...scaleConfig,
        name: scaleConfig.name || scaleKeyEditing,
        minSalary: Number(scaleConfig.minSalary || 0),
        midSalary: Number(scaleConfig.midSalary || 0),
        maxSalary: Number(scaleConfig.maxSalary || 0),
        housingPct: Number(scaleConfig.housingPct || 0),
        transportPct: Number(scaleConfig.transportPct || 0),
      } as any;
      return (await api.put(`/api/payroll/scale-config/${scaleKeyEditing}`, payload)).data;
    },
    onSuccess: () => { payFlash('Scale saved'); refetchAllScales(); },
    onError: (e: any) => payFlash(e?.response?.data?.error || e.message, 'error'),
  });

  const { refetch: refetchPosConfig } = useQuery({
    queryKey: ['position-config', selectedPositionId],
    queryFn: async () => {
      if (!selectedPositionId) return null;
      const res = await api.get(`/api/payroll/position-config/${selectedPositionId}`);
      const cfg = res.data || {};
      setPositionConfig({
        positionName: cfg.name || cfg.positionName || '',
        gradeId: String(cfg.gradeId ?? ''),
        positionAllowance: String(cfg.positionAllowance ?? '0'),
        fuelAllowance: String(cfg.fuelAllowance ?? '0'),
        qualifications: cfg.qualifications || '',
      });
      return cfg;
    },
    enabled: isAdmin && !!selectedPositionId,
  });

  const savePosCfg = useMutation({
    mutationFn: async () => {
      const payload = {
        ...positionConfig,
        positionName: positionConfig.positionName,
        gradeId: positionConfig.gradeId ? Number(positionConfig.gradeId) : null,
        positionAllowance: Number(positionConfig.positionAllowance || 0),
        fuelAllowance: Number(positionConfig.fuelAllowance || 0),
        qualifications: positionConfig.qualifications,
      } as any;
      return (await api.put(`/api/payroll/position-config/${selectedPositionId}`, payload)).data;
    },
    onSuccess: () => { payFlash('Position defaults saved'); },
    onError: (e: any) => payFlash(e?.response?.data?.error || e.message, 'error'),
  });

  const runPayroll = useMutation({
    mutationFn: async () => (await api.post('/api/payroll/run', { period: runPeriod || undefined })).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      payFlash(`Payroll run complete for ${data.period}. ${data.count} payslips generated.`);
    },
    onError: (e: any) => payFlash(e?.response?.data?.error || e.message, 'error'),
  });

  const createPayslipMutation = useMutation({
    mutationFn: async (payslipData: any) => (await api.post('/api/payroll/payslips', payslipData)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      setPayslipDialogOpen(false);
      payFlash('Payslip created successfully');
      setPayslipForm({ employeeId:'',period:'',basicSalary:'',allowances:'',
        overtimePay:'0',lateDeduction:'0',attendanceBonus:'0',attendancePenalty:'0',
        performanceBonus:'0',perksAllowance:'0',benefitsDeduction:'0',deductions:'',netSalary:'' });
    },
    onError: (error: any) => payFlash(error.response?.data?.error || error.message, 'error'),
  });

  const createCompensationMutation = useMutation({
    mutationFn: async (compensationData: any) => (await api.post('/api/payroll/compensations', compensationData)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compensations'] });
      setCompensationDialogOpen(false);
      setCompensationForm({ employeeId:'',position:'',basicSalary:'',allowances:'',bonus:'',effectiveDate:'' });
      setSelectedCompensation(null);
      payFlash('Compensation created successfully');
    },
    onError: (error: any) => payFlash(error.response?.data?.error || error.message, 'error'),
  });

  const updatePayslipMutation = useMutation({
    mutationFn: async (data: any) => (await api.put(`/api/payroll/payslips/${selectedPayslip?.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      setPayslipDialogOpen(false);
      setSelectedPayslip(null);
      payFlash('Payslip updated');
    },
    onError: (e: any) => payFlash(e.response?.data?.error || e.message, 'error'),
  });

  const updateCompensationMutation = useMutation({
    mutationFn: async (data: any) => (await api.put(`/api/payroll/compensations/${selectedCompensation?.id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compensations'] });
      setCompensationDialogOpen(false);
      setSelectedCompensation(null);
      payFlash('Compensation updated');
    },
    onError: (e: any) => payFlash(e.response?.data?.error || e.message, 'error'),
  });

  const deletePayslipMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/api/payroll/payslips/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      handleMenuClose();
      payFlash('Payslip deleted');
    },
    onError: (e: any) => payFlash(e.response?.data?.error || e.message, 'error'),
  });

  const deleteCompensationMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/api/payroll/compensations/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compensations'] });
      handleMenuClose();
      payFlash('Compensation deleted');
    },
    onError: (e: any) => payFlash(e.response?.data?.error || e.message, 'error'),
  });

  const distributePayslips = useMutation({
    mutationFn: async () => (await api.post('/api/payroll/distribute', { period: runPeriod })).data,
    onSuccess: (data: any) => payFlash(`Queued ${data.count} payslips for email distribution`),
    onError: (err: any) => payFlash(err.response?.data?.message || err.message, 'error'),
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: any, type: 'payslip' | 'compensation') => {
    setAnchorEl(event.currentTarget);
    if (type === 'payslip') {
      setSelectedPayslip(item);
      setSelectedCompensation(null);
    } else {
      setSelectedCompensation(item);
      setSelectedPayslip(item); // Using same anchor but tracking separately
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selected items here, wait for dialog open or actual action
  };

  const handleEdit = () => {
    if (selectedPayslip && activeTab === 'payslips') {
      setPayslipForm({
        employeeId: String(selectedPayslip.employeeId),
        period: selectedPayslip.period,
        basicSalary: String(selectedPayslip.basicSalary),
        allowances: String(selectedPayslip.allowances),
        overtimePay: String(selectedPayslip.overtimePay || 0),
        lateDeduction: String(selectedPayslip.lateDeduction || 0),
        attendanceBonus: String(selectedPayslip.attendanceBonus || 0),
        attendancePenalty: String(selectedPayslip.attendancePenalty || 0),
        performanceBonus: String(selectedPayslip.performanceBonus || 0),
        perksAllowance: String(selectedPayslip.perksAllowance || 0),
        benefitsDeduction: String(selectedPayslip.benefitsDeduction || 0),
        deductions: String(selectedPayslip.deductions),
        netSalary: String(selectedPayslip.netSalary)
      });
      setPayslipDialogOpen(true);
    } else if (selectedCompensation && activeTab === 'compensation') {
      setCompensationForm({
        employeeId: String(selectedCompensation.employeeId),
        position: selectedCompensation.position,
        basicSalary: String(selectedCompensation.basicSalary),
        allowances: String(selectedCompensation.allowances),
        bonus: String(selectedCompensation.bonus),
        effectiveDate: new Date(selectedCompensation.effectiveDate).toISOString().split('T')[0]
      });
      setCompensationDialogOpen(true);
    }
    handleMenuClose();
  };

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [distributeConfirm, setDistributeConfirm] = useState(false);

  const handleDelete = () => {
    setDeleteConfirm(true);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (activeTab === 'payslips' && selectedPayslip) {
      deletePayslipMutation.mutate(selectedPayslip.id);
    } else if (activeTab === 'compensation' && selectedCompensation) {
      deleteCompensationMutation.mutate(Number(selectedCompensation.id));
    }
    setDeleteConfirm(false);
  };

  // Form handlers
  const handlePayslipFormChange = (field: string, value: string) => {
    setPayslipForm(prev => {
      const updated = { ...prev, [field]: value };
      if (['basicSalary', 'allowances', 'deductions', 'overtimePay', 'lateDeduction', 'attendanceBonus', 'attendancePenalty', 'performanceBonus', 'perksAllowance', 'benefitsDeduction'].includes(field)) {
        const basicSalary = parseFloat(updated.basicSalary) || 0;
        const allowances = parseFloat(updated.allowances) || 0;
        const overtimePay = parseFloat(updated.overtimePay) || 0;
        const attendanceBonus = parseFloat(updated.attendanceBonus) || 0;
        const performanceBonus = parseFloat(updated.performanceBonus) || 0;
        const perksAllowance = parseFloat(updated.perksAllowance) || 0;
        const lateDeduction = parseFloat(updated.lateDeduction) || 0;
        const attendancePenalty = parseFloat(updated.attendancePenalty) || 0;
        const benefitsDeduction = parseFloat(updated.benefitsDeduction) || 0;
        const deductions = parseFloat(updated.deductions) || 0;

        const gross = basicSalary + allowances + overtimePay + attendanceBonus + performanceBonus + perksAllowance;
        const totalDeductions = deductions + lateDeduction + attendancePenalty + benefitsDeduction;
        updated.netSalary = (gross - totalDeductions).toString();
      }
      return updated;
    });
  };

  const handleCompensationFormChange = (field: string, value: string) => {
    setCompensationForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePayslipSubmit = () => {
    if (!payslipForm.employeeId || !payslipForm.period || !payslipForm.basicSalary || !payslipForm.allowances || !payslipForm.deductions) {
      payFlash('Please fill in all required fields', 'error');
      return;
    }
    const payslipData = {
      employeeId: parseInt(payslipForm.employeeId),
      period: payslipForm.period,
      basicSalary: parseFloat(payslipForm.basicSalary),
      allowances: parseFloat(payslipForm.allowances),
      overtimePay: parseFloat(payslipForm.overtimePay),
      lateDeduction: parseFloat(payslipForm.lateDeduction),
      attendanceBonus: parseFloat(payslipForm.attendanceBonus),
      attendancePenalty: parseFloat(payslipForm.attendancePenalty),
      performanceBonus: parseFloat(payslipForm.performanceBonus),
      perksAllowance: parseFloat(payslipForm.perksAllowance),
      benefitsDeduction: parseFloat(payslipForm.benefitsDeduction),
      deductions: parseFloat(payslipForm.deductions),
      netSalary: parseFloat(payslipForm.netSalary),
      status: 'Generated'
    };
    if (selectedPayslip) {
      updatePayslipMutation.mutate(payslipData);
    } else {
      createPayslipMutation.mutate(payslipData);
    }
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
    if (selectedCompensation) {
      updateCompensationMutation.mutate(compensationData);
    } else {
      createCompensationMutation.mutate(compensationData);
    }
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

      {/* ── Feedback ── */}
      <Snackbar open={!!payNotify && payNotify.severity !== 'error'}
        autoHideDuration={4000} onClose={() => setPayNotify(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={payNotify?.severity || 'success'} onClose={() => setPayNotify(null)} sx={{ borderRadius: 2 }}>
          {payNotify?.msg}
        </Alert>
      </Snackbar>
      {payNotify?.severity === 'error' && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPayNotify(null)}>
          {payNotify.msg}
        </Alert>
      )}

      {/* ── Delete confirm dialog ── */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={800}>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {activeTab === 'payslips' ? 'payslip' : 'compensation record'}? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete} sx={{ borderRadius: 2, fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ── Distribute confirm dialog ── */}
      <Dialog open={distributeConfirm} onClose={() => setDistributeConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={800}>Email Payslips</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Send all payslips for <strong>{runPeriod}</strong> to employees via email?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDistributeConfirm(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={() => { distributePayslips.mutate(); setDistributeConfirm(false); }}
            sx={{ borderRadius: 2, fontWeight: 700 }}>Send</Button>
        </DialogActions>
      </Dialog>
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
        {canReviewMerit && (
          <Button variant={activeTab === 'merit' ? 'contained' : 'text'} onClick={() => setActiveTab('merit')} sx={{ mr: 1 }}>Merit Proposals</Button>
        )}
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
              <TextField label="Position Name" value={positionConfig.positionName || ''} disabled />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Grade</InputLabel>
                <Select native label="Grade" value={positionConfig.gradeId || ''} onChange={(e) => setPositionConfig({ ...positionConfig, gradeId: (e.target as any).value })}>
                  <option value="">No Grade</option>
                  {allScales && Object.keys(allScales).map(k => <option key={allScales[k].id} value={allScales[k].id}>{allScales[k].name}</option>)}
                </Select>
              </FormControl>
              <TextField label="Position Allowance" type="number" value={positionConfig.positionAllowance || ''} onChange={(e) => setPositionConfig({ ...positionConfig, positionAllowance: e.target.value })} />
              <TextField label="Fuel Allowance" type="number" value={positionConfig.fuelAllowance || ''} onChange={(e) => setPositionConfig({ ...positionConfig, fuelAllowance: e.target.value })} />
              <TextField label="Qualifications" value={positionConfig.qualifications || ''} onChange={(e) => setPositionConfig({ ...positionConfig, qualifications: e.target.value })} />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={() => {
                if (!selectedPositionId) { payFlash('Select a position first', 'error'); return; }
                savePosCfg.mutate();
              }}>Save Defaults</Button>
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
                  {allScales && Object.keys(allScales).map((k) => (<option key={k} value={k}>{(allScales as any)[k]?.name || k}</option>))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField label="Scale/Grade Name" value={scaleConfig.name || ''} onChange={(e) => setScaleConfig({ ...scaleConfig, name: e.target.value })} />
              <TextField label="Min Salary" type="number" value={scaleConfig.minSalary || ''} onChange={(e) => setScaleConfig({ ...scaleConfig, minSalary: e.target.value })} />
              <TextField label="Mid Salary" type="number" value={scaleConfig.midSalary || ''} onChange={(e) => setScaleConfig({ ...scaleConfig, midSalary: e.target.value })} />
              <TextField label="Max Salary" type="number" value={scaleConfig.maxSalary || ''} onChange={(e) => setScaleConfig({ ...scaleConfig, maxSalary: e.target.value })} />
              <TextField label="Housing %" type="number" value={scaleConfig.housingPct || ''} onChange={(e) => setScaleConfig({ ...scaleConfig, housingPct: e.target.value })} />
              <TextField label="Transport %" type="number" value={scaleConfig.transportPct || ''} onChange={(e) => setScaleConfig({ ...scaleConfig, transportPct: e.target.value })} />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={() => {
                if (!scaleKeyEditing) { payFlash('Enter a scale key first', 'error'); return; }
                saveScaleCfg.mutate();
              }}>Save Scale</Button>
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
              <Button
                variant="contained"
                onClick={() => runPayroll.mutate()}
                disabled={runPayroll.isPending || !runPeriod}
                startIcon={<AttachMoneyIcon />}
              >
                {runPayroll.isPending ? 'Running...' : 'Run Payroll'}
              </Button>
              <Tooltip title="Send payslips to all employees for this period via email">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    if (!runPeriod) { payFlash('Select a period first', 'error'); return; }
                    setDistributeConfirm(true);
                  }}
                  disabled={distributePayslips.isPending || !runPeriod}
                  startIcon={<EmailIcon />}
                >
                  {distributePayslips.isPending ? 'Sending...' : 'Email All Payslips'}
                </Button>
              </Tooltip>
              <Tooltip title="Download CSV bank export for this period">
                <Button
                  variant="outlined"
                  color="info"
                  onClick={async () => {
                    try {
                      const response = await api.get(`/api/payroll/export/${runPeriod}`, {
                        responseType: 'blob'
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `payroll_${runPeriod}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (e: any) {
                      payFlash(e?.response?.data?.error || e.message || 'Export failed', 'error');
                    }
                  }}
                  disabled={!runPeriod}
                  startIcon={<AttachMoneyIcon />}
                >
                  Export Bank CSV
                </Button>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      )}

      {canReviewMerit && activeTab === 'merit' && (
        <MeritProposalsPanel isAdmin={canReviewMerit} />
      )}

      {/* Payslips Table */}
      {activeTab === 'payslips' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Basic</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Allow/Perks</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Overtime & Bonus</TableCell>
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
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{formatCurrency(payslip.basicSalary)}</Typography>
                      <Typography variant="caption" color="text.secondary">{payslip.period}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">+{formatCurrency(payslip.allowances)} allow.</Typography>
                      {Number(payslip.perksAllowance) > 0 && (
                        <Typography variant="caption" color="info.main" display="block">+{formatCurrency(payslip.perksAllowance)} perks</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" color="success.main">OT: {formatCurrency(payslip.overtimePay)}</Typography>
                      {Number(payslip.attendanceBonus) > 0 && (
                        <Typography variant="caption" color="success.main" display="block">Bon: {formatCurrency(payslip.attendanceBonus)}</Typography>
                      )}
                      {Number(payslip.performanceBonus) > 0 && (
                        <Typography variant="caption" color="secondary.main" display="block">
                          Perf: {formatCurrency(payslip.performanceBonus)}
                          {payslip.meritTier ? ` (${payslip.meritTier})` : ''}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" color="error.main">-{formatCurrency(Number(payslip.deductions))}</Typography>
                      {Number(payslip.benefitsDeduction) > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Incl. {formatCurrency(payslip.benefitsDeduction)} benefits
                        </Typography>
                      )}
                      {Number(payslip.lateDeduction) > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Incl. {formatCurrency(payslip.lateDeduction)} late
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="subtitle2" fontWeight={600} color="primary">{formatCurrency(payslip.netSalary)}</Typography></TableCell>
                  <TableCell><Chip label={payslip.status} size="small" color={getStatusColor(payslip.status) as any} /></TableCell>
                  <TableCell>{!isEmployee && (<IconButton onClick={(e) => handleMenuClick(e, payslip, 'payslip')}><MoreVertIcon /></IconButton>)}</TableCell>
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
                  <TableCell>{!isEmployee && (<IconButton onClick={(e) => handleMenuClick(e, comp, 'compensation')}><MoreVertIcon /></IconButton>)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}><EditIcon sx={{ mr: 1 }} />Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}><ReceiptIcon sx={{ mr: 1 }} />View Details</MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}><DeleteIcon sx={{ mr: 1 }} />Delete</MenuItem>
      </Menu>

      {/* Generate Payslip Dialog */}
      <Dialog
        open={payslipDialogOpen}
        onClose={() => {
          setPayslipDialogOpen(false);
          setSelectedPayslip(null);
          setPayslipForm({
            employeeId: '',
            period: '',
            basicSalary: '',
            allowances: '',
            performanceBonus: '0',
            perksAllowance: '0',
            overtimePay: '0',
            lateDeduction: '0',
            attendanceBonus: '0',
            attendancePenalty: '0',
            benefitsDeduction: '0',
            deductions: '',
            netSalary: ''
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedPayslip ? 'Edit Payslip' : 'Generate Payslip'}</DialogTitle>
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
              <TextField fullWidth label="Overtime Pay" type="number" variant="outlined" value={payslipForm.overtimePay} onChange={(e) => handlePayslipFormChange('overtimePay', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Attendance Bonus" type="number" variant="outlined" value={payslipForm.attendanceBonus} onChange={(e) => handlePayslipFormChange('attendanceBonus', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <TextField fullWidth label="Standard Deductions" type="number" variant="outlined" value={payslipForm.deductions} onChange={(e) => handlePayslipFormChange('deductions', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <TextField fullWidth label="Late Deductions" type="number" variant="outlined" value={payslipForm.lateDeduction} onChange={(e) => handlePayslipFormChange('lateDeduction', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <TextField fullWidth label="Att. Penalty" type="number" variant="outlined" value={payslipForm.attendancePenalty} onChange={(e) => handlePayslipFormChange('attendancePenalty', e.target.value)} />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField fullWidth label="Net Salary (Calc)" type="number" variant="outlined" disabled value={payslipForm.netSalary} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayslipDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePayslipSubmit} disabled={createPayslipMutation.isPending || updatePayslipMutation.isPending}>
            {selectedPayslip ? (updatePayslipMutation.isPending ? 'Updating...' : 'Update Payslip') : (createPayslipMutation.isPending ? 'Generating...' : 'Generate Payslip')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Compensation Dialog */}
      <Dialog
        open={compensationDialogOpen}
        onClose={() => {
          setCompensationDialogOpen(false);
          setSelectedCompensation(null);
          setCompensationForm({
            employeeId: '',
            position: '',
            basicSalary: '',
            allowances: '',
            bonus: '',
            effectiveDate: ''
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedCompensation ? 'Edit Compensation' : 'Update Compensation'}</DialogTitle>
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
          <Button variant="contained" onClick={handleCompensationSubmit} disabled={createCompensationMutation.isPending || updateCompensationMutation.isPending}>
            {selectedCompensation ? (updateCompensationMutation.isPending ? 'Updating...' : 'Update Compensation') : (createCompensationMutation.isPending ? 'Updating...' : 'Update Compensation')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Payroll;
