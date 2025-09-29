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
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Evaluation Criteria
      </Typography>
      <Card>
        <CardContent>
          <List>
            {criteria?.map((criterion) => (
              <ListItem key={criterion.criteriaID}>
                <Typography variant="h6">{criterion.title}</Typography>
                <Typography>{criterion.description}</Typography>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CriteriaView;