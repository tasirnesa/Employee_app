import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { Timesheet, Project } from '../types/interfaces';
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WorkIcon from '@mui/icons-material/Work';

const Timesheets: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [timesheetDialogOpen, setTimesheetDialogOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Check user role for access control
  const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
  const isEmployee = userRole === 'Employee';

  // Form state
  const [timesheetForm, setTimesheetForm] = useState({
    employeeId: '',
    projectId: '',
    taskDescription: '',
    date: '',
    startTime: '',
    endTime: '',
    overtimeHours: '0',
    notes: ''
  });

  // Fetch timesheets data
  const { data: timesheets, isLoading: timesheetsLoading, error: timesheetsError } = useQuery({
    queryKey: ['timesheets'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/timesheets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Filter projects based on selected employee (e.g., projects managed by that user)
  const filteredProjects = React.useMemo(() => {
    const list = projects || [];
    const empId = parseInt(timesheetForm.employeeId || '');
    if (Number.isFinite(empId)) {
      const owned = list.filter((p: any) => p.managerId === empId);
      return owned.length ? owned : list;
    }
    return list;
  }, [projects, timesheetForm.employeeId]);

  // Reset project selection when employee changes
  React.useEffect(() => {
    setTimesheetForm((prev) => ({ ...prev, projectId: '' }));
  }, [timesheetForm.employeeId]);

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
  const handleTimesheetFormChange = (field: string, value: string) => {
    setTimesheetForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Mutations
  const createTimesheetMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/timesheets', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      setTimesheetDialogOpen(false);
      setTimesheetForm({
        employeeId: '',
        projectId: '',
        taskDescription: '',
        date: '',
        startTime: '',
        endTime: '',
        overtimeHours: '0',
        notes: ''
      });
    },
    onError: (error: any) => {
      console.error('Error creating timesheet:', error);
      alert('Error creating timesheet: ' + (error?.response?.data?.error || error.message));
    }
  });

  const approveTimesheetMutation = useMutation({
    mutationFn: async ({ id, approvedBy }: { id: number; approvedBy: number }) => {
      const token = localStorage.getItem('token');
      const res = await api.patch(`/api/timesheets/${id}/approve`, { approvedBy }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
    onError: (error: any) => {
      console.error('Error approving timesheet:', error);
      alert('Error approving timesheet: ' + (error?.response?.data?.error || error.message));
    }
  });

  const rejectTimesheetMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const token = localStorage.getItem('token');
      const res = await api.patch(`/api/timesheets/${id}/reject`, { notes }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
    onError: (error: any) => {
      console.error('Error rejecting timesheet:', error);
      alert('Error rejecting timesheet: ' + (error?.response?.data?.error || error.message));
    }
  });

  // Submit handlers
  const handleSubmitTimesheet = () => {
    if (!timesheetForm.employeeId || !timesheetForm.taskDescription || !timesheetForm.date || !timesheetForm.startTime || !timesheetForm.endTime) {
      alert('Please fill in all required fields');
      return;
    }
    // Compose ISO strings that backend can parse as Date
    const dateOnly = timesheetForm.date; // YYYY-MM-DD
    const startIso = `${dateOnly}T${timesheetForm.startTime}:00`;
    const endIso = `${dateOnly}T${timesheetForm.endTime}:00`;
    const payload = {
      employeeId: parseInt(timesheetForm.employeeId),
      projectId: timesheetForm.projectId ? parseInt(timesheetForm.projectId) : null,
      taskDescription: timesheetForm.taskDescription,
      date: dateOnly,
      startTime: startIso,
      endTime: endIso,
      overtimeHours: parseFloat(timesheetForm.overtimeHours) || 0,
      notes: timesheetForm.notes
    };
    createTimesheetMutation.mutate(payload);
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

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Timesheets Management
        </Typography>
        {!isEmployee && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setTimesheetDialogOpen(true)}
            sx={{ backgroundColor: 'primary.main' }}
          >
            Add Timesheet
          </Button>
        )}
      </Box>

      {/* Timesheets Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Employee
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Project
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Task Description
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Date
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Time
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Hours
              </TableCell>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                Overtime
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
            {timesheets?.map((timesheet: any, index: number) => (
              <TableRow
                key={timesheet.id}
                sx={{ 
                  backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                  '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' }
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {timesheet.employee?.fullName || 'Unknown Employee'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {timesheet.employee?.userName || `ID: ${timesheet.employeeId}`}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {timesheet.project?.name || 'No Project'}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {timesheet.taskDescription}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(timesheet.date)}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatTime(timesheet.startTime)} - {formatTime(timesheet.endTime)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {timesheet.hoursWorked.toFixed(1)}h
                  </Typography>
                </TableCell>
                <TableCell>
                  {timesheet.overtimeHours > 0 ? (
                    <Typography variant="body2" color="warning.main">
                      +{timesheet.overtimeHours.toFixed(1)}h
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={timesheet.status} 
                    size="small" 
                    color={getStatusColor(timesheet.status) as any}
                  />
                </TableCell>
                <TableCell>
                  {!isEmployee && timesheet.status === 'Pending' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const currentUser = JSON.parse(localStorage.getItem('userProfile') || '{}');
                          approveTimesheetMutation.mutate({ 
                            id: timesheet.id, 
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
                          rejectTimesheetMutation.mutate({ 
                            id: timesheet.id, 
                            notes: 'Rejected by manager' 
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Timesheet Dialog */}
      <Dialog open={timesheetDialogOpen} onClose={() => setTimesheetDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Timesheet</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={timesheetForm.employeeId}
                  onChange={(e) => handleTimesheetFormChange('employeeId', e.target.value)}
                  label="Employee"
                >
                  {employees?.map((employee: any) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={timesheetForm.projectId}
                  onChange={(e) => handleTimesheetFormChange('projectId', e.target.value)}
                  label="Project"
                >
                  <MenuItem value="">No Project</MenuItem>
                  {filteredProjects.map((project: any) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Task Description"
                multiline
                rows={2}
                value={timesheetForm.taskDescription}
                onChange={(e) => handleTimesheetFormChange('taskDescription', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={timesheetForm.date}
                onChange={(e) => handleTimesheetFormChange('date', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={timesheetForm.startTime}
                onChange={(e) => handleTimesheetFormChange('startTime', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={timesheetForm.endTime}
                onChange={(e) => handleTimesheetFormChange('endTime', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Overtime Hours"
                type="number"
                value={timesheetForm.overtimeHours}
                onChange={(e) => handleTimesheetFormChange('overtimeHours', e.target.value)}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={timesheetForm.notes}
                onChange={(e) => handleTimesheetFormChange('notes', e.target.value)}
              />
            </Box>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimesheetDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitTimesheet}
            disabled={createTimesheetMutation.isPending}
          >
            {createTimesheetMutation.isPending ? 'Adding...' : 'Add Timesheet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Timesheets;
