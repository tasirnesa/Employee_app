import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Tab, Tabs, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { Session } from '../types/interfaces';

const ScheduleMenu = () => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState('1');
  const [openDialog, setOpenDialog] = useState(false);
  const queryClient = useQueryClient();

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
      setOpenDialog(false);
      queryClient.invalidateQueries({ queryKey: ['evaluationStats'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      alert('Evaluation session created successfully!');
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
    enabled: !!localStorage.getItem('token'),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token available');
      const response = await axios.get('http://localhost:3000/api/evaluation-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched sessions:', response.data);
      return response.data as Session[];
    },
    enabled: !!localStorage.getItem('token'),
  });

  const getCurrentWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(now.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
  };

  const currentWeek = getCurrentWeekRange();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  // Filter sessions for current week
  const weekSessions = sessions.filter(session => {
    const start = new Date(session.startDate).toISOString().split('T')[0]; // Normalize date
    const end = new Date(session.endDate).toISOString().split('T')[0]; // Normalize date
    console.log(`Checking session: ${session.title}, start: ${start}, end: ${end}, week: ${currentWeek.start} to ${currentWeek.end}`);
    return start >= currentWeek.start && end <= currentWeek.end;
  });

  // Filter sessions for upcoming (tomorrow and day after)
  const upcomingSessions = sessions.filter(session => {
    const end = new Date(session.endDate).toISOString().split('T')[0]; // Normalize date
    console.log(`Checking session: ${session.title}, end: ${end}, tomorrow: ${tomorrowStr}, day after: ${dayAfterTomorrowStr}`);
    return end === tomorrowStr || end === dayAfterTomorrowStr;
  });

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom align="center">
        Schedule Management
      </Typography>
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardHeader
          title={<Typography variant="h6" color="primary">Schedule</Typography>}
          action={
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mr: 2 }}>
                Manage the Session and Events
              </Typography>
              <Button variant="contained" color="secondary" size="small" onClick={() => setOpenDialog(true)}>
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
              {weekSessions.length > 0 ? (
                <ul>
                  {weekSessions.map((session) => (
                    <li key={session.id}>
                      {session.title} ({session.startDate} to {session.endDate})
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography>No schedules for this week.</Typography>
              )}
            </TabPanel>
            <TabPanel value="2">
              {upcomingSessions.length > 0 ? (
                <ul>
                  {upcomingSessions.map((session) => (
                    <li key={session.id}>
                      {session.title} (Ends: {session.endDate})
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography>No upcoming schedules for tomorrow or the day after.</Typography>
              )}
            </TabPanel>
            <TabPanel value="3">
              <Calendar
                value={new Date()}
                onChange={() => {}}
                tileContent={({ date }) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const session = sessions.find(s => new Date(s.startDate).toISOString().split('T')[0] <= dateStr && new Date(s.endDate).toISOString().split('T')[0] >= dateStr);
                  return session ? <div style={{ background: '#ffeb3b', borderRadius: '50%', width: '8px', height: '8px', margin: '0 auto' }} /> : null;
                }}
              />
            </TabPanel>
          </TabContext>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>New Event</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ScheduleMenu;