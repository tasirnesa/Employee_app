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
    },
    onError: (error: any) => {
      console.error('Update user error:', error.response?.data || error.message);
    },
  });

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
    </Container>
  );
};

export default Settings;