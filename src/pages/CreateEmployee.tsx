import React, { useCallback, useState } from 'react';
import { Stack, TextField, Button, Typography, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { User, Department, Position } from '../types/interfaces';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';

const CreateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '', // Changed to departmentId (string for Select value)
    positionId: '',   // Changed to positionId (string for Select value)
    hireDate: '',
    gender: '',
    birthDate: '',
    profileImageUrl: '',
    username: '',
    password: '',
    userId: '',
    scaleKey: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const response = await api.get('/api/departments', {
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
      const response = await api.get('/api/positions', {
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

  // Fetch payroll scales
  const { data: scales = [] } = useQuery({
    queryKey: ['payroll-scales'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/payroll/scale-config', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const cfg = res.data || {};
      return Object.keys(cfg).map((k) => ({ key: k, label: cfg[k]?.label || k }));
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('email', form.email);
      if (form.phone) fd.append('phone', form.phone);
      if (form.departmentId) fd.append('departmentId', form.departmentId); // Send as string, backend will parse
      if (form.positionId) fd.append('positionId', form.positionId); // Send as string, backend will parse
      if (form.hireDate) fd.append('hireDate', form.hireDate);
      if (form.gender) fd.append('gender', form.gender);
      if (form.birthDate) {
        fd.append('birthDate', form.birthDate);
        const birthYear = new Date(form.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const calculatedAge = currentYear - birthYear;
        fd.append('age', calculatedAge.toString());
      }
      if (form.profileImageUrl) fd.append('profileImageUrl', form.profileImageUrl);
      if (form.username) fd.append('username', form.username);
      if (form.password) fd.append('password', form.password);
      if (form.userId) fd.append('userId', form.userId);
      if (form.scaleKey) fd.append('scaleKey', form.scaleKey);
      if (file) fd.append('profileImage', file);
      const token = localStorage.getItem('token');
      const res = await api.post('/api/employees', fd, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      return res.data;
    },
    onSuccess: () => navigate('/employees/view'),
    onError: (err: unknown) => {
      const anyErr = err as any;
      const msg = anyErr?.response?.data?.error || anyErr?.message || 'Failed to create employee';
      setError(msg);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, accept: { 'image/*': [] } });

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const birthYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
  };

  const { data: users } = useQuery({
    queryKey: ['users-for-linking'],
    queryFn: async () => {
      const res = await api.get('/api/users');
      return res.data as User[];
    },
  });

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Create Employee</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Stack direction="row" spacing={2}>
        <TextField name="firstName" label="First Name" value={form.firstName} onChange={handleChange} fullWidth required />
        <TextField name="lastName" label="Last Name" value={form.lastName} onChange={handleChange} fullWidth required />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField name="username" label="Username" value={form.username} onChange={handleChange} fullWidth />
        <TextField name="password" type="password" label="Password" value={form.password} onChange={handleChange} fullWidth />
      </Stack>
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="gender-label">Gender</InputLabel>
          <Select
            labelId="gender-label"
            label="Gender"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value as string })}
          >
            <MenuItem value="">Select Gender</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
          </Select>
        </FormControl>
        <TextField name="email" label="Email" type="email" value={form.email} onChange={handleChange} fullWidth required />
      </Stack>
      
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="department-label">Department</InputLabel>
          <Select
            labelId="department-label"
            label="Department"
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value as string })}
            disabled={isLoadingDepartments}
          >
            {departments.length === 0 && !isLoadingDepartments && !departmentsError && (
              <MenuItem disabled value="">No departments available</MenuItem>
            )}
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id.toString()}>{dept.name}</MenuItem>
            ))}
          </Select>
          {departmentsError && <Typography color="error">Error loading departments: {departmentsError.message}</Typography>}
        </FormControl>
        <TextField name="phone" label="Phone" value={form.phone} onChange={handleChange} fullWidth />
      </Stack>
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="position-label">Position</InputLabel>
          <Select
            labelId="position-label"
            label="Position"
            value={form.positionId}
            onChange={(e) => setForm({ ...form, positionId: e.target.value as string })}
            disabled={isLoadingPositions}
          >
            {positions.length === 0 && !isLoadingPositions && !positionsError && (
              <MenuItem disabled value="">No positions available</MenuItem>
            )}
            {positions.map((pos) => (
              <MenuItem key={pos.id} value={pos.id.toString()}>{pos.name}</MenuItem>
            ))}
          </Select>
          {positionsError && <Typography color="error">Error loading positions: {positionsError.message}</Typography>}
        </FormControl>
        <TextField name="hireDate" label="Hire Date" type="date" value={form.hireDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="scale-label">Payroll Scale</InputLabel>
          <Select
            labelId="scale-label"
            label="Payroll Scale"
            value={form.scaleKey}
            onChange={(e) => setForm({ ...form, scaleKey: e.target.value as string })}
          >
            <MenuItem value="">No Scale</MenuItem>
            {scales.map((s: any) => (
              <MenuItem key={s.key} value={s.key}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField 
          name="birthDate" 
          label="Birth Date" 
          type="date" 
          value={form.birthDate} 
          onChange={handleChange} 
          fullWidth 
          InputLabelProps={{ shrink: true }}
          helperText={form.birthDate ? `Age: ${calculateAge(form.birthDate)} years` : ''}
        />
        <TextField name="profileImageUrl" label="Profile Image URL (optional)" value={form.profileImageUrl} onChange={handleChange} fullWidth />
      </Stack>
      <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', borderRadius: 1, p: 2, textAlign: 'center', cursor: 'pointer' }}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <Typography>Drop the image here ...</Typography>
        ) : (
          <Typography>{file ? `Selected: ${file.name}` : 'Drag & drop profile image here, or click to browse'}</Typography>
        )}
      </Box>
      <Typography variant="subtitle2">Optional App Login</Typography>
     
      <FormControl fullWidth>
        <InputLabel id="user-link-label">Linked User (optional)</InputLabel>
        <Select
          labelId="user-link-label"
          label="Linked User (optional)"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value as string })}
        >
          <MenuItem value="">None</MenuItem>
          {users?.map((u) => (
            <MenuItem key={u.id} value={String(u.id)}>
              {u.fullName} ({u.userName})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
        <Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>Create</Button>
      </Stack>
    </Stack>
  );
};

export default CreateEmployee;