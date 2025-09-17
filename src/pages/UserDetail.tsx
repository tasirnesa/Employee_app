import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Typography, Button, Box } from '@mui/material';
import type { User } from '../types/interfaces.ts';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.get(`http://localhost:3000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as User;
    },
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        User Details
      </Typography>
      {user && (
        <Box>
          <Typography><strong>ID:</strong> {user.id}</Typography>
          <Typography><strong>Full Name:</strong> {user.fullName}</Typography>
          <Typography><strong>Username:</strong> {user.userName}</Typography>
          <Typography><strong>Gender:</strong> {user.gender}</Typography>
          <Typography><strong>Age:</strong> {user.age}</Typography>
          <Typography><strong>Role:</strong> {user.role}</Typography>
          <Typography><strong>Status:</strong> {user.status ? 'Active' : 'Inactive'}</Typography>
          <Typography><strong>Locked:</strong> {user.locked ? 'Yes' : 'No'}</Typography>
          <Typography><strong>First Login:</strong> {user.isFirstLogin ? 'Yes' : 'No'}</Typography>
          <Typography><strong>Active:</strong> {user.activeStatus ? 'Yes' : 'No'}</Typography>
          <Typography><strong>Created Date:</strong> {new Date(user.createdDate).toLocaleDateString()}</Typography>
          <Typography><strong>Created By:</strong> {user.createdBy}</Typography>
<<<<<<< HEAD
          <Button variant="contained" onClick={() => navigate('/users')} sx={{ mt: 2 }}>
=======
          <Button variant="contained" onClick={() => navigate('/users/view')} sx={{ mt: 2 }}>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
            Back to Users
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default UserDetail;