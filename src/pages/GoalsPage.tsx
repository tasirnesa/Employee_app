import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Divider, IconButton, List, ListItem, ListItemText, Chip, Button, TextField, Alert } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon, HourglassEmpty as HourglassEmptyIcon, Assignment as AssignmentIcon, BarChart as BarChartIcon, Add as AddIcon } from '@mui/icons-material';

const GoalsPage = () => {
  const [objectives, setObjectives] = useState([
    {
      id: 1,
      title: 'Complete Advanced Leadership Course',
      keyResults: ['Finish the 8-week leadership development program'],
      priority: 'High',
      status: 'In Progress',
      progress: 75,
      dueDate: '2024-02-15',
      category: 'Professional Development',
    },
    {
      id: 2,
      title: 'Improve Team Collaboration',
      keyResults: ['Implement weekly team syncs', 'Reduce meeting time by 20%'],
      priority: 'Medium',
      status: 'Active',
      progress: 40,
      dueDate: '2025-08-01',
      category: 'Team Management',
    },
  ]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newObjective, setNewObjective] = useState('');
  const [newKeyResults, setNewKeyResults] = useState<string[]>(['']);
  const [formError, setFormError] = useState('');

  // Summary stats
  const totalGoals = objectives.length;
  const activeGoals = objectives.filter(obj => obj.status === 'Active' || obj.status === 'In Progress').length;
  const completedGoals = objectives.filter(obj => obj.status === 'Completed').length;
  const avgProgress = objectives.length ? Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length) : 0;

  // Handle delete
  const handleDelete = (id: number) => {
    setObjectives(objectives.filter(obj => obj.id !== id));
    if (editIndex === id) setEditIndex(null);
  };

  // Handle edit (placeholder)
  const handleEdit = (id: number) => {
    setEditIndex(id);
    // Add edit form logic here later
  };

  // Handle update progress (placeholder)
  const handleUpdateProgress = (id: number) => {
    console.log(`Update progress for objective ${id}`);
  };

  // Handle adding a new key result input
  const addNewKeyResult = () => {
    setNewKeyResults([...newKeyResults, '']);
  };

  // Handle key result change
  const handleNewKeyResultChange = (index: number, value: string) => {
    const updatedKeyResults = [...newKeyResults];
    updatedKeyResults[index] = value;
    setNewKeyResults(updatedKeyResults);
  };

  // Handle form submission
  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjective || newKeyResults.some(kr => !kr.trim())) {
      setFormError('Objective and key results are required.');
      return;
    }
    const newObj = {
      id: Date.now(), // Temporary ID for uniqueness
      title: newObjective,
      keyResults: newKeyResults.filter(kr => kr.trim()),
      priority: 'Medium', // Default; add selection later
      status: 'Active',
      progress: 0,
      dueDate: '', // Add date picker later
      category: 'General', // Default; add selection later
    };
    setObjectives([...objectives, newObj]);
    setNewObjective('');
    setNewKeyResults(['']);
    setIsFormOpen(false);
    setFormError('');
  };

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        Dive
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon color="action" />
            <Typography variant="h6">Total Goals</Typography>
            <Typography variant="h6" color="primary">{totalGoals}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HourglassEmptyIcon color="warning" />
            <Typography variant="h6">Active</Typography>
            <Typography variant="h6" color="primary">{activeGoals}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Completed</Typography>
            <Typography variant="h6" color="primary">{completedGoals}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon color="info" />
            <Typography variant="h6">Avg Progress</Typography>
            <Typography variant="h6" color="primary">{avgProgress}%</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        {objectives.map((obj) => (
          <Card key={obj.id} sx={{ width: '48%', p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {obj.title}
              </Typography>
              <List>
                {obj.keyResults.map((kr, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={kr} />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 2 }}>
                <Chip label={`Priority: ${obj.priority}`} color="default" sx={{ mr: 1 }} />
                <Chip label={`Status: ${obj.status}`} color={obj.status === 'Completed' ? 'success' : 'warning'} sx={{ mr: 1 }} />
                <Chip label={`Progress: ${obj.progress}%`} color="info" sx={{ mr: 1 }} />
                <Chip label={`Due: ${obj.dueDate}`} color="default" sx={{ mr: 1 }} />
                <Chip label={`Category: ${obj.category}`} color="secondary" />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" color="primary" onClick={() => handleUpdateProgress(obj.id)} sx={{ mr: 1 }}>
                  Update Progress
                </Button>
                <Button variant="outlined" color="secondary" onClick={() => handleEdit(obj.id)} sx={{ mr: 1 }}>
                  Edit
                </Button>
                <IconButton color="error" onClick={() => handleDelete(obj.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => setIsFormOpen(true)}
        sx={{ mb: 2 }}
      >
        + New Goal
      </Button>
      {isFormOpen && (
        <Card sx={{ mb: 2, p: 2 }}>
          <CardContent>
            <form onSubmit={handleAddObjective}>
              <TextField
                fullWidth
                label="Objective"
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                required
                margin="normal"
                variant="outlined"
                placeholder="e.g., Improve team productivity"
              />
              {newKeyResults.map((kr, index) => (
                <TextField
                  key={index}
                  fullWidth
                  label={`Key Result ${index + 1}`}
                  value={kr}
                  onChange={(e) => handleNewKeyResultChange(index, e.target.value)}
                  required
                  margin="normal"
                  variant="outlined"
                  placeholder="e.g., Increase output by 20%"
                />
              ))}
              <Button
                variant="outlined"
                color="primary"
                onClick={addNewKeyResult}
                sx={{ mt: 1, mb: 2 }}
              >
                Add Key Result
              </Button>
              {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2, py: 1.5 }}
              >
                Add Objective
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setIsFormOpen(false)}
                sx={{ mt: 2, ml: 2 }}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GoalsPage;