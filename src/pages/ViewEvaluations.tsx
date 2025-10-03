import React, { useState } from 'react';
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
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
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
        console.log('Fetched evaluations:', JSON.stringify(response.data, null, 2));
        return response.data as Evaluation[];
      } catch (err: any) {
        console.error('Fetch evaluations error:', err.response?.data || err.message);
        throw err;
      }
    },
  });

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState<any | null>(null);
  const openDetails = async (evaluationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const res = await axios.get(`http://localhost:3000/api/evaluations/${evaluationId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetails(res.data);
      setDetailsOpen(true);
    } catch (e) {
      console.error('Fetch evaluation details error:', e);
    }
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  return (
    <>
    <Container maxWidth="lg" sx={{ mt: 4, py: 4 }}>
      <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
          View Evaluations
        </Typography>
        {evaluations && evaluations.length > 0 ? (
          <TableContainer component={Paper} sx={{ maxHeight: 500, borderRadius: 2, overflowX: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    Evaluation ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    Evaluator
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    Evaluatee
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    Session ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evaluations.map((evaluation, index) => (
                  <TableRow
                    key={evaluation.evaluationID}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                      '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' },
                    }}
                  >
                    <TableCell>{evaluation.evaluationID}</TableCell>
                    <TableCell>{evaluation.evaluator?.fullName || evaluation.evaluator?.FullName || evaluation.evaluatorID}</TableCell>
                    <TableCell>{evaluation.evaluatee?.fullName || evaluation.evaluatee?.FullName || evaluation.evaluateeID}</TableCell>
                    <TableCell>{evaluation.evaluationType}</TableCell>
                    <TableCell>{evaluation.sessionID}</TableCell>
                    <TableCell>
                      {new Date(evaluation.evaluationDate).toLocaleDateString()}
                      <Button size="small" sx={{ ml: 1 }} onClick={() => window.location.href = `/evaluations/${evaluation.evaluationID}`}>Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            No evaluations available.
          </Typography>
        )}
      </Card>
    </Container>

    {/* Details dialog removed; navigation to dedicated page instead */}
    </>
  );
};

export default ViewEvaluations;