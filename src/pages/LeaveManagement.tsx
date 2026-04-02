import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import type { Leave, LeaveType } from '../types/interfaces';
import LeaveTypeManagement from '../components/LeaveTypeManagement';
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
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Divider,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PhoneIcon from '@mui/icons-material/Phone';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Switch, FormControlLabel, RadioGroup, Radio } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const LeaveManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveTypeDialogOpen, setLeaveTypeDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Check user role for access control
  const currentUser = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const role = (currentUser?.role || '').toLowerCase();
  const isEmployee = role === 'employee';
  const canApprove = role === 'manager' || role === 'admin' || role === 'superadmin';

  // Form state
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    comments: '',
    handoverId: '',
    emergencyContact: '',
    isHalfDay: false,
    halfDayPeriod: 'Morning' as 'Morning' | 'Afternoon',
    attachment: null as File | null
  });

  // Fetch leaves data
  const { data: leaves, isLoading: leavesLoading, error: leavesError } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => apiService.getLeaves(),
  });

  // Fetch leave types for dropdown
  const { data: leaveTypes } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => apiService.getLeaveTypes(),
  });

  // Fetch users for dropdown
  const { data: employees } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
  });

  const getEmployeeNameById = (id?: string | number) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    if (!numId) return '';
    const emp = (employees || []).find((e: any) => e.id === numId);
    return emp?.fullName || '';
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Form handlers
  const handleLeaveFormChange = (field: string, value: any) => {
    setLeaveForm(prev => {
      const newState = { ...prev, [field]: value };
      
      // Auto-adjust end date if start date is moved past it
      if (field === 'startDate' && newState.endDate && new Date(value) > new Date(newState.endDate)) {
        newState.endDate = value;
      }
      // Auto-adjust start date if end date is moved before it
      if (field === 'endDate' && newState.startDate && new Date(value) < new Date(newState.startDate)) {
        newState.startDate = value;
      }
      
      return newState;
    });
  };

  // Mutations
  const createLeaveMutation = useMutation({
    mutationFn: (payload: any) => apiService.createLeave(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setLeaveDialogOpen(false);
      setLeaveForm({
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        comments: '',
        handoverId: '',
        emergencyContact: '',
        isHalfDay: false,
        halfDayPeriod: 'Morning',
        attachment: null
      });
    },
    onError: (error: any) => {
      console.error('Error creating leave:', error);
      alert('Error creating leave: ' + (error?.response?.data?.error || error.message));
    }
  });

  const approveLeaveMutation = useMutation({
    mutationFn: ({ id, comments }: { id: number; comments?: string }) => 
      apiService.approveLeave(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (error: any) => {
      console.error('Error approving leave:', error);
      alert('Error approving leave: ' + (error?.response?.data?.error || error.message));
    }
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ id, comments }: { id: number; comments?: string }) => 
      apiService.rejectLeave(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (error: any) => {
      console.error('Error rejecting leave:', error);
      alert('Error rejecting leave: ' + (error?.response?.data?.error || error.message));
    }
  });

  // Submit handlers
  const handleSubmitLeave = () => {
    if (!leaveForm.employeeId || !leaveForm.leaveTypeId || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert('Please fill in all required fields');
      return;
    }
    
    const formData = new FormData();
    formData.append('employeeId', leaveForm.employeeId);
    formData.append('leaveTypeId', leaveForm.leaveTypeId);
    formData.append('startDate', leaveForm.startDate);
    formData.append('endDate', leaveForm.isHalfDay ? leaveForm.startDate : leaveForm.endDate);
    formData.append('reason', leaveForm.reason);
    formData.append('comments', leaveForm.comments);
    formData.append('handoverId', leaveForm.handoverId);
    formData.append('emergencyContact', leaveForm.emergencyContact);
    formData.append('isHalfDay', String(leaveForm.isHalfDay));
    if (leaveForm.isHalfDay) {
      formData.append('halfDayPeriod', leaveForm.halfDayPeriod);
    }
    if (leaveForm.attachment) {
      formData.append('attachment', leaveForm.attachment);
    }

    createLeaveMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleIcon />;
      case 'Pending':
        return <PendingIcon />;
      case 'Rejected':
        return <CancelIcon />;
      default:
        return <EventIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateBusinessDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const estimatedDays = React.useMemo(() => {
    if (leaveForm.isHalfDay) return 0.5;
    return calculateBusinessDays(leaveForm.startDate, leaveForm.endDate);
  }, [leaveForm.startDate, leaveForm.endDate, leaveForm.isHalfDay]);

  const hasOverlap = React.useMemo(() => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.employeeId) return false;
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.isHalfDay ? leaveForm.startDate : leaveForm.endDate);
    
    return leaves?.some((l: any) => {
      if (l.status !== 'Approved' || l.employeeId !== parseInt(leaveForm.employeeId)) return false;
      const lStart = new Date(l.startDate);
      const lEnd = new Date(l.endDate);
      return (start <= lEnd && end >= lStart);
    });
  }, [leaveForm.startDate, leaveForm.endDate, leaveForm.employeeId, leaveForm.isHalfDay, leaves]);

  const isDateRangeInvalid = React.useMemo(() => {
    if (!leaveForm.startDate || (!leaveForm.isHalfDay && !leaveForm.endDate)) return false;
    if (leaveForm.isHalfDay) return false;
    return new Date(leaveForm.endDate) < new Date(leaveForm.startDate);
  }, [leaveForm.startDate, leaveForm.endDate, leaveForm.isHalfDay]);

  const selectedLeaveType = leaveTypes?.find((t: any) => t.id === parseInt(leaveForm.leaveTypeId));
  const leaveUsage = leaves?.filter((l: any) => l.employeeId === parseInt(leaveForm.employeeId || '0') && l.leaveTypeId === parseInt(leaveForm.leaveTypeId || '0') && l.status === 'Approved').reduce((s: number, l: any) => s + (l.days || 0), 0) || 0;
  const remainingBalance = selectedLeaveType?.maxDays ? (selectedLeaveType.maxDays - leaveUsage) : null;

  // Filter leaves based on tab
  const pendingLeaves = leaves?.filter((leave: any) => leave.status === 'Pending') || [];
  const approvedLeaves = leaves?.filter((leave: any) => leave.status === 'Approved') || [];
  const rejectedLeaves = leaves?.filter((leave: any) => leave.status === 'Rejected') || [];

  // Loading state
  if (leavesLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Typography variant="h6">Loading leave data...</Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (leavesError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <Typography variant="h6" color="error">
            Error loading leave data: {(leavesError as any)?.message || 'Unknown error'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Leave Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isEmployee && (
            <Button
              variant="outlined"
              onClick={() => setLeaveTypeDialogOpen(true)}
              sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            >
              Manage Leave Types
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // For employees default to self
              if (isEmployee) {
                setLeaveForm((prev) => ({ ...prev, employeeId: String(currentUser?.id || '') }));
              }
              setLeaveDialogOpen(true);
            }}
            sx={{ backgroundColor: 'primary.main' }}
          >
            Add Leave Request
          </Button>
        </Box>
      </Box>

      {/* Tabs for different leave statuses */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label={`All Leaves (${leaves?.length || 0})`} />
          <Tab label={`Pending (${pendingLeaves.length})`} />
          <Tab label={`Approved (${approvedLeaves.length})`} />
          <Tab label={`Rejected (${rejectedLeaves.length})`} />
        </Tabs>
      </Box>

      {/* Leaves Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Employee
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Leave Type
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Start Date
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                End Date
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Days
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Reason
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
            {(() => {
              let displayLeaves = leaves || [];
              if (activeTab === 1) displayLeaves = pendingLeaves;
              else if (activeTab === 2) displayLeaves = approvedLeaves;
              else if (activeTab === 3) displayLeaves = rejectedLeaves;

              return displayLeaves.map((leave: any, index: number) => (
                <TableRow
                  key={leave.id}
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                    '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {leave.employee?.fullName || 'Unknown Employee'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {leave.employee?.userName || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {leave.leaveType?.name || 'Unknown Type'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {leave.leaveType?.isPaid ? 'Paid' : 'Unpaid'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ mr: 1, fontSize: 16 }} />
                      {formatDate(leave.startDate)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarTodayIcon sx={{ mr: 1, fontSize: 16 }} />
                      {formatDate(leave.endDate)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {leave.days} days
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {leave.reason}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        icon={getStatusIcon(leave.status)}
                        label={leave.status} 
                        size="small" 
                        color={getStatusColor(leave.status) as any}
                      />
                      {leave.status === 'Pending' && leave.employee?.manager?.fullName && (
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                          Waiting for: {leave.employee.manager.fullName}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      if (leave.status !== 'Pending') return null;
                      
                      // Hierarchy check
                      const isAdmin = role === 'admin' || role === 'superadmin';
                      const isDirectManager = leave.employee?.managerId === currentUser?.id;
                      // We don't have dept manager ID in the UI easily without more data, 
                      // but we can trust the backend to enforce it. 
                      // For UI simplicity, we show if Admin or Direct Manager.
                      
                      const canActuallyApprove = isAdmin || isDirectManager;
                      const isSelf = leave.employeeId === currentUser?.id;

                      if (canActuallyApprove && !isSelf) {
                        return (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => approveLeaveMutation.mutate({ id: leave.id })}
                              color="success"
                              title="Approve"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => rejectLeaveMutation.mutate({ id: leave.id, comments: 'Rejected by manager' })}
                              color="error"
                              title="Reject"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        );
                      }
                      return null;
                    })()}
                  </TableCell>
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Leave Dialog */}
      <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', mb: 2 }}>
          {`New Leave Request${isEmployee ? '' : (leaveForm.employeeId ? ` - ${getEmployeeNameById(leaveForm.employeeId)}` : '')}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
            {/* Form Section */}
            <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {!isEmployee && (
                  <FormControl fullWidth>
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={leaveForm.employeeId}
                      onChange={(e) => handleLeaveFormChange('employeeId', e.target.value)}
                      label="Employee"
                    >
                      {employees?.map((employee: any) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <FormControl fullWidth>
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={leaveForm.leaveTypeId}
                    onChange={(e) => handleLeaveFormChange('leaveTypeId', e.target.value)}
                    label="Leave Type"
                  >
                    {leaveTypes?.map((leaveType: any) => (
                      <MenuItem key={leaveType.id} value={leaveType.id}>
                        {leaveType.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={leaveForm.isHalfDay} 
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, isHalfDay: e.target.checked }))} 
                    />
                  }
                  label="Half Day Request"
                />
                {leaveForm.isHalfDay && (
                  <RadioGroup
                    row
                    value={leaveForm.halfDayPeriod}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, halfDayPeriod: e.target.value as any }))}
                    sx={{ ml: 4 }}
                  >
                    <FormControlLabel value="Morning" control={<Radio size="small" />} label="Morning" />
                    <FormControlLabel value="Afternoon" control={<Radio size="small" />} label="Afternoon" />
                  </RadioGroup>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label={leaveForm.isHalfDay ? "Date" : "Start Date"}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={leaveForm.startDate}
                  onChange={(e) => handleLeaveFormChange('startDate', e.target.value)}
                />
                {!leaveForm.isHalfDay && (
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={leaveForm.endDate}
                    onChange={(e) => handleLeaveFormChange('endDate', e.target.value)}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Handover Person</InputLabel>
                  <Select
                    value={leaveForm.handoverId}
                    onChange={(e) => handleLeaveFormChange('handoverId', e.target.value)}
                    label="Handover Person"
                  >
                    <MenuItem value="">None</MenuItem>
                    {employees?.filter((e: any) => e.id !== parseInt(leaveForm.employeeId || '0')).map((employee: any) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Emergency Contact"
                  placeholder="Phone number"
                  value={leaveForm.emergencyContact}
                  onChange={(e) => handleLeaveFormChange('emergencyContact', e.target.value)}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>

              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={2}
                value={leaveForm.reason}
                onChange={(e) => handleLeaveFormChange('reason', e.target.value)}
              />
              
              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AttachFileIcon />}
                  sx={{ mb: 1 }}
                >
                  Upload Attachment
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, attachment: e.target.files ? e.target.files[0] : null }))}
                  />
                </Button>
                {leaveForm.attachment && (
                  <Typography variant="caption" display="block" sx={{ ml: 1 }}>
                    Selected: {leaveForm.attachment.name}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Preview Section */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card variant="outlined" sx={{ bgcolor: 'rgba(2, 136, 209, 0.04)', borderColor: 'primary.light' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <HealthAndSafetyIcon sx={{ mr: 1, fontSize: 18 }} />
                    Request Preview
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">Requested Days:</Typography>
                    <Typography variant="body2" fontWeight={700}>{estimatedDays} Days</Typography>
                  </Box>
                  
                  {remainingBalance !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">Current Balance:</Typography>
                      <Typography variant="body2" fontWeight={700}>{remainingBalance} Days</Typography>
                    </Box>
                  )}

                  {remainingBalance !== null && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1, borderTop: '1px dashed #ccc' }}>
                      <Typography variant="body2" color="textSecondary">Balance After:</Typography>
                      <Typography variant="body2" fontWeight={700} color={(remainingBalance - estimatedDays) < 0 ? 'error.main' : 'success.main'}>
                        {remainingBalance - estimatedDays} Days
                      </Typography>
                    </Box>
                  )}

                  {(remainingBalance !== null && (remainingBalance - estimatedDays) < 0) && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'error.light', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                      <WarningAmberIcon sx={{ mr: 1, fontSize: 16, color: 'error.dark' }} />
                      <Typography variant="caption" color="error.dark">Insufficient balance!</Typography>
                    </Box>
                  )}

                  {hasOverlap && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1, display: 'flex', alignItems: 'center', border: '1px solid orange' }}>
                      <WarningAmberIcon sx={{ mr: 1, fontSize: 16, color: 'warning.dark' }} />
                      <Typography variant="caption" color="warning.dark" fontWeight={700}>This period overlaps with an already approved leave!</Typography>
                    </Box>
                  )}

                  {isDateRangeInvalid && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'error.light', borderRadius: 1, display: 'flex', alignItems: 'center', border: '1px solid #d32f2f' }}>
                      <WarningAmberIcon sx={{ mr: 1, fontSize: 16, color: 'error.dark' }} />
                      <Typography variant="caption" color="error.dark" fontWeight={700}>End Date cannot be before Start Date!</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              <Typography variant="caption" color="textSecondary" sx={{ px: 1 }}>
                * Calculations exclude weekends (Sat/Sun). 
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f9fafb' }}>
          <Button onClick={() => setLeaveDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitLeave}
            disabled={createLeaveMutation.isPending || (remainingBalance !== null && (remainingBalance - estimatedDays) < 0) || hasOverlap || isDateRangeInvalid}
            size="large"
          >
            {createLeaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Type Management Dialog */}
      <LeaveTypeManagement
        open={leaveTypeDialogOpen}
        onClose={() => setLeaveTypeDialogOpen(false)}
      />
    </Container>
  );
};

export default LeaveManagement;
