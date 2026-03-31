import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Card, CardContent, Box } from '@mui/material';

const Goals: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [goalsList, setGoalsList] = useState<string[]>([]);

  const handleAddGoal = () => {
    if (goal.trim()) {
      setGoalsList([...goalsList, goal]);
      setGoal('');
    }
  };

  return (
    <>
      <Typography variant="h6" fontWeight={700} gutterBottom>Set a New Goal</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Goal"
          variant="outlined"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleAddGoal}>
          Add
        </Button>
      </Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>Current Goals</Typography>
      <Box component="ul" sx={{ pl: 2 }}>
        {goalsList.map((g, index) => (
          <li key={index}>{g}</li>
        ))}
      </Box>
    </>
  );
};

export default Goals;