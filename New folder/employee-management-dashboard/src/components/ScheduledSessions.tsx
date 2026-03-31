import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
} from '@mui/material';
import type { ScheduledSession } from '../types/interfaces';

const ScheduledSessions: React.FC = () => {
  const token = localStorage.getItem('token');

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['scheduledSessions'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/scheduled-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as ScheduledSession[];
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Scheduled Sessions</Typography>
        <Button variant="outlined" size="small" disabled>
          New
        </Button>
      </Box>
      <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions?.map((session: ScheduledSession) => (
              <TableRow key={session.sessionID} hover>
                <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                <TableCell>{session.time}</TableCell>
                <TableCell>
                  <Box sx={{ 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1, 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    display: 'inline-block',
                    bgcolor: session.status === 'completed' ? 'success.light' : 'warning.light',
                    color: session.status === 'completed' ? 'success.dark' : 'warning.dark'
                  }}>
                    {session.status}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ScheduledSessions;