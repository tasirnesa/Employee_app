import React, { useEffect, useState } from 'react';
import {
  Stack,
  TextField,
  Button,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getEmployee, updateEmployee, activateEmployee, deactivateEmployee } from '../api/employeeApi';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/axios';
import type { User, Department, Position } from '../types/interfaces';

const EditEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const employeeId = Number(id);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    positionId: '',
    hireDate: '',
    gender: '',
    age: '',
    birthDate: '',
    profileImageUrl: '',
    username: '',
    password: '',
    userId: '',
  });

  const [error, setError] = useState<string | null>(null);

  // === FETCH EMPLOYEE ===
  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: Number.isFinite(employeeId),
  });

  // === FETCH DEPARTMENTS ===
  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/api/departments');
      return res.data as Department[];
    },
  });

  // === FETCH POSITIONS ===
  const { data: positions = [], isLoading: loadingPos } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const res = await api.get('/api/positions');
      return res.data as Position[];
    },
  });

  // === FETCH USERS (for linking) ===
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-linking'],
    queryFn: async () => {
      const res = await api.get('/api/users');
      return res.data as User[];
    },
  });

  // === UPDATE FORM WHEN EMPLOYEE LOADS ===
  useEffect(() => {
    if (employee) {
      setForm({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        departmentId: employee.department ? String(employee.department) : '',
        positionId: employee.position ? String(employee.position) : '',
        hireDate: employee.hireDate ? employee.hireDate.substring(0, 10) : '',
        gender: employee.gender || '',
        age: employee.age != null ? String(employee.age) : '',
        birthDate: employee.birthDate ? employee.birthDate.substring(0, 10) : '',
        profileImageUrl: employee.profileImageUrl || '',
        username: '',
        password: '',
        userId: employee.userId ? String(employee.userId) : '',
      });
    }
  }, [employee]);

  // === MUTATIONS ===
  const save = useMutation({
    mutationFn: () =>
      updateEmployee(employeeId, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        positionId: form.positionId ? Number(form.positionId) : null,
        hireDate: form.hireDate || null,
        gender: form.gender || undefined,
        age: form.age ? Number(form.age) : undefined,
        birthDate: form.birthDate || undefined,
        profileImageUrl: form.profileImageUrl || undefined,
        username: form.username || undefined,
        password: form.password || undefined,
        userId: form.userId ? Number(form.userId) : null,
      } as any),
    onSuccess: () => navigate('/employees/view'),
    onError: () => setError('Failed to update employee'),
  });

  const activate = useMutation({
    mutationFn: () => activateEmployee(employeeId),
    onSuccess: () => window.location.reload(),
  });

  const deactivate = useMutation({
    mutationFn: () => deactivateEmployee(employeeId),
    onSuccess: () => window.location.reload(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  if (loadingEmployee) return <Typography>Loading employee...</Typography>;
  if (!employee) return <Typography color="error">Employee not found</Typography>;

  return (
    <Stack spacing={2} maxWidth="md" mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Edit Employee</Typography>
        <Chip label={employee.isActive ? 'Active' : 'Inactive'} color={employee.isActive ? 'success' : 'default'} />
      </Stack>

      {error && <Typography color="error">{error}</Typography>}

      {/* Name */}
      <Stack direction="row" spacing={2}>
        <TextField
          name="firstName"
          label="First Name"
          value={form.firstName}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          name="lastName"
          label="Last Name"
          value={form.lastName}
          onChange={handleChange}
          fullWidth
          required
        />
      </Stack>

      {/* Email */}
      <TextField
        name="email"
        label="Email"
        type="email"
        value={form.email}
        onChange={handleChange}
        fullWidth
        required
      />

      {/* Phone + Hire Date */}
      <Stack direction="row" spacing={2}>
        <TextField name="phone" label="Phone" value={form.phone} onChange={handleChange} fullWidth />
        <TextField
          name="hireDate"
          label="Hire Date"
          type="date"
          value={form.hireDate}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      {/* Department & Position (DROPDOWNS) */}
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={loadingDepts}>
          <InputLabel>Department</InputLabel>
          <Select
            name="departmentId"
            value={form.departmentId}
            label="Department"
            onChange={(e) => setForm({ ...form, departmentId: e.target.value as string })}
          >
            <MenuItem value="">None</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={String(dept.id)}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
          {loadingDepts && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </FormControl>

        <FormControl fullWidth disabled={loadingPos}>
          <InputLabel>Position</InputLabel>
          <Select
            name="positionId"
            value={form.positionId}
            label="Position"
            onChange={(e) => setForm({ ...form, positionId: e.target.value as string })}
          >
            <MenuItem value="">None</MenuItem>
            {positions.map((pos) => (
              <MenuItem key={pos.id} value={String(pos.id)}>
                {pos.name}
              </MenuItem>
            ))}
          </Select>
          {loadingPos && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </FormControl>
      </Stack>

      {/* Gender + Age */}
      <Stack direction="row" spacing={2}>
        <TextField name="gender" label="Gender" value={form.gender} onChange={handleChange} fullWidth />
        <TextField
          name="age"
          label="Age"
          type="number"
          value={form.age}
          onChange={handleChange}
          fullWidth
        />
      </Stack>

      {/* Birth Date + Profile Image */}
      <Stack direction="row" spacing={2}>
        <TextField
          name="birthDate"
          label="Birth Date"
          type="date"
          value={form.birthDate}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          name="profileImageUrl"
          label="Profile Image URL (optional)"
          value={form.profileImageUrl}
          onChange={handleChange}
          fullWidth
        />
      </Stack>

      {/* Optional Login */}
      <Typography variant="subtitle2">Optional App Login</Typography>
      <Stack direction="row" spacing={2}>
        <TextField name="username" label="Username" value={form.username} onChange={handleChange} fullWidth />
        <TextField
          name="password"
          type="password"
          label="Password"
          value={form.password}
          onChange={handleChange}
          fullWidth
        />
      </Stack>

      {/* Linked User */}
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
          {users.map((u) => (
            <MenuItem key={u.id} value={String(u.id)}>
              {u.fullName} ({u.userName})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Actions */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        {employee.isActive ? (
          <Button variant="outlined" color="warning" onClick={() => deactivate.mutate()}>
            Deactivate
          </Button>
        ) : (
          <Button variant="outlined" color="success" onClick={() => activate.mutate()}>
            Activate
          </Button>
        )}
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => save.mutate()}
          disabled={save.isPending || loadingDepts || loadingPos}
        >
          {save.isPending ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    </Stack>
  );
};

export default EditEmployee;