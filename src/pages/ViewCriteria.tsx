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
import type { EvaluationCriteria } from '../types/interfaces';

const ViewCriteria: React.FC = () => {
  console.log('ViewCriteria rendering');

  const { data: criteria, isLoading, error } = useQuery({
    queryKey: ['criteria'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      if (!token) throw new Error('No authentication token');
      try {
        const response = await axios.get('http://localhost:3000/api/criteria', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched criteria:', response.data);
        return response.data as EvaluationCriteria[];
      } catch (err: any) {
        console.error('Fetch criteria error:', err.response?.data || err.message);
        throw err;
      }
    },
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  return (
<<<<<<< HEAD
    <Container sx={{ mt: 8 }}>
=======
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
      <Typography variant="h4" gutterBottom>
        View Criteria
      </Typography>
      {criteria && criteria.length > 0 ? (
<<<<<<< HEAD
        <TableContainer component={Paper} sx={{ maxHeight: 400, maxWidth: '100%', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Criteria ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Created By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {criteria.map((criterion) => (
                <TableRow key={criterion.criteriaID}>
=======
        <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Criteria ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {criteria.map((criterion, index) => (
                <TableRow
                  key={criterion.criteriaID}
                  sx={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff' }}
                >
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
                  <TableCell>{criterion.criteriaID}</TableCell>
                  <TableCell>{criterion.title}</TableCell>
                  <TableCell>{criterion.description || 'N/A'}</TableCell>
                  <TableCell>{new Date(criterion.createdDate).toLocaleDateString()}</TableCell>
                  <TableCell>{criterion.createdBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No criteria available.</Typography>
      )}
    </Container>
  );
};

export default ViewCriteria;