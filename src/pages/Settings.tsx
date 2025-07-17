import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import type { User } from '../types/interfaces.ts';

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ fullName: '', userName: '', password: '' });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Token for /api/users/me in Settings:', token);
      if (!token) {
        console.error('No token found in Settings');
        throw new Error('No authentication token');
      }
      const response = await axios.get('http://localhost:3000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched current user in Settings:', response.data);
      setForm({
        fullName: response.data.fullName,
        userName: response.data.userName,
        password: '',
      });
      return response.data as User;
    },
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: { fullName: string; userName: string; password?: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      console.log('Updating user with data:', updatedData);
      await axios.put(`http://localhost:3000/api/users/me`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      console.log('User update successful');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: any) => {
      console.error('Update user error:', error.response?.data || error.message);
    },
  });

  const handleSubmit = () => {
    if (!form.fullName || !form.userName) {
      console.error('FullName and userName are required');
      return;
    }
    updateMutation.mutate(form);
  };

  if (isLoading) {
    console.log('Settings page loading...');
    return <Typography>Loading...</Typography>;
  }
  if (error) {
    console.error('Settings page error:', (error as Error).message);
    return <Typography color="error">Error: {(error as Error).message}</Typography>;
  }

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      <Box sx={{ maxWidth: 400 }}>
        <TextField
          label="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Username"
          value={form.userName}
          onChange={(e) => setForm({ ...form, userName: e.target.value })}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password (leave blank to keep unchanged)"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" onClick={handleSubmit} sx={{ mt: 2 }}>
          Save Changes
        </Button>
      </Box>
    </Container>
  );
};

export default Settings;