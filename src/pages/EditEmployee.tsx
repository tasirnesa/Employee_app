import React, { useEffect, useState } from 'react';
import { Stack, TextField, Button, Typography, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getEmployee, updateEmployee, activateEmployee, deactivateEmployee } from '../api/employeeApi';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/axios';
import type { User } from '../types/interfaces';

const EditEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const employeeId = Number(id);
  const { data, isLoading } = useQuery({ queryKey: ['employee', employeeId], queryFn: () => getEmployee(employeeId), enabled: Number.isFinite(employeeId) });
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', department: '', position: '', hireDate: '', userId: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        department: data.department || '',
        position: data.position || '',
        hireDate: data.hireDate ? data.hireDate.substring(0, 10) : '',
        userId: data.userId ? String(data.userId) : '',
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateEmployee(employeeId, {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || null,
      department: form.department || null,
      position: form.position || null,
      hireDate: form.hireDate || null,
      userId: form.userId ? Number(form.userId) : null,
    } as any),
    onSuccess: () => navigate('/employees/view'),
    onError: () => setError('Failed to update employee'),
  });

  const activate = useMutation({ mutationFn: () => activateEmployee(employeeId), onSuccess: () => window.location.reload() });
  const deactivate = useMutation({ mutationFn: () => deactivateEmployee(employeeId), onSuccess: () => window.location.reload() });

  const { data: users } = useQuery({
    queryKey: ['users-for-linking'],
    queryFn: async () => {
      const res = await api.get('/api/users');
      return res.data as User[];
    },
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!data) return <Typography color="error">Employee not found</Typography>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Edit Employee</Typography>
        <Chip label={data.isActive ? 'Active' : 'Inactive'} color={data.isActive ? 'success' : 'default'} />
      </Stack>
      {error && <Typography color="error">{error}</Typography>}
      <Stack direction="row" spacing={2}>
        <TextField name="firstName" label="First Name" value={form.firstName} onChange={handleChange} fullWidth required />
        <TextField name="lastName" label="Last Name" value={form.lastName} onChange={handleChange} fullWidth required />
      </Stack>
      <TextField name="email" label="Email" type="email" value={form.email} onChange={handleChange} fullWidth required />
      <Stack direction="row" spacing={2}>
        <TextField name="phone" label="Phone" value={form.phone} onChange={handleChange} fullWidth />
        <TextField name="department" label="Department" value={form.department} onChange={handleChange} fullWidth />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField name="position" label="Position" value={form.position} onChange={handleChange} fullWidth />
        <TextField name="hireDate" label="Hire Date" type="date" value={form.hireDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
      </Stack>
      <FormControl fullWidth>
        <InputLabel id="user-link-label">Linked User (for evaluations)</InputLabel>
        <Select
          labelId="user-link-label"
          label="Linked User (for evaluations)"
          name="userId"
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
        {data.isActive ? (
          <Button variant="outlined" color="warning" onClick={() => deactivate.mutate()}>Deactivate</Button>
        ) : (
          <Button variant="outlined" color="success" onClick={() => activate.mutate()}>Activate</Button>
        )}
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
        <Button variant="contained" onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
      </Stack>
    </Stack>
  );
};

export default EditEmployee;


