import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
<<<<<<< HEAD
=======
  FormControl,
  InputLabel,
  Select,
  MenuItem,
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
} from '@mui/material';
import type { User } from '../types/interfaces';

const CreateUser: React.FC = () => {
  console.log('CreateUser rendering');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.post('http://localhost:3000/api/users', {
        ...userData,
        age: userData.age ? parseInt(userData.age as unknown as string) : undefined,
        createdBy: 1, // Assume current user ID is 1; replace with actual logic
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users/view');
    },
    onError: (error: any) => {
      console.error('Create user error:', error.response?.data || error.message);
    },
  });

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full Name is required'),
    userName: Yup.string().required('Username is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
<<<<<<< HEAD
    role: Yup.string().required('Role is required'),
    gender: Yup.string().nullable(),
=======
    role: Yup.string().required('Role is required').oneOf(['Admin', 'SuperAdmin', 'Maker', 'Checker'], 'Please select a valid role'),
    gender: Yup.string().required('Gender is required').oneOf(['Male', 'Female'], 'Please select a valid gender'),
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    age: Yup.number().nullable().min(18, 'Age must be at least 18'),
  });

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Create User
      </Typography>
      <Formik
        initialValues={{
          fullName: '',
          userName: '',
          password: '',
<<<<<<< HEAD
          gender: '',
          age: '',
          role: '',
=======
          gender: '', // Default to empty string
          age: '',
          role: '',  // Default to empty string
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          createUserMutation.mutate({
            ...values,
            age: values.age ? parseInt(values.age as string) : undefined,
          });
          setSubmitting(false);
        }}
      >
<<<<<<< HEAD
        {({ errors, touched, isSubmitting }) => (
=======
        {({ errors, touched, isSubmitting, setFieldValue, values }) => (
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Field
                as={TextField}
                name="fullName"
                label="Full Name"
                fullWidth
                error={touched.fullName && !!errors.fullName}
                helperText={touched.fullName && errors.fullName}
              />
              <Field
                as={TextField}
                name="userName"
                label="Username"
                fullWidth
                error={touched.userName && !!errors.userName}
                helperText={touched.userName && errors.userName}
              />
              <Field
                as={TextField}
                name="password"
                label="Password"
                type="password"
                fullWidth
                error={touched.password && !!errors.password}
                helperText={touched.password && errors.password}
              />
              <Field
<<<<<<< HEAD
                as={TextField}
                name="gender"
                label="Gender"
                fullWidth
                error={touched.gender && !!errors.gender}
                helperText={touched.gender && errors.gender}
              />
=======
                as={FormControl}
                fullWidth
                error={touched.gender && !!errors.gender}
              >
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  name="gender"
                  labelId="gender-label"
                  label="Gender"
                  value={values.gender || ''} // Controlled value
                  onChange={(e) => setFieldValue('gender', e.target.value)}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
                {touched.gender && errors.gender && (
                  <Typography color="error" variant="caption">{errors.gender}</Typography>
                )}
              </Field>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
              <Field
                as={TextField}
                name="age"
                label="Age"
                type="number"
                fullWidth
                error={touched.age && !!errors.age}
                helperText={touched.age && errors.age}
              />
              <Field
<<<<<<< HEAD
                as={TextField}
                name="role"
                label="Role"
                fullWidth
                error={touched.role && !!errors.role}
                helperText={touched.role && errors.role}
              />
=======
                as={FormControl}
                fullWidth
                error={touched.role && !!errors.role}
              >
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  name="role"
                  labelId="role-label"
                  label="Role"
                  value={values.role || ''} // Controlled value
                  onChange={(e) => setFieldValue('role', e.target.value)}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="SuperAdmin">SuperAdmin</MenuItem>
                  <MenuItem value="Maker">Maker</MenuItem>
                  <MenuItem value="Checker">Checker</MenuItem>
                </Select>
                {touched.role && errors.role && (
                  <Typography color="error" variant="caption">{errors.role}</Typography>
                )}
              </Field>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
              {createUserMutation.isError && (
                <Alert severity="error">
                  Error creating user: {createUserMutation.error?.message || 'Unknown error'}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  Create
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/users/view')}
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

export default CreateUser;