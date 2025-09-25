import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Assignment as AssignmentIcon,
  BarChart as BarChartIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { Goal } from '../types/interfaces'; // Adjust path as needed

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newObjective, setNewObjective] = useState('');
  const [newKeyResults, setNewKeyResults] = useState<Array<{ title: string; progress?: number }>>([{ title: '', progress: 0 }]);
  const [newDueDate, setNewDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Progress dialog state
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editObjective, setEditObjective] = useState('');
  const [editKeyResults, setEditKeyResults] = useState<Array<{ title: string; progress?: number }>>([{ title: '', progress: 0 }]);
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editStatus, setEditStatus] = useState('Active');
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editCategory, setEditCategory] = useState('General');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await axios.get('http://localhost:3000/api/goals', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGoals(response.data);
      } catch (err) {
        setError('Failed to fetch goals. Please check your authentication or try again later.');
        console.error('Error fetching goals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const totalGoals = goals.length;
  const activeGoals = goals.filter(obj => obj.status === 'Active' || obj.status === 'In Progress').length;
  const completedGoals = goals.filter(obj => obj.status === 'Completed').length;
  const avgProgress = goals.length
    ? Math.round(goals.reduce((sum, obj) => sum + (obj.progress ?? 0), 0) / goals.length)
    : 0;

  const handleDelete = (gid: number) => {
    const goal = goals.find(g => g.gid === gid) || null;
    setDeleteGoal(goal);
    setDeleteDialogOpen(true);
    if (editIndex === gid) setEditIndex(null);
  };

  const handleEdit = (gid: number) => {
    const goal = goals.find(g => g.gid === gid);
    if (!goal) return;
    setEditGoal(goal);
    setEditObjective(goal.objective || '');
    const raw = Array.isArray(goal.keyResult) ? goal.keyResult : (goal.keyResult ? [goal.keyResult] : []);
    const keyResultsArr = raw.map((kr: any) => (typeof kr === 'string' ? { title: kr, progress: 0 } : { title: kr?.title || '', progress: kr?.progress ?? 0 }));
    setEditKeyResults(keyResultsArr.length ? keyResultsArr : [{ title: '', progress: 0 }]);
    setEditDueDate(goal.duedate ? new Date(goal.duedate).toISOString().slice(0, 10) : '');
    setEditPriority(goal.priority || 'Medium');
    setEditStatus(goal.status || 'Active');
    setEditProgress(goal.progress ?? 0);
    setEditCategory(goal.category || 'General');
    setEditDialogOpen(true);
  };

  const handleUpdateProgress = (gid: number) => {
    const goal = goals.find(g => g.gid === gid);
    if (!goal) return;
    setProgressGoal(goal);
    setProgressValue(goal.progress ?? 0);
    setProgressDialogOpen(true);
  };

  const addNewKeyResult = () => {
    setNewKeyResults([...newKeyResults, { title: '', progress: 0 }]);
  };

  const handleNewKeyResultChange = (index: number, field: 'title' | 'progress', value: string | number) => {
    const updatedKeyResults = [...newKeyResults];
    if (field === 'title') {
      updatedKeyResults[index].title = String(value);
    } else {
      const num = Math.max(0, Math.min(100, Number(value) || 0));
      updatedKeyResults[index].progress = num;
    }
    setNewKeyResults(updatedKeyResults);
  };

  const saveProgress = async () => {
    if (!progressGoal) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await axios.put(`http://localhost:3000/api/goals/${progressGoal.gid}`,
        { progress: progressValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGoals(prev => prev.map(g => g.gid === progressGoal.gid ? { ...g, progress: progressValue } : g));
      setProgressDialogOpen(false);
      setProgressGoal(null);
    } catch (err) {
      console.error('Failed to update progress', err);
      alert('Failed to update progress.');
    }
  };

  const saveEdit = async () => {
    if (!editGoal) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const payload = {
        objective: editObjective,
        keyResult: editKeyResults.filter(kr => kr.title.trim()),
        priority: editPriority,
        status: editStatus,
        duedate: editDueDate,
        category: editCategory,
      };
      const res = await axios.put(
        `http://localhost:3000/api/goals/${editGoal.gid}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data as Goal;
      setGoals(prev => prev.map(g => g.gid === editGoal.gid ? { ...g, ...updated } : g));
      setEditDialogOpen(false);
      setEditGoal(null);
    } catch (err) {
      console.error('Failed to update goal', err);
      alert('Failed to update goal.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteGoal) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      await axios.delete(`http://localhost:3000/api/goals/${deleteGoal.gid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGoals(prev => prev.filter(g => g.gid !== deleteGoal.gid));
      setDeleteDialogOpen(false);
      setDeleteGoal(null);
    } catch (err) {
      console.error('Failed to delete goal', err);
      alert('Failed to delete goal.');
    }
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjective || !newDueDate || newKeyResults.some(kr => !kr.title.trim())) {
      setFormError('Objective, due date, and at least one key result are required.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.post(
        'http://localhost:3000/api/goals',
        {
          objective: newObjective,
          keyResult: newKeyResults.filter(kr => kr.title.trim()),
          priority: 'Medium',
          status: 'Active',
          // progress computed server-side from KR percentages
          duedate: newDueDate,
          category: 'General',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGoals([...goals, response.data]);
      setNewObjective('');
      setNewKeyResults([{ title: '', progress: 0 }]);
      setNewDueDate('');
      setIsFormOpen(false);
      setFormError('');
    } catch (err) {
      setFormError('Failed to add goal. Please check your input or try again later.');
      console.error('Error adding goal:', err);
    }
  };

  if (loading) return <Typography>Loading goals...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', mt: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h3" gutterBottom align="center" color="primary" fontWeight="bold">
        Goals Dashboard
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 1 }}>
          <AssignmentIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Total Goals: <span style={{ color: '#1976d2' }}>{totalGoals}</span></Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 1 }}>
          <HourglassEmptyIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Active: <span style={{ color: '#ed6c02' }}>{activeGoals}</span></Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 1 }}>
          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
          <Typography variant="h6">Completed: <span style={{ color: '#2e7d32' }}>{completedGoals}</span></Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 1 }}>
          <BarChartIcon color="info" sx={{ mr: 1 }} />
          <Typography variant="h6">Avg Progress: <span style={{ color: '#0288d1' }}>{avgProgress}%</span></Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {goals.map((goal) => (
          <Box key={goal.gid} sx={{ flex: '1 1 320px', minWidth: 280 }}>
            <Card
              sx={{
                p: 2,
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': { transform: 'scale(1.02)', boxShadow: 6 },
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Typography variant="h5" gutterBottom fontWeight="bold" color="text.primary">
                  Objective: {goal.objective}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <List>
                  {Array.isArray(goal.keyResult) ? (
                    goal.keyResult.map((kr: any, index: number) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText
                          primary={
                            <Typography variant="body1">
                              {index === 0 ? 'KeyResult 1: ' : `Key Result ${index + 1}: `}
                              {typeof kr === 'string' ? kr : kr?.title || 'No key result'}
                              {typeof kr === 'object' && kr?.progress != null ? ` — ${kr.progress}%` : ''}
                            </Typography>
                          }
                          sx={{ pl: 1 }}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem disablePadding>
                      <ListItemText
                        primary={<Typography variant="body1">Key Result: {goal.keyResult || 'No key results'}</Typography>}
                        sx={{ pl: 1 }}
                      />
                    </ListItem>
                  )}
                </List>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`Priority: ${goal.priority || 'N/A'}`} color="default" variant="outlined" />
                  <Chip label={`Status: ${goal.status || 'N/A'}`} color={goal.status === 'Completed' ? 'success' : 'warning'} variant="outlined" />
                  <Chip label={`Progress: ${goal.progress || 0}%`} color="info" variant="outlined" />
                  <Chip label={`Due: ${goal.duedate ? new Date(goal.duedate).toLocaleDateString() : 'N/A'}`} color="default" variant="outlined" />
                  <Chip label={`Category: ${goal.category || 'N/A'}`} color="secondary" variant="outlined" />
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleUpdateProgress(goal.gid)}
                    startIcon={<BarChartIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Update Progress
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleEdit(goal.gid)}
                    startIcon={<EditIcon />}
                    sx={{ textTransform: 'none' }}
                  >
                    Edit
                  </Button>
                  <IconButton color="error" onClick={() => handleDelete(goal.gid)} sx={{ p: 1 }}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setIsFormOpen(true)}
          sx={{ px: 3, py: 1.5, borderRadius: 2 }}
        >
          New Goal
        </Button>
      </Box>
      {isFormOpen && (
        <Card sx={{ mt: 4, p: 3, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
              Add New Goal
            </Typography>
            <form onSubmit={handleAddObjective} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField
                fullWidth
                label="Objective"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                required
                variant="outlined"
                InputProps={{ sx: { borderRadius: 1 } }}
                sx={{ bgcolor: '#fafafa' }}
              />
              <TextField
                fullWidth
                label="Due Date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                required
                type="date"
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                InputProps={{ sx: { borderRadius: 1 } }}
                sx={{ bgcolor: '#fafafa' }}
              />
              {newKeyResults.map((kr, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label={index === 0 ? 'KeyResult 1' : `Key Result ${index + 1}`}
                    value={kr.title}
                    onChange={(e) => handleNewKeyResultChange(index, 'title', e.target.value)}
                    required
                    variant="outlined"
                    InputProps={{ sx: { borderRadius: 1 } }}
                    sx={{ bgcolor: '#fafafa' }}
                  />
                  <TextField
                    label="%"
                    type="number"
                    value={kr.progress ?? 0}
                    onChange={(e) => handleNewKeyResultChange(index, 'progress', e.target.value)}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{ width: 100, bgcolor: '#fafafa' }}
                  />
                </Box>
              ))}
              <Button
                variant="outlined"
                color="primary"
                onClick={addNewKeyResult}
                sx={{ mt: 1, borderRadius: 1, textTransform: 'none' }}
              >
                + Add Another Key Result
              </Button>
              {formError && <Alert severity="error" sx={{ borderRadius: 1 }}>{formError}</Alert>}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ py: 1.5, borderRadius: 1, textTransform: 'none' }}
                >
                  Add Objective
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setIsFormOpen(false)}
                  fullWidth
                  sx={{ py: 1.5, borderRadius: 1, textTransform: 'none' }}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Progress Dialog */}
      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)}>
        <DialogTitle>Update Progress</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Set the progress percentage for "{progressGoal?.objective}".
          </DialogContentText>
          <Box sx={{ mt: 2, px: 1 }}>
            <Slider
              value={progressValue}
              onChange={(_, v) => setProgressValue(v as number)}
              valueLabelDisplay="auto"
              min={0}
              max={100}
            />
            <TextField
              label="Progress (%)"
              type="number"
              value={progressValue}
              onChange={(e) => setProgressValue(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              fullWidth
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveProgress} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Objective" value={editObjective} onChange={(e) => setEditObjective(e.target.value)} fullWidth />
            {editKeyResults.map((kr, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  label={idx === 0 ? 'KeyResult 1' : `Key Result ${idx + 1}`}
                  value={kr.title}
                  onChange={(e) => {
                    const next = [...editKeyResults];
                    next[idx].title = e.target.value;
                    setEditKeyResults(next);
                  }}
                  fullWidth
                />
                <TextField
                  label="%"
                  type="number"
                  value={kr.progress ?? 0}
                  onChange={(e) => {
                    const next = [...editKeyResults];
                    const num = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    next[idx].progress = num;
                    setEditKeyResults(next);
                  }}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{ width: 100 }}
                />
              </Box>
            ))}
            <Button variant="outlined" onClick={() => setEditKeyResults([...editKeyResults, { title: '', progress: 0 }])}>+ Add Key Result</Button>
            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select labelId="priority-label" value={editPriority} label="Priority" onChange={(e) => setEditPriority(e.target.value)}>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select labelId="status-label" value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Due Date"
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField label="Category" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} fullWidth />
            <Box sx={{ px: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Progress: {editProgress}%</Typography>
              <Slider
                value={editProgress}
                onChange={(_, v) => setEditProgress(v as number)}
                valueLabelDisplay="auto"
                min={0}
                max={100}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the goal "{deleteGoal?.objective}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalsPage;