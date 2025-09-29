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
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Goals
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">Set a New Goal</Typography>
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
          <Typography variant="h6">Current Goals</Typography>
          <ul>
            {goalsList.map((g, index) => (
              <li key={index}>{g}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Goals;