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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { User, Department, Position } from '../types/interfaces';

const CreateUser: React.FC = () => {
  console.log('CreateUser rendering');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Departments
  const { data: departments = [], isLoading: isLoadingDepartments, error: departmentsError } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        throw new Error('No authentication token');
      }
      console.log('Fetching departments with token:', token.substring(0, 10) + '...');
      const response = await axios.get('http://localhost:3000/api/departments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Departments response data:', response.data);
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid departments data format');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch Positions
  const { data: positions = [], isLoading: isLoadingPositions, error: positionsError } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        throw new Error('No authentication token');
      }
      console.log('Fetching positions with token:', token.substring(0, 10) + '...');
      const response = await axios.get('http://localhost:3000/api/positions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Positions response data:', response.data);
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid positions data format');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.post('http://localhost:3000/api/users', {
        ...userData,
        age: userData.age ? parseInt(userData.age as unknown as string) : undefined,
        createdBy: 1, // Assume current user ID is 1; replace with actual logic
        departmentId: userData.departmentId ? parseInt(userData.departmentId as unknown as string) : undefined,
        positionId: userData.positionId ? parseInt(userData.positionId as unknown as string) : undefined,
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
    role: Yup.string().required('Role is required').oneOf(['Admin', 'SuperAdmin', 'Maker', 'Checker'], 'Please select a valid role'),
    gender: Yup.string().required('Gender is required').oneOf(['Male', 'Female'], 'Please select a valid gender'),
    age: Yup.number().nullable().min(18, 'Age must be at least 18'),
    departmentId: Yup.number().nullable().notRequired(), // Optional field
    positionId: Yup.number().nullable().notRequired(),  // Optional field
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
          gender: '', // Default to empty string
          age: '', // String to match TextField input
          role: '',  // Default to empty string
          departmentId: '', // String to match Select input
          positionId: '',   // String to match Select input
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          // Convert string values to numbers where expected by User type
          const processedValues: Partial<User> = {
            ...values,
            age: values.age ? parseInt(values.age, 10) : undefined,
            departmentId: values.departmentId ? parseInt(values.departmentId, 10) : undefined,
            positionId: values.positionId ? parseInt(values.positionId, 10) : undefined,
          };
          createUserMutation.mutate(processedValues);
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting, setFieldValue, values }) => (
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
                as={FormControl}
                fullWidth
                error={touched.gender && !!errors.gender}
              >
                <InputLabel id="gender-label">Gender</InputLabel>
                <Select
                  name="gender"
                  labelId="gender-label"
                  label="Gender"
                  value={values.gender || ''}
                  onChange={(e) => setFieldValue('gender', e.target.value)}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
                {touched.gender && errors.gender && (
                  <Typography color="error" variant="caption">{errors.gender}</Typography>
                )}
              </Field>
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
                as={FormControl}
                fullWidth
                error={touched.role && !!errors.role}
              >
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  name="role"
                  labelId="role-label"
                  label="Role"
                  value={values.role || ''}
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
              <Field
                as={FormControl}
                fullWidth
                error={touched.departmentId && !!errors.departmentId}
              >
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  name="departmentId"
                  labelId="department-label"
                  label="Department"
                  value={values.departmentId || ''}
                  onChange={(e) => setFieldValue('departmentId', e.target.value)}
                  disabled={isLoadingDepartments}
                >
                  {departments.length === 0 && !isLoadingDepartments && !departmentsError && (
                    <MenuItem disabled value="">No departments available</MenuItem>
                  )}
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id.toString()}>{dept.name}</MenuItem> // Convert to string for Select
                  ))}
                </Select>
                {departmentsError && (
                  <Typography color="error" variant="caption">Error loading departments: {departmentsError.message}</Typography>
                )}
                {touched.departmentId && errors.departmentId && (
                  <Typography color="error" variant="caption">{errors.departmentId}</Typography>
                )}
              </Field>
              <Field
                as={FormControl}
                fullWidth
                error={touched.positionId && !!errors.positionId}
              >
                <InputLabel id="position-label">Position</InputLabel>
                <Select
                  name="positionId"
                  labelId="position-label"
                  label="Position"
                  value={values.positionId || ''}
                  onChange={(e) => setFieldValue('positionId', e.target.value)}
                  disabled={isLoadingPositions}
                >
                  {positions.length === 0 && !isLoadingPositions && !positionsError && (
                    <MenuItem disabled value="">No positions available</MenuItem>
                  )}
                  {positions.map((pos) => (
                    <MenuItem key={pos.id} value={pos.id.toString()}>{pos.name}</MenuItem> // Convert to string for Select
                  ))}
                </Select>
                {positionsError && (
                  <Typography color="error" variant="caption">Error loading positions: {positionsError.message}</Typography>
                )}
                {touched.positionId && errors.positionId && (
                  <Typography color="error" variant="caption">{errors.positionId}</Typography>
                )}
              </Field>
              {createUserMutation.isError && (
                <Alert severity="error">
                  Error creating user: {createUserMutation.error?.message || 'Unknown error'}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || isLoadingDepartments || isLoadingPositions}
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