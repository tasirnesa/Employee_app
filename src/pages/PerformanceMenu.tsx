import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Tab, 
  Tabs, 
  CardHeader,
  Grid,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Person,
  Work,
  Schedule,
  Star,
  Add,
  Edit,
  Delete
} from '@mui/icons-material';

const PerformanceMenu = () => {
  const [tabValue, setTabValue] = useState('1');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.id);
      setUserRole(typeof payload.role === 'string' ? payload.role.toLowerCase() : null);
    }
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  interface PerformanceData {
    id: number;
    userId: number;
    evaluatorId: number;
    tasksCompleted: number;
    hoursWorked: number;
    efficiencyScore?: number;
    qualityScore?: number;
    punctualityScore?: number;
    collaborationScore?: number;
    innovationScore?: number;
    overallRating?: number;
    feedback?: string;
    evaluationPeriod: string;
    date: string;
    user?: {
      id: number;
      fullName: string;
      userName: string;
    };
    evaluator?: {
      id: number;
      fullName: string;
      userName: string;
    };
  }

  // Form state for creating/editing performance
  const [performanceForm, setPerformanceForm] = useState({
    userId: '',
    evaluatorId: '',
    tasksCompleted: '',
    hoursWorked: '',
    efficiencyScore: '',
    qualityScore: '',
    punctualityScore: '',
    collaborationScore: '',
    innovationScore: '',
    overallRating: '',
    feedback: '',
    evaluationPeriod: '',
    date: new Date().toISOString().split('T')[0]
  });

  const { data: performanceData = [] } = useQuery<PerformanceData[]>({
    queryKey: ['performanceData'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token available');
      const response = await api.get('/api/performance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data as PerformanceData[];
      return data;
    },
    enabled: !!localStorage.getItem('token'),
  });

  // Recalculate performance for current user
  const recalcMine = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token || !userId) throw new Error('No token or userId');
      const res = await api.post(
        '/api/performance/recalculate',
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceData'] });
    },
    onError: (e: any) => {
      console.error('Recalc mine failed', e);
      alert(e?.response?.data?.error || e.message);
    }
  });

  // Recalculate performance for all users (admin only)
  const recalcAll = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      const res = await api.post(
        '/api/performance/recalculate-all',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceData'] });
    },
    onError: (e: any) => {
      console.error('Recalc all failed', e);
      alert(e?.response?.data?.error || e.message);
    }
  });

  // Fetch users for dropdowns
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Create performance mutation
  const createPerformanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/performance', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceData'] });
      setPerformanceDialogOpen(false);
      setPerformanceForm({
        userId: '',
        evaluatorId: '',
        tasksCompleted: '',
        hoursWorked: '',
        efficiencyScore: '',
        qualityScore: '',
        punctualityScore: '',
        collaborationScore: '',
        innovationScore: '',
        overallRating: '',
        feedback: '',
        evaluationPeriod: '',
        date: new Date().toISOString().split('T')[0]
      });
    },
    onError: (error: any) => {
      console.error('Error creating performance record:', error);
      alert('Error creating performance record: ' + (error?.response?.data?.error || error.message));
    }
  });

  const handlePerformanceFormChange = (field: string, value: string) => {
    setPerformanceForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitPerformance = () => {
    if (!performanceForm.userId || !performanceForm.evaluatorId || !performanceForm.tasksCompleted || !performanceForm.hoursWorked || !performanceForm.evaluationPeriod || !performanceForm.date) {
      alert('Please fill in all required fields');
      return;
    }
    const payload = {
      userId: parseInt(performanceForm.userId),
      evaluatorId: parseInt(performanceForm.evaluatorId),
      tasksCompleted: parseInt(performanceForm.tasksCompleted),
      hoursWorked: parseInt(performanceForm.hoursWorked),
      efficiencyScore: performanceForm.efficiencyScore ? parseFloat(performanceForm.efficiencyScore) : null,
      qualityScore: performanceForm.qualityScore ? parseFloat(performanceForm.qualityScore) : null,
      punctualityScore: performanceForm.punctualityScore ? parseFloat(performanceForm.punctualityScore) : null,
      collaborationScore: performanceForm.collaborationScore ? parseFloat(performanceForm.collaborationScore) : null,
      innovationScore: performanceForm.innovationScore ? parseFloat(performanceForm.innovationScore) : null,
      overallRating: performanceForm.overallRating ? parseFloat(performanceForm.overallRating) : null,
      feedback: performanceForm.feedback,
      evaluationPeriod: performanceForm.evaluationPeriod,
      date: performanceForm.date
    };
    createPerformanceMutation.mutate(payload);
  };

  // Calculate performance metrics
  const calculateMetrics = (data: PerformanceData[]) => {
    if (data.length === 0) return { avgRating: 0, totalTasks: 0, totalHours: 0, trend: 'stable' };
    
    const avgRating = data.reduce((sum, item) => sum + (item.overallRating || 0), 0) / data.length;
    const totalTasks = data.reduce((sum, item) => sum + item.tasksCompleted, 0);
    const totalHours = data.reduce((sum, item) => sum + item.hoursWorked, 0);
    
    // Simple trend calculation
    const recentData = data.slice(0, 3);
    const olderData = data.slice(3, 6);
    const recentAvg = recentData.reduce((sum, item) => sum + (item.overallRating || 0), 0) / recentData.length;
    const olderAvg = olderData.length > 0 ? olderData.reduce((sum, item) => sum + (item.overallRating || 0), 0) / olderData.length : recentAvg;
    
    const trend = recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable';
    
    return { avgRating, totalTasks, totalHours, trend };
  };

  const metrics = calculateMetrics(performanceData);
  const myPerformanceData = performanceData.filter(item => item.userId === userId);
  const myMetrics = calculateMetrics(myPerformanceData);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Performance Analytics
        </Typography>
        {(userRole === 'admin' || userRole === 'superadmin') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setPerformanceDialogOpen(true)}
            sx={{ backgroundColor: 'primary.main' }}
          >
            Add Performance Record
          </Button>
        )}
        <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => recalcMine.mutate()}
            disabled={recalcMine.isPending || !userId}
          >
            {recalcMine.isPending ? 'Recalculating...' : 'Recalculate My Performance'}
          </Button>
          {(userRole === 'admin' || userRole === 'superadmin') && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => recalcAll.mutate()}
              disabled={recalcAll.isPending}
            >
              {recalcAll.isPending ? 'Recalculating All...' : 'Recalculate All Users'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Performance Metrics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Average Rating
                  </Typography>
                  <Typography variant="h6">
                    {myMetrics.avgRating.toFixed(1)}/5
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Tasks
                  </Typography>
                  <Typography variant="h6">
                    {myMetrics.totalTasks}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Hours
                  </Typography>
                  <Typography variant="h6">
                    {myMetrics.totalHours}h
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: myMetrics.trend === 'up' ? 'success.main' : myMetrics.trend === 'down' ? 'error.main' : 'warning.main', mr: 2 }}>
                  {myMetrics.trend === 'up' ? <TrendingUp /> : myMetrics.trend === 'down' ? <TrendingDown /> : <Assessment />}
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Performance Trend
                  </Typography>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {myMetrics.trend}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card elevation={3}>
        <CardContent>
          <TabContext value={tabValue}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="performance tabs">
              <Tab label="My Performance" value="1" />
              {(userRole === 'admin' || userRole === 'superadmin') && <Tab label="All Users" value="2" />}
            </Tabs>
            
            <TabPanel value="1">
              <Typography variant="h6" sx={{ mb: 2 }}>My Performance</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell>Tasks</TableCell>
                      <TableCell>Hours</TableCell>
                      <TableCell>Efficiency</TableCell>
                      <TableCell>Quality</TableCell>
                      <TableCell>Overall</TableCell>
                      <TableCell>Feedback</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myPerformanceData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>{item.evaluationPeriod}</TableCell>
                        <TableCell>{item.tasksCompleted}</TableCell>
                        <TableCell>{item.hoursWorked}</TableCell>
                        <TableCell>
                          {item.efficiencyScore ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(item.efficiencyScore / 5) * 100} 
                                sx={{ width: 60, mr: 1 }}
                              />
                              <Typography variant="body2">{item.efficiencyScore}/5</Typography>
                            </Box>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {item.qualityScore ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(item.qualityScore / 5) * 100} 
                                sx={{ width: 60, mr: 1 }}
                              />
                              <Typography variant="body2">{item.qualityScore}/5</Typography>
                            </Box>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {item.overallRating ? (
                            <Chip 
                              label={`${item.overallRating}/5`} 
                              color={item.overallRating >= 4 ? 'success' : item.overallRating >= 3 ? 'warning' : 'error'}
                              size="small"
                            />
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.feedback || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {myPerformanceData.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="textSecondary">No performance data available.</Typography>
                </Box>
              )}
            </TabPanel>
            
            {(userRole === 'admin' || userRole === 'superadmin') && (
              <TabPanel value="2">
                <Typography variant="h6" sx={{ mb: 2 }}>All Users' Performance</Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Evaluator</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Tasks</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Overall</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {item.user?.fullName || `User ${item.userId}`}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {item.user?.userName || ''}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {item.evaluator?.fullName || `User ${item.evaluatorId}`}
                          </TableCell>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell>{item.evaluationPeriod}</TableCell>
                          <TableCell>{item.tasksCompleted}</TableCell>
                          <TableCell>{item.hoursWorked}</TableCell>
                          <TableCell>
                            {item.overallRating ? (
                              <Chip 
                                label={`${item.overallRating}/5`} 
                                color={item.overallRating >= 4 ? 'success' : item.overallRating >= 3 ? 'warning' : 'error'}
                                size="small"
                              />
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={(item.overallRating || 0) >= 4 ? 'Excellent' : (item.overallRating || 0) >= 3 ? 'Good' : (item.overallRating || 0) >= 2 ? 'Fair' : 'Needs Improvement'} 
                              color={(item.overallRating || 0) >= 4 ? 'success' : (item.overallRating || 0) >= 3 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {performanceData.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary">No performance data available for any user.</Typography>
                  </Box>
                )}
              </TabPanel>
            )}
          </TabContext>
        </CardContent>
      </Card>

      {/* Add Performance Dialog */}
      <Dialog open={performanceDialogOpen} onClose={() => setPerformanceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Performance Record</DialogTitle>
        <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={performanceForm.userId}
                  onChange={(e) => handlePerformanceFormChange('userId', e.target.value)}
                  label="Employee"
                >
                  {users?.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Evaluator</InputLabel>
                <Select
                  value={performanceForm.evaluatorId}
                  onChange={(e) => handlePerformanceFormChange('evaluatorId', e.target.value)}
                  label="Evaluator"
                >
                  {users?.map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Tasks Completed"
                type="number"
                value={performanceForm.tasksCompleted}
                onChange={(e) => handlePerformanceFormChange('tasksCompleted', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Hours Worked"
                type="number"
                value={performanceForm.hoursWorked}
                onChange={(e) => handlePerformanceFormChange('hoursWorked', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Efficiency Score (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={performanceForm.efficiencyScore}
                onChange={(e) => handlePerformanceFormChange('efficiencyScore', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Quality Score (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={performanceForm.qualityScore}
                onChange={(e) => handlePerformanceFormChange('qualityScore', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Punctuality Score (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={performanceForm.punctualityScore}
                onChange={(e) => handlePerformanceFormChange('punctualityScore', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Collaboration Score (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={performanceForm.collaborationScore}
                onChange={(e) => handlePerformanceFormChange('collaborationScore', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Innovation Score (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={performanceForm.innovationScore}
                onChange={(e) => handlePerformanceFormChange('innovationScore', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Overall Rating (1-5)"
                type="number"
                inputProps={{ min: 1, max: 5 }}
                value={performanceForm.overallRating}
                onChange={(e) => handlePerformanceFormChange('overallRating', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Evaluation Period"
                value={performanceForm.evaluationPeriod}
                onChange={(e) => handlePerformanceFormChange('evaluationPeriod', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={performanceForm.date}
                onChange={(e) => handlePerformanceFormChange('date', e.target.value)}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Feedback"
                multiline
                rows={3}
                value={performanceForm.feedback}
                onChange={(e) => handlePerformanceFormChange('feedback', e.target.value)}
              />
              </Box>
            </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerformanceDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitPerformance}
            disabled={createPerformanceMutation.isPending}
          >
            {createPerformanceMutation.isPending ? 'Adding...' : 'Add Performance Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceMenu;