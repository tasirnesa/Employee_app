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
    <Container>
      <Typography variant="h4" gutterBottom>
        Scheduled Sessions
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">Your Scheduled Sessions</Typography>
          <Button variant="contained" color="primary" disabled>
            New Session
          </Button>
          <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Session ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions?.map((session: ScheduledSession) => (
                  <TableRow key={session.sessionID}>
                    <TableCell>{session.sessionID}</TableCell>
                    <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                    <TableCell>{session.time}</TableCell>
                    <TableCell>{session.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ScheduledSessions;