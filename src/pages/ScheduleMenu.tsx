import React, { useState } from 'react';
import { AxiosError } from 'axios';
import api from '../lib/axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Tab, Tabs, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, FormControl, InputLabel, Select, MenuItem, Switch, Stack } from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { Session } from '../types/interfaces';

const ScheduleMenu = () => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState('1');
  const [openDialog, setOpenDialog] = useState(false);
  const [openActivateDialog, setOpenActivateDialog] = useState(false);
  const [activateSessionId, setActivateSessionId] = useState<number | ''>('');
  const [activateEndDate, setActivateEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Track selected category
  const queryClient = useQueryClient();

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
const isEmployee = userRole === 'Employee';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token available. Please log in.');
      return;
    }

    try {
      const response = await api.post(
        '/api/evaluation-sessions',
        { title, startDate, endDate, department },
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
      const response = await api.get('/api/evaluation-sessions/stats', {
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
      const response = await api.get('/api/evaluation-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = response.data as any[];
      const normalized: Session[] = raw.map((s: any) => ({
        id: s.sessionID ?? s.id,
        title: s.title,
        startDate: s.startDate,
        endDate: s.endDate,
        activatedBy: s.activatedBy ?? s.ActivatedBy ?? 0,
        // expose status via type field
        // @ts-ignore
        status: (s.type || '').toLowerCase() === 'on' ? 'on' : 'off',
      }));
      console.log('Normalized sessions:', normalized);
      return normalized as Session[];
    },
    enabled: !!localStorage.getItem('token'),
  });

  const getCurrentWeekRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diffToMonday = (day + 6) % 7; // 0->6, 1->0 ... Monday as start
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { weekStart, weekEnd };
  };

  const { weekStart, weekEnd } = getCurrentWeekRange();
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Filter sessions based on category
  const getSessionsByCategory = (category: string) => {
    switch (category) {
      case 'This Week':
        return sessions.filter(session => {
          const start = new Date(session.startDate);
          const end = new Date(session.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);
          // Overlap with week range
          return start.getTime() <= weekEnd.getTime() && end.getTime() >= weekStart.getTime();
        });
      case 'Today':
        return sessions.filter(session => {
          const start = new Date(session.startDate);
          const end = new Date(session.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);
          return start.getTime() <= todayDate.getTime() && end.getTime() >= todayDate.getTime();
        });
      case 'Meetings':
        return sessions.filter(session => session.title.toLowerCase().includes('meeting')); 
      case 'Pending':
        return sessions.filter(session => new Date(session.endDate) > new Date());
      default:
        return [];
    }
  };

  const handleCategoryClick = (category: string) => {
    console.log('Clicked category:', category, 'Selected:', selectedCategory); 
    setSelectedCategory(category === selectedCategory ? null : category); 
  };

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
      {!isEmployee && (
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton color="primary" onClick={() => setOpenDialog(true)} title="Create New Event">
            +
          </IconButton>
          <Stack direction="row" spacing={1} alignItems="center">
            <Switch
              checked={openActivateDialog}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  // default selection
                  const firstId = sessions[0]?.id ? Number(sessions[0].id) : '';
                  setActivateSessionId(firstId);
                  setActivateEndDate('');
                  setOpenActivateDialog(true);
                } else {
                  setOpenActivateDialog(false);
                }
              }}
              inputProps={{ 'aria-label': 'Activate evaluation' }}
            />
            <Typography variant="body2">Activate</Typography>
          </Stack>
        </Stack>
      )}
    </Box>
  }
/>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Button
              variant={selectedCategory === 'This Week' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => handleCategoryClick('This Week')}
              sx={{ width: '23%', p: 1 }}
            >
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="subtitle1">This Week</Typography>
                <Typography variant="h6">{stats?.thisWeek || 0}</Typography>
              </Box>
            </Button>
            <Button
              variant={selectedCategory === 'Today' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => handleCategoryClick('Today')}
              sx={{ width: '23%', p: 1 }}
            >
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="subtitle1">Today</Typography>
                <Typography variant="h6">{stats?.today || 0}</Typography>
              </Box>
            </Button>
            <Button
              variant={selectedCategory === 'Meetings' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => handleCategoryClick('Meetings')}
              sx={{ width: '23%', p: 1 }}
            >
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="subtitle1">Meetings</Typography>
                <Typography variant="h6">{stats?.meetings || 0}</Typography>
              </Box>
            </Button>
            <Button
              variant={selectedCategory === 'Pending' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => handleCategoryClick('Pending')}
              sx={{ width: '23%', p: 1 }}
            >
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="subtitle1">Pending</Typography>
                <Typography variant="h6">{stats?.pending || 0}</Typography>
              </Box>
            </Button>
          </Box>
          {selectedCategory && (
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6">{selectedCategory} Schedules</Typography>
              {getSessionsByCategory(selectedCategory).length > 0 ? (
                <ul>
                  {getSessionsByCategory(selectedCategory).map((session) => (
                    <li key={session.id}>
                      {session.title} ({session.startDate} to {session.endDate})
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography>No schedules for {selectedCategory.toLowerCase()}.</Typography>
              )}
            </Card>
          )}
          <TabContext value={tabValue}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="schedule tabs">
              <Tab label="Week View" value="1" />
              <Tab label="Upcoming" value="2" />
              <Tab label="Calendar" value="3" />
            </Tabs>
            <TabPanel value="1">
              {getSessionsByCategory('This Week').length > 0 ? (
                <ul>
                  {getSessionsByCategory('This Week').map((session) => (
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
              {getSessionsByCategory('Today').length > 0 ? (
                <ul>
                  {getSessionsByCategory('Today').map((session) => (
                    <li key={session.id}>
                      {session.title} (Ends: {session.endDate})
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography>No upcoming schedules for today.</Typography>
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
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g., HR, Finance, Engineering"
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

      {/* Activate/Deactivate dialog */}
      <Dialog open={openActivateDialog} onClose={() => setOpenActivateDialog(false)}>
        <DialogTitle>Activate Evaluation</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="session-select-label">Evaluation Session</InputLabel>
            <Select
              labelId="session-select-label"
              label="Evaluation Session"
              value={activateSessionId === '' ? '' : String(activateSessionId)}
              onChange={(e) => setActivateSessionId(Number(e.target.value))}
            >
              {sessions.map((s) => (
                <MenuItem key={s.id} value={String(s.id)}>{s.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            margin="normal"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            value={new Date().toISOString().split('T')[0]}
            disabled
            helperText="Start date will be set to today"
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={activateEndDate}
            onChange={(e) => setActivateEndDate(e.target.value)}
            required
            margin="normal"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().split('T')[0] }}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActivateDialog(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              try {
                setError('');
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No token');
                if (!activateSessionId || !activateEndDate) {
                  setError('Please select session and end date');
                  return;
                }
                const today = new Date().toISOString().split('T')[0];
                await api.put(
                  `/api/evaluation-sessions/${activateSessionId}/status`,
                  { status: 'on', startDate: today, endDate: activateEndDate },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setOpenActivateDialog(false);
                queryClient.invalidateQueries({ queryKey: ['sessions'] });
                queryClient.invalidateQueries({ queryKey: ['evaluationStats'] });
                alert('Evaluation activated');
              } catch (err) {
                const ax = err as any;
                setError(ax?.response?.data?.error || ax?.message || 'Failed to activate');
              }
            }}
            variant="contained"
            color="primary"
          >
            Activate
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ScheduleMenu;