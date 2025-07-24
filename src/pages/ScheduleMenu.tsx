import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Tab, Tabs, CardHeader } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';
import { useQuery } from '@tanstack/react-query';

const ScheduleMenu = () => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState('1');

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token available. Please log in.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/evaluation-sessions',
        { title, startDate, endDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Evaluation session created:', response.data);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setError('');
      alert('Evaluation session created successfully!');
      refetchStats(); // Refetch stats after creation
    } catch (err) {
      if (err instanceof AxiosError) {
        console.error('Create evaluation session error:', err.response?.data || err.message);
        setError(err.response?.data?.error || 'Failed to create session');
      } else {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      }
    }
  };

  // Fetch dynamic stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['evaluationStats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token available');
      const response = await axios.get('http://localhost:3000/api/evaluation-sessions/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!localStorage.getItem('token'), // Only fetch if token exists
  });

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom align="center">
        Schedule Management
      </Typography>
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardHeader
          title={
            <Typography variant="h6" color="primary">
              Schedule
            </Typography>
          }
          action={
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mr: 2 }}>
                Manage the Session and Events
              </Typography>
              <Button variant="contained" color="secondary" size="small">
                + New Event
              </Button>
            </Box>
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Card sx={{ width: '23%', p: 2 }}>
              <Typography variant="subtitle1">This Week</Typography>
              <Typography variant="h6">{stats?.thisWeek || 0}</Typography>
            </Card>
            <Card sx={{ width: '23%', p: 2 }}>
              <Typography variant="subtitle1">Today</Typography>
              <Typography variant="h6">{stats?.today || 0}</Typography>
            </Card>
            <Card sx={{ width: '23%', p: 2 }}>
              <Typography variant="subtitle1">Meetings</Typography>
              <Typography variant="h6">{stats?.meetings || 0}</Typography>
            </Card>
            <Card sx={{ width: '23%', p: 2 }}>
              <Typography variant="subtitle1">Pending</Typography>
              <Typography variant="h6">{stats?.pending || 0}</Typography>
            </Card>
          </Box>
          <TabContext value={tabValue}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="schedule tabs">
              <Tab label="Week View" value="1" />
              <Tab label="Upcoming" value="2" />
              <Tab label="Calendar" value="3" />
            </Tabs>
            <TabPanel value="1">
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate }}
                />
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2, py: 1.5 }}
                >
                  Schedule
                </Button>
              </form>
            </TabPanel>
            <TabPanel value="2">Upcoming events will be displayed here.</TabPanel>
            <TabPanel value="3">Calendar view will be displayed here.</TabPanel>
          </TabContext>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleMenu;