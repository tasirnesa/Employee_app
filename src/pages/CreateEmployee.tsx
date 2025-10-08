import React, { useCallback, useState } from 'react';
import { Stack, TextField, Button, Typography, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { User } from '../types/interfaces';
import { useQuery } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';

const CreateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', department: '', position: '', hireDate: '', gender: '', birthDate: '', profileImageUrl: '', username: '', password: '', userId: '' });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('firstName', form.firstName);
      fd.append('lastName', form.lastName);
      fd.append('email', form.email);
      if (form.phone) fd.append('phone', form.phone);
      if (form.department) fd.append('department', form.department);
      if (form.position) fd.append('position', form.position);
      if (form.hireDate) fd.append('hireDate', form.hireDate);
      if (form.gender) fd.append('gender', form.gender);
      if (form.birthDate) {
        fd.append('birthDate', form.birthDate);
        // Calculate age from birth date
        const birthYear = new Date(form.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const calculatedAge = currentYear - birthYear;
        fd.append('age', calculatedAge.toString());
      }
      if (form.profileImageUrl) fd.append('profileImageUrl', form.profileImageUrl);
      if (form.username) fd.append('username', form.username);
      if (form.password) fd.append('password', form.password);
      if (form.userId) fd.append('userId', form.userId);
      if (file) fd.append('profileImage', file);
      const res = await api.post('/api/employees', fd);
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

  // Calculate age from birth date
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
        <TextField name="phone" label="Phone" value={form.phone} onChange={handleChange} fullWidth />
        <TextField name="department" label="Department" value={form.department} onChange={handleChange} fullWidth />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField name="position" label="Position" value={form.position} onChange={handleChange} fullWidth />
        <TextField name="hireDate" label="Hire Date" type="date" value={form.hireDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
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


