import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
} from '@mui/material';
import type { Department, Position } from '../types/interfaces';
import api from '../lib/axios';
import { useUser } from '../context/UserContext';

const ROLES = ['Admin', 'SuperAdmin', 'Manager', 'Employee', 'Maker', 'Checker'];

const validationSchema = Yup.object({
  fullName: Yup.string().required('Full name is required'),
  userName: Yup.string().required('Username is required'),
  password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  role: Yup.string().required('Role is required').oneOf(ROLES, 'Select a valid role'),
  gender: Yup.string().oneOf(['Male', 'Female', ''], 'Select a valid gender'),
  age: Yup.number().nullable().min(18, 'Must be at least 18'),
  email: Yup.string().email('Invalid email').nullable(),
  departmentId: Yup.number().nullable(),
  positionId: Yup.number().nullable(),
});

const CreateUser: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useUser();

  const { data: departments = [], isLoading: loadingDepts } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/api/departments')).data,
    staleTime: 5 * 60 * 1000,
  });

  const { data: positions = [], isLoading: loadingPos } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: async () => (await api.get('/api/positions')).data,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        age: values.age ? parseInt(values.age) : null,
        departmentId: values.departmentId ? parseInt(values.departmentId) : null,
        positionId: values.positionId ? parseInt(values.positionId) : null,
        email: values.email || null,
        gender: values.gender || null,
        createdBy: currentUser?.id ?? 1,
      };
      const res = await api.post('/api/users', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users/view');
    },
  });

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #eef2ff' }}>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 3, color: '#1e293b' }}>
          Create User
        </Typography>

        <Formik
          initialValues={{
            fullName: '', userName: '', password: '', role: '',
            gender: '', age: '', email: '', departmentId: '', positionId: '',
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            createMutation.mutate(values);
            setSubmitting(false);
          }}
        >
          {({ errors, touched, values, setFieldValue, isSubmitting }) => (
            <Form>
              <Stack spacing={2.5}>
                <Field
                  as={TextField}
                  name="fullName"
                  label="Full Name"
                  fullWidth
                  error={touched.fullName && !!errors.fullName}
                  helperText={touched.fullName && errors.fullName}
                />

                <Stack direction="row" spacing={2}>
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
                </Stack>

                <Field
                  as={TextField}
                  name="email"
                  label="Email (optional)"
                  type="email"
                  fullWidth
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                />

                <Stack direction="row" spacing={2}>
                  <FormControl fullWidth error={touched.role && !!errors.role}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      label="Role"
                      value={values.role}
                      onChange={(e) => setFieldValue('role', e.target.value)}
                    >
                      {ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                    {touched.role && errors.role && (
                      <Typography variant="caption" color="error">{errors.role}</Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      name="gender"
                      label="Gender"
                      value={values.gender}
                      onChange={(e) => setFieldValue('gender', e.target.value)}
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Field
                    as={TextField}
                    name="age"
                    label="Age"
                    type="number"
                    fullWidth
                    error={touched.age && !!errors.age}
                    helperText={touched.age && errors.age}
                  />

                  <FormControl fullWidth disabled={loadingDepts}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="departmentId"
                      label="Department"
                      value={values.departmentId}
                      onChange={(e) => setFieldValue('departmentId', e.target.value)}
                    >
                      <MenuItem value="">None</MenuItem>
                      {departments.map((d) => (
                        <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth disabled={loadingPos}>
                    <InputLabel>Position</InputLabel>
                    <Select
                      name="positionId"
                      label="Position"
                      value={values.positionId}
                      onChange={(e) => setFieldValue('positionId', e.target.value)}
                    >
                      <MenuItem value="">None</MenuItem>
                      {positions.map((p) => (
                        <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                {createMutation.isError && (
                  <Alert severity="error">
                    {(createMutation.error as any)?.response?.data?.message
                      || (createMutation.error as any)?.message
                      || 'Failed to create user'}
                  </Alert>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={() => navigate('/users/view')}>Cancel</Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </Stack>
              </Stack>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
};

export default CreateUser;
