import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { EvaluationResult } from '../types/interfaces';

const EvaluationResults: React.FC = () => {
  const token = localStorage.getItem('token');

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['evaluationResults'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/evaluation-results', {
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

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Evaluation Results
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Evaluation ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Criteria</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Score</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results?.map((result: EvaluationResult) => (
              <TableRow key={result.evaluationID}>
                <TableCell>{result.evaluationID}</TableCell>
                <TableCell>{result.criteriaTitle}</TableCell>
                <TableCell>{result.score}</TableCell>
                <TableCell>{new Date(result.evaluationDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default EvaluationResults;