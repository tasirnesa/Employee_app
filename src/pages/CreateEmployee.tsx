import React, { useState } from 'react';
import { Stack, TextField, Button, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { createEmployee } from '../api/employeeApi';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { User } from '../types/interfaces';
import { useQuery } from '@tanstack/react-query';

const CreateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', department: '', position: '', hireDate: '', gender: '', age: '', birthDate: '', profileImageUrl: '', username: '', password: '', userId: '' });
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => createEmployee({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      department: form.department || undefined,
      position: form.position || undefined,
      hireDate: form.hireDate || undefined,
      gender: form.gender || undefined,
      age: form.age ? Number(form.age) : undefined,
      birthDate: form.birthDate || undefined,
      profileImageUrl: form.profileImageUrl || undefined,
      username: form.username || undefined,
      password: form.password || undefined,
      userId: form.userId ? Number(form.userId) : undefined,
    } as any),
    onSuccess: () => navigate('/employees/view'),
    onError: () => setError('Failed to create employee'),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      <Stack direction="row" spacing={3}>
        <TextField name="gender" label="Gender" value={form.gender} onChange={handleChange} fullWidth />
        <TextField name="age" label="Age" type="number" value={form.age} onChange={handleChange} fullWidth />
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
        <TextField name="birthDate" label="Birth Date" type="date" value={form.birthDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
        <TextField name="profileImageUrl" label="Profile Image URL (optional)" value={form.profileImageUrl} onChange={handleChange} fullWidth />
      </Stack>
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


