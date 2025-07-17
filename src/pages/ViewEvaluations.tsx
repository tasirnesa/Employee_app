import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import type { Evaluation } from '../types/interfaces';

const ViewEvaluations: React.FC = () => {
  console.log('ViewEvaluations rendering');

  const { data: evaluations, isLoading, error } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      if (!token) throw new Error('No authentication token');
      try {
        const response = await axios.get('http://localhost:3000/api/evaluations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched evaluations:', response.data);
        return response.data as Evaluation[];
      } catch (err: any) {
        console.error('Fetch evaluations error:', err.response?.data || err.message);
        throw err;
      }
    },
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        View Evaluations
      </Typography>
      {evaluations && evaluations.length > 0 ? (
        <TableContainer component={Paper} sx={{ maxHeight: 400, maxWidth: '100%', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Evaluation ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Evaluator</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Evaluatee</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Session ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((evaluation) => (
                <TableRow key={evaluation.evaluationID}>
                  <TableCell>{evaluation.evaluationID}</TableCell>
                  <TableCell>{evaluation.evaluator?.fullName || 'N/A'}</TableCell>
                  <TableCell>{evaluation.evaluatee?.fullName || 'N/A'}</TableCell>
                  <TableCell>{evaluation.evaluationType}</TableCell>
                  <TableCell>{evaluation.sessionID}</TableCell>
                  <TableCell>{new Date(evaluation.evaluationDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No evaluations available.</Typography>
      )}
    </Container>
  );
};

export default ViewEvaluations;