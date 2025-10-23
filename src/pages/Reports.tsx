import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  Assessment,
  Work,
  Schedule,
  Star,
  CheckCircle,
  Cancel,
  Pending
} from '@mui/icons-material';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../lib/axios';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement);

function Reports() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Fetch comprehensive data
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

  const { data: evaluations } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/evaluations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const { data: performanceData } = useQuery({
    queryKey: ['performanceData'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/performance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/attendance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const { data: leavesData } = useQuery({
    queryKey: ['leaves'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/leaves', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const { data: timesheetsData } = useQuery({
    queryKey: ['timesheets'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/timesheets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Calculate analytics
  const calculateAnalytics = () => {
    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter((user: any) => user.activeStatus === 'Active').length || 0;
    const totalEvaluations = evaluations?.length || 0;
    const avgPerformance = performanceData?.length ? 
      performanceData.reduce((sum: number, p: any) => sum + (p.overallRating || 0), 0) / performanceData.length : 0;
    
    const attendanceRate = attendanceData?.length ? 
      (attendanceData.filter((a: any) => a.status === 'Present').length / attendanceData.length) * 100 : 0;
    
    const pendingLeaves = leavesData?.filter((l: any) => l.status === 'Pending').length || 0;
    const approvedLeaves = leavesData?.filter((l: any) => l.status === 'Approved').length || 0;
    const totalHours = timesheetsData?.reduce((sum: number, t: any) => sum + t.hoursWorked, 0) || 0;

    return {
      totalUsers,
      activeUsers,
      totalEvaluations,
      avgPerformance,
      attendanceRate,
      pendingLeaves,
      approvedLeaves,
      totalHours
    };
  };

  const analytics = calculateAnalytics();

  // Chart data
  const userRoleData = {
    labels: ['Admin', 'Super Admin', 'Employee'],
    datasets: [{
      data: [
        users?.filter((u: any) => u.role === 'admin').length || 0,
        users?.filter((u: any) => u.role === 'superadmin').length || 0,
        users?.filter((u: any) => u.role === 'Employee').length || 0,
      ],
      backgroundColor: ['#4CAF50', '#2196F3', '#FF9800'],
      borderWidth: 0,
    }]
  };

  const performanceTrendData = {
    labels: performanceData?.slice(0, 10).map((_: any, index: number) => `Period ${index + 1}`) || [],
    datasets: [{
      label: 'Average Performance',
      data: performanceData?.slice(0, 10).map((p: any) => p.overallRating || 0) || [],
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2,
      tension: 0.4,
    }]
  };

  const leaveStatusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      data: [
        leavesData?.filter((l: any) => l.status === 'Pending').length || 0,
        leavesData?.filter((l: any) => l.status === 'Approved').length || 0,
        leavesData?.filter((l: any) => l.status === 'Rejected').length || 0,
      ],
      backgroundColor: ['#FF9800', '#4CAF50', '#F44336'],
      borderWidth: 0,
    }]
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" gutterBottom>
          Analytics & Reports
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            label="Period"
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h6">
                    {analytics.totalUsers}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {analytics.activeUsers} active
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
                  <Assessment />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Performance
                  </Typography>
                  <Typography variant="h6">
                    {analytics.avgPerformance.toFixed(1)}/5
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(analytics.avgPerformance / 5) * 100} 
                    sx={{ mt: 1 }}
                  />
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
                    Attendance Rate
                  </Typography>
                  <Typography variant="h6">
                    {analytics.attendanceRate.toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={analytics.attendanceRate} 
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Hours
                  </Typography>
                  <Typography variant="h6">
                    {analytics.totalHours.toFixed(1)}h
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    This period
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs for different report types */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Performance" />
          <Tab label="Attendance" />
          <Tab label="Leave Management" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Distribution
                </Typography>
                <Doughnut 
                  data={userRoleData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leave Status Distribution
                </Typography>
                <Doughnut 
                  data={leaveStatusData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Performance Tab */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
      </Typography>
        <Bar
                  data={performanceTrendData}
          options={{
                    responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                        max: 5,
                        title: {
                          display: true,
                          text: 'Rating'
                        }
                      }
            },
            plugins: {
                      legend: {
                        display: false,
                      },
            },
          }}
        />
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Performers
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Performance</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData?.slice(0, 5).map((perf: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {perf.user?.fullName?.charAt(0) || 'U'}
                              </Avatar>
                              {perf.user?.fullName || `User ${perf.userId}`}
                            </Box>
                          </TableCell>
                          <TableCell>Engineering</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(perf.overallRating || 0) / 5 * 100} 
                                sx={{ width: 100, mr: 1 }}
                              />
                              <Typography variant="body2">
                                {perf.overallRating?.toFixed(1) || 'N/A'}/5
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={perf.overallRating >= 4 ? 'Excellent' : perf.overallRating >= 3 ? 'Good' : 'Needs Improvement'}
                              color={perf.overallRating >= 4 ? 'success' : perf.overallRating >= 3 ? 'warning' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Attendance Tab */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Attendance Summary
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Check In</TableCell>
                        <TableCell>Check Out</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceData?.slice(0, 10).map((attendance: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {attendance.employee?.fullName?.charAt(0) || 'E'}
                              </Avatar>
                              {attendance.employee?.fullName || `Employee ${attendance.employeeId}`}
                            </Box>
                          </TableCell>
                          <TableCell>{new Date(attendance.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString() : '-'}
                          </TableCell>
                          <TableCell>
                            {attendance.checkOutTime ? new Date(attendance.checkOutTime).toLocaleTimeString() : '-'}
                          </TableCell>
                          <TableCell>{attendance.hoursWorked || 0}h</TableCell>
                          <TableCell>
                            <Chip 
                              label={attendance.status}
                              color={attendance.status === 'Present' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Leave Management Tab */}
      {activeTab === 3 && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ width: '100%' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Leave Requests Summary
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Leave Type</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Days</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Applied Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leavesData?.slice(0, 10).map((leave: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {leave.employee?.fullName?.charAt(0) || 'E'}
                              </Avatar>
                              {leave.employee?.fullName || `Employee ${leave.employeeId}`}
                            </Box>
                          </TableCell>
                          <TableCell>{leave.leaveType?.name || 'Unknown'}</TableCell>
                          <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                          <TableCell>{leave.days}</TableCell>
                          <TableCell>
                            <Chip 
                              icon={leave.status === 'Approved' ? <CheckCircle /> : leave.status === 'Rejected' ? <Cancel /> : <Pending />}
                              label={leave.status}
                              color={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{new Date(leave.appliedDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default Reports;