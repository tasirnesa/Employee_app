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
    <>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        My Evaluation Results
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Evaluation ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Criteria</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Score</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results?.map((result: EvaluationResult) => (
              <TableRow key={result.evaluationID} hover>
                <TableCell>{result.evaluationID}</TableCell>
                <TableCell>{result.criteriaID}</TableCell>
                <TableCell>{result.score}</TableCell>
                <TableCell>—</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default EvaluationResults;