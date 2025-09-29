import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { EvaluationResult } from '../types/interfaces';

const Performance: React.FC = () => {
  const token = localStorage.getItem('token');

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['evaluationResults'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/results/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as EvaluationResult[];
    },
  });

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return (
      <Typography color="error">
        Error: {(error as Error)?.message}
      </Typography>
    );
  }

  const overallAverageScore = results && results.length > 0
    ? results.reduce((sum: number, r: EvaluationResult) => sum + r.score, 0) / results.length
    : 0;

  return (
    <Box sx={{ mt: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6">Performance Metrics</Typography>
          <Typography variant="body1">Overall Average Score: {overallAverageScore.toFixed(2)}</Typography>
          {/* Additional performance metrics can be displayed here */}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Performance;