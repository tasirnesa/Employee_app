import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, Typography, Tab, Tabs, CardHeader } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab'; // Correct import for TabPanel
import { useQuery } from '@tanstack/react-query';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const PerformanceMenu = () => {
  const [tabValue, setTabValue] = useState('1');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserId(payload.id);
      setUserRole(payload.role);
    }
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  interface PerformanceData {
    userId: number;
    metrics: { tasksCompleted: number; hoursWorked: number };
    date: string;
  }

  const { data: performanceData = [] } = useQuery<PerformanceData[]>({
    queryKey: ['performanceData'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token available');
      const response = await axios.get('http://localhost:3000/api/performance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = response.data;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        data = data.filter((item: PerformanceData) => item.userId === userId);
      }
      return data;
    },
    enabled: !!localStorage.getItem('token'),
  });

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom align="center">
        Performance Analytics
      </Typography>
      <Card elevation={3}>
        <CardContent>
          <TabContext value={tabValue}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="performance tabs">
              <Tab label="My Performance" value="1" />
              {userRole === 'admin' || userRole === 'superadmin' ? <Tab label="All Users" value="2" /> : null}
            </Tabs>
            <TabPanel value="1">
              <Typography variant="h6">My Performance</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Tasks Completed</TableCell>
                    <TableCell>Hours Worked</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.metrics.tasksCompleted}</TableCell>
                      <TableCell>{item.metrics.hoursWorked}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {performanceData.length === 0 && <Typography>No performance data available.</Typography>}
            </TabPanel>
            {userRole === 'admin' || userRole === 'superadmin' ? (
              <TabPanel value="2">
                <Typography variant="h6">All Users' Performance</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User ID</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Tasks Completed</TableCell>
                      <TableCell>Hours Worked</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.userId}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.metrics.tasksCompleted}</TableCell>
                        <TableCell>{item.metrics.hoursWorked}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {performanceData.length === 0 && <Typography>No performance data available for any user.</Typography>}
              </TabPanel>
            ) : null}
          </TabContext>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMenu;