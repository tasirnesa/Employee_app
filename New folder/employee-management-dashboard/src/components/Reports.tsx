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
    <>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        My Reports
      </Typography>
      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
        {reports?.map((report) => (
          <ListItem key={report.evaluationID} divider>
            <ListItemText
              primary={<Typography variant="subtitle2" fontWeight={700}>Evaluation #{report.evaluationID}</Typography>}
              secondary={`Score: ${report.score}`}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default Reports;