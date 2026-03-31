import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Typography, Card, CardContent, List, ListItem } from '@mui/material';
import type { EvaluationCriteria } from '../types/interfaces';

const CriteriaView: React.FC = () => {
  const token = localStorage.getItem('token');

  const { data: criteria, isLoading, error } = useQuery({
    queryKey: ['criteria'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/criteria', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as EvaluationCriteria[];
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

  return (
    <>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Evaluation Criteria
      </Typography>
      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
        {criteria?.map((criterion) => (
          <ListItem key={criterion.criteriaID} divider sx={{ display: 'block', py: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>{criterion.title}</Typography>
            <Typography variant="body2" color="text.secondary">{criterion.description}</Typography>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default CriteriaView;