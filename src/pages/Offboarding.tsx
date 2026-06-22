import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ExitToApp as OffboardingIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import api from '../lib/axios';

interface OffboardingTask {
  id: number;
  title: string;
  description: string;
  status: 'Pending' | 'Completed';
  completedAt?: string;
}

interface OffboardingRecord {
  id: number;
  employeeId: number;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    position?: { name: string };
  };
  status: 'InProgress' | 'Completed' | 'Cancelled';
  initiationDate: string;
  plannedLastDate?: string;
  reason?: string;
  tasks: OffboardingTask[];
}

const Offboarding: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OffboardingRecord | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    plannedLastDate: '',
    reason: '',
    notes: '',
  });

  // Queries
  const { data: offboardings, isLoading } = useQuery({
    queryKey: ['offboardings'],
    queryFn: async () => {
      const response = await api.get('/api/offboarding');
      return response.data as OffboardingRecord[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async () => {
      const response = await api.get('/api/employees?isActive=true');
      return response.data;
    },
  });

  useEffect(() => {
    const employeeId = searchParams.get('employeeId');
    if (employeeId) {
      setFormData(prev => ({ ...prev, employeeId }));
      setInitiateDialogOpen(true);
    }
  }, [searchParams]);

  // Mutations
  const initiateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/api/offboarding/initiate', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
      setInitiateDialogOpen(false);
      setFormData({ employeeId: '', plannedLastDate: '', reason: '', notes: '' });
      alert('Offboarding process initiated');
    },
    onError: (error: any) => alert('Error initiating: ' + (error.response?.data?.error || error.message)),
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await api.patch(`/api/offboarding/tasks/${taskId}/complete`);
      return response.data;
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
      setSelectedRecord(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(task => task.id === updatedTask.id ? { ...task, ...updatedTask } : task),
      } : prev);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/api/offboarding/${id}/finalize`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
      setDetailsDialogOpen(false);
      alert('Offboarding finalized and employee deactivated');
    },
    onError: (error: any) => alert('Error finalizing: ' + (error.response?.data?.error || error.message)),
  });

  const handleInitiateClick = () => {
    setInitiateDialogOpen(true);
  };

  const handleViewDetails = (record: OffboardingRecord) => {
    setSelectedRecord(record);
    setDetailsDialogOpen(true);
  };

  const handleInitiateSubmit = () => {
    if (!formData.employeeId) {
      alert('Please select an employee');
      return;
    }
    initiateMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'InProgress': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const calculateProgress = (tasks: OffboardingTask[]) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={800} color="#1e293b">
          Offboarding Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleInitiateClick}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Initiate Offboarding
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Initiation Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Last Working Day</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
            ) : offboardings?.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No offboarding records found</TableCell></TableRow>
            ) : (
              offboardings?.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {record.employee.firstName} {record.employee.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.employee.position?.name || 'Position N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(record.initiationDate).toLocaleDateString()}</TableCell>
                  <TableCell>{record.plannedLastDate ? new Date(record.plannedLastDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={calculateProgress(record.tasks)} 
                          sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
                        />
                      </Box>
                      <Typography variant="caption" fontWeight={700}>
                        {calculateProgress(record.tasks)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={record.status} 
                      size="small" 
                      color={getStatusColor(record.status)} 
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleViewDetails(record)} sx={{ color: 'primary.main' }}>
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Initiation Dialog */}
      <Dialog open={initiateDialogOpen} onClose={() => setInitiateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Initiate Offboarding</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Select Employee"
              fullWidth
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            >
              {employees?.map((emp: any) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.position?.name})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Planned Last Working Day"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.plannedLastDate}
              onChange={(e) => setFormData({ ...formData, plannedLastDate: e.target.value })}
            />
            <TextField
              label="Reason for Separation"
              select
              fullWidth
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            >
              <MenuItem value="Resignation">Resignation</MenuItem>
              <MenuItem value="Termination">Termination</MenuItem>
              <MenuItem value="Retirement">Retirement</MenuItem>
              <MenuItem value="Contract End">Contract End</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setInitiateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInitiateSubmit} disabled={initiateMutation.isPending}>
            Initiate Process
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details / Task List Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedRecord && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               Offboarding Checklist: {selectedRecord.employee.firstName} {selectedRecord.employee.lastName}
               <Chip label={selectedRecord.status} color={getStatusColor(selectedRecord.status)} size="small" />
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Overall Progress</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateProgress(selectedRecord.tasks)} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Typography variant="h6" fontWeight={800}>{calculateProgress(selectedRecord.tasks)}%</Typography>
                </Box>
              </Box>

              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Separation Tasks</Typography>
              <List sx={{ bgcolor: '#f8fafc', borderRadius: 3, p: 1 }}>
                {selectedRecord.tasks.map((task, index) => (
                  <React.Fragment key={task.id}>
                    <ListItem
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          checked={task.status === 'Completed'}
                          disabled={task.status === 'Completed' || selectedRecord.status !== 'InProgress'}
                          onChange={() => completeTaskMutation.mutate(task.id)}
                        />
                      }
                      sx={{ py: 1.5 }}
                    >
                      <ListItemIcon>
                        {task.status === 'Completed' ? <CheckCircleIcon color="success" /> : <UncheckedIcon color="disabled" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body1" fontWeight={700}>{task.title}</Typography>}
                        secondary={task.description}
                      />
                    </ListItem>
                    {index < selectedRecord.tasks.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              {selectedRecord.status === 'InProgress' && calculateProgress(selectedRecord.tasks) === 100 && (
                <Button 
                  variant="contained" 
                  color="error" 
                  startIcon={<PersonRemoveIcon />}
                  onClick={() => {
                    if (window.confirm('Finalizing will deactivate this employee. Proceed?')) {
                      finalizeMutation.mutate(selectedRecord.id);
                    }
                  }}
                >
                  Finalize & Deactivate
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Offboarding;
