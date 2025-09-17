<<<<<<< HEAD
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
=======
import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import type { User } from '../types/interfaces';

const Settings: React.FC = () => {
  console.log('Settings rendering');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched current user:', response.data);
      return response.data as User;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.put('http://localhost:3000/api/users/me', userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      navigate('/dashboard');
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    },
    onError: (error: any) => {
      console.error('Update user error:', error.response?.data || error.message);
    },
  });

<<<<<<< HEAD
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
=======
  const validationSchema = Yup.object({
    fullName: Yup.string().min(2, 'Full name must be at least 2 characters'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').nullable(),
    confirmPassword: Yup.string()
      .nullable()
      .oneOf([Yup.ref('password'), null], 'Passwords must match'),
  });

  if (isLoading) return <Typography>Loading user data...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  return (
    <Container maxWidth="sm" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Formik
        initialValues={{
          fullName: currentUser?.fullName || '',
          password: '',
          confirmPassword: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          const updateData: Partial<User> = {};
          if (values.fullName) updateData.fullName = values.fullName;
          if (values.password) updateData.password = values.password;
          updateUserMutation.mutate(updateData);
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Field
                as={TextField}
                name="fullName"
                label="Full Name"
                fullWidth
                error={touched.fullName && !!errors.fullName}
                helperText={touched.fullName && errors.fullName}
                sx={{ bgcolor: 'background.paper' }}
              />
              <Field
                as={TextField}
                name="password"
                label="New Password"
                type="password"
                fullWidth
                error={touched.password && !!errors.password}
                helperText={touched.password && errors.password}
                sx={{ bgcolor: 'background.paper' }}
              />
              <Field
                as={TextField}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                fullWidth
                error={touched.confirmPassword && !!errors.confirmPassword}
                helperText={touched.confirmPassword && errors.confirmPassword}
                sx={{ bgcolor: 'background.paper' }}
              />
              {updateUserMutation.isError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  Error updating profile: {updateUserMutation.error?.message || 'Unknown error'}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  fullWidth
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    </Container>
  );
};

export default Settings;