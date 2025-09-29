import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Typography, Card, CardContent, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { EvaluationResult } from '../types/interfaces';

const Reports: React.FC = () => {
  const token = localStorage.getItem('token');

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as EvaluationResult[];
    },
  });

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Typography color="error">
        Error: {(error as Error).message}
      </Typography>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Reports
      </Typography>
      <Card>
        <CardContent>
          <List>
            {reports?.map((report) => (
              <ListItem key={report.evaluationID}>
                <ListItemText
                  primary={`Evaluation ID: ${report.evaluationID}`}
                  secondary={`Score: ${report.score}, Date: ${new Date(report.evaluationDate).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Reports;