import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { Leave, LeaveType } from '../types/interfaces';
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
  Grid,
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

const LeaveManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Check user role for access control
  const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
  const isEmployee = userRole === 'Employee';

  // Form state
  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    comments: ''
  });

  // Fetch leaves data
  const { data: leaves, isLoading: leavesLoading, error: leavesError } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/leaves', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch leave types for dropdown
  const { data: leaveTypes } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/leave-types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch users for dropdown
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Form handlers
  const handleLeaveFormChange = (field: string, value: string) => {
    setLeaveForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Mutations
  const createLeaveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/leaves', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setLeaveDialogOpen(false);
      setLeaveForm({
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        comments: ''
      });
    },
    onError: (error: any) => {
      console.error('Error creating leave:', error);
      alert('Error creating leave: ' + (error?.response?.data?.error || error.message));
    }
  });

  const approveLeaveMutation = useMutation({
    mutationFn: async ({ id, approvedBy, comments }: { id: number; approvedBy: number; comments?: string }) => {
      const token = localStorage.getItem('token');
      const res = await api.patch(`/api/leaves/${id}/approve`, { approvedBy, comments }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (error: any) => {
      console.error('Error approving leave:', error);
      alert('Error approving leave: ' + (error?.response?.data?.error || error.message));
    }
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: number; comments?: string }) => {
      const token = localStorage.getItem('token');
      const res = await api.patch(`/api/leaves/${id}/reject`, { comments }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
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
    const payload = {
      employeeId: parseInt(leaveForm.employeeId),
      leaveTypeId: parseInt(leaveForm.leaveTypeId),
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      comments: leaveForm.comments
    };
    createLeaveMutation.mutate(payload);
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

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Filter leaves based on tab
  const pendingLeaves = leaves?.filter((leave: any) => leave.status === 'Pending') || [];
  const approvedLeaves = leaves?.filter((leave: any) => leave.status === 'Approved') || [];
  const rejectedLeaves = leaves?.filter((leave: any) => leave.status === 'Rejected') || [];

  return (
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Leave Management
        </Typography>
        {!isEmployee && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setLeaveDialogOpen(true)}
            sx={{ backgroundColor: 'primary.main' }}
          >
            Add Leave Request
          </Button>
        )}
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
                    <Chip 
                      icon={getStatusIcon(leave.status)}
                      label={leave.status} 
                      size="small" 
                      color={getStatusColor(leave.status) as any}
                    />
                  </TableCell>
                  <TableCell>
                    {!isEmployee && leave.status === 'Pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const currentUser = JSON.parse(localStorage.getItem('userProfile') || '{}');
                            approveLeaveMutation.mutate({ 
                              id: leave.id, 
                              approvedBy: currentUser.id 
                            });
                          }}
                          color="success"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            rejectLeaveMutation.mutate({ 
                              id: leave.id, 
                              comments: 'Rejected by manager' 
                            });
                          }}
                          color="error"
                        >
                          <CancelIcon />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Leave Dialog */}
      <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Leave Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={leaveForm.leaveTypeId}
                  onChange={(e) => handleLeaveFormChange('leaveTypeId', e.target.value)}
                  label="Leave Type"
                >
                  {leaveTypes?.map((leaveType: any) => (
                    <MenuItem key={leaveType.id} value={leaveType.id}>
                      {leaveType.name} {leaveType.maxDays ? `(Max: ${leaveType.maxDays} days)` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={leaveForm.startDate}
                onChange={(e) => handleLeaveFormChange('startDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={leaveForm.endDate}
                onChange={(e) => handleLeaveFormChange('endDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                value={leaveForm.reason}
                onChange={(e) => handleLeaveFormChange('reason', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comments (Optional)"
                multiline
                rows={2}
                value={leaveForm.comments}
                onChange={(e) => handleLeaveFormChange('comments', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitLeave}
            disabled={createLeaveMutation.isPending}
          >
            {createLeaveMutation.isPending ? 'Adding...' : 'Add Leave Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeaveManagement;
