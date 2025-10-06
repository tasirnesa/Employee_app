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
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Status</TableCell>
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
                    <Chip 
                      label={criterion.isAuthorized ? 'Authorized' : 'Pending'} 
                      size="small" 
                      color={criterion.isAuthorized ? 'success' : 'warning'} 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const response = await api.get(`/api/criteria/${criterion.criteriaID}`, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            const detailData = response.data;
                            alert(`Criteria Details:\n\nID: ${detailData.criteriaID}\nTitle: ${detailData.title}\nDescription: ${detailData.description || 'N/A'}\nCreated: ${new Date(detailData.createdDate).toLocaleString()}\nCreated By: ${detailData.creatorName || 'Unknown'}\nAuthorized: ${detailData.isAuthorized ? 'Yes' : 'No'}\nAuthorized By: ${detailData.authorizedBy ? 'User #' + detailData.authorizedBy : 'N/A'}\nAuthorized Date: ${detailData.authorizedDate ? new Date(detailData.authorizedDate).toLocaleString() : 'N/A'}`);
                          } catch (error: any) {
                            console.error('Error fetching criteria details:', error);
                            alert('Error fetching criteria details: ' + (error.response?.data?.error || error.message));
                          }
                        }}
                      >
                        Detail
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          try {
                            const title = prompt('New title', criterion.title);
                            if (title === null) return; // User cancelled
                            const description = prompt('New description', criterion.description || '');
                            if (description === null) return; // User cancelled
                            
                            const token = localStorage.getItem('token');
                            await api.put(`/api/criteria/${criterion.criteriaID}`, { 
                              title: title.trim(), 
                              description: description.trim() || null 
                            }, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            alert('Criteria updated successfully!');
                            window.location.reload();
                          } catch (error: any) {
                            console.error('Error updating criteria:', error);
                            alert('Error updating criteria: ' + (error.response?.data?.error || error.message));
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={async () => {
                          try {
                            if (!confirm('Are you sure you want to delete this criteria? This action cannot be undone.')) return;
                            const token = localStorage.getItem('token');
                            const response = await api.delete(`/api/criteria/${criterion.criteriaID}`, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            alert('Criteria deleted successfully!');
                            window.location.reload();
                          } catch (error: any) {
                            console.error('Error deleting criteria:', error);
                            const errorMsg = error.response?.data?.error || error.message;
                            alert('Error deleting criteria: ' + errorMsg);
                          }
                        }}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color={criterion.isAuthorized ? "secondary" : "success"}
                        onClick={async () => {
                          try {
                            if (criterion.isAuthorized) {
                              alert('This criteria is already authorized.');
                              return;
                            }
                            
                            if (!confirm('Are you sure you want to authorize this criteria?')) return;
                            const token = localStorage.getItem('token');
                            const response = await api.post(`/api/criteria/${criterion.criteriaID}/authorize`, {}, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            alert('Criteria authorized successfully!');
                            window.location.reload();
                          } catch (error: any) {
                            console.error('Error authorizing criteria:', error);
                            const errorMsg = error.response?.data?.error || error.message;
                            alert('Error authorizing criteria: ' + errorMsg);
                          }
                        }}
                      >
                        {criterion.isAuthorized ? 'Authorized' : 'Authorize'}
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