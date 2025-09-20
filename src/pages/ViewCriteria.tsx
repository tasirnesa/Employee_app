import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
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
  Button,
  Box,
  Chip,
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
        const response = await api.get('/api/criteria', {
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
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom>
        View Criteria
      </Typography>
      {criteria && criteria.length > 0 ? (
        <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Criteria ID</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {criteria.map((criterion, index) => (
                <TableRow
                  key={criterion.criteriaID}
                  sx={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff', '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' } }}
                >
                  <TableCell>{criterion.criteriaID}</TableCell>
                  <TableCell>{criterion.title}</TableCell>
                  <TableCell>{criterion.description || 'N/A'}</TableCell>
                  <TableCell>{new Date(criterion.createdDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={(criterion as any).creatorName || criterion.creator?.fullName || criterion.creator?.FullName || `User #${criterion.createdBy}`} size="small" color="default" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" variant="contained" onClick={async () => alert(JSON.stringify(criterion, null, 2))}>Detail</Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          const title = prompt('New title', criterion.title) || criterion.title;
                          const description = prompt('New description', criterion.description || '') || criterion.description || '';
                          const token = localStorage.getItem('token');
                          await api.put(`/api/criteria/${criterion.criteriaID}`, { title, description }, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          location.reload();
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={async () => {
                          if (!confirm('Delete this criteria?')) return;
                          const token = localStorage.getItem('token');
                          await api.delete(`/api/criteria/${criterion.criteriaID}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          location.reload();
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={async () => {
                          const token = localStorage.getItem('token');
                          await api.post(`/api/criteria/${criterion.criteriaID}/authorize`, {}, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          alert('Authorized');
                        }}
                      >
                        Authorize
                      </Button>
                    </Box>
                  </TableCell>
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