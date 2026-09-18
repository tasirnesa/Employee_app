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
  Box,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getEmployee, updateEmployee, activateEmployee, deactivateEmployee } from '../api/employeeApi';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/axios';
import type { User, Department, Position } from '../types/interfaces';

const CONTRACT_TYPES  = ['Permanent', 'Contract', 'Part-time', 'Intern', 'Consultant'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Remote', 'Hybrid'];
const GENDER_OPTIONS  = ['Male', 'Female', 'Other'];
const EMERGENCY_RELS  = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Other'];

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box>
    <Typography variant="subtitle2" fontWeight={800} color="#64748b"
      sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
      {title}
    </Typography>
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: '1px solid #eef2ff' }}>
      {children}
    </Paper>
  </Box>
);

const EditEmployee: React.FC = () => {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const employeeId = Number(id);
  const queryClient = useQueryClient();

  const emptyForm = {
    // Identity
    employeeNumber: '',
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    age: '',
    nationality: '',
    nationalId: '',
    profileImageUrl: '',
    // Contact
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    // Employment
    hireDate: '',
    terminationDate: '',
    departmentId: '',
    positionId: '',
    contractType: '',
    employmentType: '',
    workLocation: '',
    // Emergency
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    // Financial
    bankName: '',
    bankAccount: '',
    tinNumber: '',
    // System
    username: '',
    password: '',
    userId: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: Number.isFinite(employeeId),
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/api/departments')).data,
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: async () => (await api.get('/api/positions')).data,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users-for-linking'],
    queryFn: async () => (await api.get('/api/users')).data,
  });

  // ── Pre-fill form ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!employee) return;
    const e = employee as any;
    const deptId = e.departmentId
      ? String(e.departmentId)
      : e.department && typeof e.department === 'object' ? String(e.department.id || '') : '';
    const posId = e.positionId
      ? String(e.positionId)
      : e.position && typeof e.position === 'object' ? String(e.position.id || '') : '';

    setForm({
      employeeNumber:    e.employeeNumber || '',
      firstName:         e.firstName || '',
      lastName:          e.lastName || '',
      gender:            e.gender || '',
      birthDate:         e.birthDate ? e.birthDate.substring(0, 10) : '',
      age:               e.age != null ? String(e.age) : '',
      nationality:       e.nationality || '',
      nationalId:        e.nationalId || '',
      profileImageUrl:   e.profileImageUrl || '',
      email:             e.email || '',
      phone:             e.phone || '',
      address:           e.address || '',
      city:              e.city || '',
      country:           e.country || '',
      hireDate:          e.hireDate ? e.hireDate.substring(0, 10) : '',
      terminationDate:   e.terminationDate ? e.terminationDate.substring(0, 10) : '',
      departmentId:      deptId,
      positionId:        posId,
      contractType:      e.contractType || '',
      employmentType:    e.employmentType || '',
      workLocation:      e.workLocation || '',
      emergencyName:     e.emergencyName || '',
      emergencyPhone:    e.emergencyPhone || '',
      emergencyRelation: e.emergencyRelation || '',
      bankName:          e.bankName || '',
      bankAccount:       e.bankAccount || '',
      tinNumber:         e.tinNumber || '',
      username:          '',
      password:          '',
      userId:            e.userId ? String(e.userId) : '',
    });
  }, [employee]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const save = useMutation({
    mutationFn: () => updateEmployee(employeeId, {
      employeeNumber:    form.employeeNumber || null,
      firstName:         form.firstName,
      lastName:          form.lastName,
      gender:            form.gender || null,
      birthDate:         form.birthDate || null,
      age:               form.age ? Number(form.age) : null,
      nationality:       form.nationality || null,
      nationalId:        form.nationalId || null,
      profileImageUrl:   form.profileImageUrl || null,
      email:             form.email,
      phone:             form.phone || null,
      address:           form.address || null,
      city:              form.city || null,
      country:           form.country || null,
      hireDate:          form.hireDate || null,
      terminationDate:   form.terminationDate || null,
      departmentId:      form.departmentId ? Number(form.departmentId) : null,
      positionId:        form.positionId ? Number(form.positionId) : null,
      contractType:      form.contractType || null,
      employmentType:    form.employmentType || null,
      workLocation:      form.workLocation || null,
      emergencyName:     form.emergencyName || null,
      emergencyPhone:    form.emergencyPhone || null,
      emergencyRelation: form.emergencyRelation || null,
      bankName:          form.bankName || null,
      bankAccount:       form.bankAccount || null,
      tinNumber:         form.tinNumber || null,
      username:          form.username || undefined,
      password:          form.password || undefined,
      userId:            form.userId ? Number(form.userId) : null,
    } as any),
    onSuccess: () => navigate('/employees/view'),
    onError: (e: any) => setError(e?.response?.data?.error || 'Failed to update employee'),
  });

  const activateMutation = useMutation({
    mutationFn: () => activateEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const set = (name: string, value: string) => setForm((p) => ({ ...p, [name]: value }));
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(e.target.name, e.target.value);

  if (isLoading) return <Typography sx={{ p: 3 }}>Loading employee…</Typography>;
  if (!employee) return <Typography color="error" sx={{ p: 3 }}>Employee not found</Typography>;

  return (
    <Stack spacing={3} sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#1e293b">Edit Employee</Typography>
          <Typography variant="body2" color="text.secondary">
            {(employee as any).firstName} {(employee as any).lastName}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={(employee as any).isActive ? 'Active' : 'Inactive'}
            color={(employee as any).isActive ? 'success' : 'default'}
            sx={{ fontWeight: 700 }}
          />
          {(employee as any).isActive ? (
            <Button size="small" variant="outlined" color="warning"
              onClick={() => deactivateMutation.mutate()}>Deactivate</Button>
          ) : (
            <Button size="small" variant="outlined" color="success"
              onClick={() => activateMutation.mutate()}>Activate</Button>
          )}
        </Stack>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* ── 1. Identity ── */}
      <Section title="Identity">
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField name="employeeNumber" label="Employee Number" value={form.employeeNumber}
              onChange={onChange} fullWidth placeholder="e.g. EMP-00123" />
            <TextField name="profileImageUrl" label="Profile Image URL" value={form.profileImageUrl}
              onChange={onChange} fullWidth />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField name="firstName" label="First Name" value={form.firstName}
              onChange={onChange} fullWidth required />
            <TextField name="lastName" label="Last Name" value={form.lastName}
              onChange={onChange} fullWidth required />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select value={form.gender} label="Gender" onChange={(e) => set('gender', e.target.value as string)}>
                <MenuItem value="">Select</MenuItem>
                {GENDER_OPTIONS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField name="birthDate" label="Date of Birth" type="date" value={form.birthDate}
              onChange={onChange} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField name="age" label="Age" type="number" value={form.age}
              onChange={onChange} fullWidth slotProps={{ input: { inputProps: { min: 0 } } }} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField name="nationality" label="Nationality" value={form.nationality}
              onChange={onChange} fullWidth placeholder="e.g. Ethiopian" />
            <TextField name="nationalId" label="National ID / Passport No." value={form.nationalId}
              onChange={onChange} fullWidth />
          </Stack>
        </Stack>
      </Section>

      {/* ── 2. Contact ── */}
      <Section title="Contact Information">
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField name="email" label="Work Email" type="email" value={form.email}
              onChange={onChange} fullWidth required />
            <TextField name="phone" label="Phone" value={form.phone} onChange={onChange} fullWidth />
          </Stack>
          <TextField name="address" label="Address" value={form.address} onChange={onChange} fullWidth />
          <Stack direction="row" spacing={2}>
            <TextField name="city" label="City" value={form.city} onChange={onChange} fullWidth />
            <TextField name="country" label="Country" value={form.country} onChange={onChange} fullWidth />
          </Stack>
        </Stack>
      </Section>

      {/* ── 3. Employment ── */}
      <Section title="Employment Details">
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField name="hireDate" label="Hire / Joining Date" type="date" value={form.hireDate}
              onChange={onChange} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            <TextField name="terminationDate" label="Termination Date (if applicable)" type="date"
              value={form.terminationDate} onChange={onChange} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={form.departmentId} label="Department"
                onChange={(e) => set('departmentId', e.target.value as string)}>
                <MenuItem value="">None</MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Position / Job Role</InputLabel>
              <Select value={form.positionId} label="Position / Job Role"
                onChange={(e) => set('positionId', e.target.value as string)}>
                <MenuItem value="">None</MenuItem>
                {positions.map(p => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Contract Type</InputLabel>
              <Select value={form.contractType} label="Contract Type"
                onChange={(e) => set('contractType', e.target.value as string)}>
                <MenuItem value="">Select</MenuItem>
                {CONTRACT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Employment Type</InputLabel>
              <Select value={form.employmentType} label="Employment Type"
                onChange={(e) => set('employmentType', e.target.value as string)}>
                <MenuItem value="">Select</MenuItem>
                {EMPLOYMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <TextField name="workLocation" label="Work Location / Office" value={form.workLocation}
            onChange={onChange} fullWidth placeholder="e.g. Addis Ababa HQ, Remote" />
        </Stack>
      </Section>

      {/* ── 4. Emergency Contact ── */}
      <Section title="Emergency Contact">
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField name="emergencyName" label="Contact Name" value={form.emergencyName}
              onChange={onChange} fullWidth />
            <TextField name="emergencyPhone" label="Contact Phone" value={form.emergencyPhone}
              onChange={onChange} fullWidth />
          </Stack>
          <FormControl fullWidth sx={{ maxWidth: 280 }}>
            <InputLabel>Relationship</InputLabel>
            <Select value={form.emergencyRelation} label="Relationship"
              onChange={(e) => set('emergencyRelation', e.target.value as string)}>
              <MenuItem value="">Select</MenuItem>
              {EMERGENCY_RELS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </Section>

      {/* ── 5. Financial / Payroll ── */}
      <Section title="Financial & Tax">
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField name="bankName" label="Bank Name" value={form.bankName}
              onChange={onChange} fullWidth />
            <TextField name="bankAccount" label="Bank Account Number" value={form.bankAccount}
              onChange={onChange} fullWidth />
          </Stack>
          <TextField name="tinNumber" label="TIN Number" value={form.tinNumber}
            onChange={onChange} fullWidth sx={{ maxWidth: 320 }} />
        </Stack>
      </Section>

      {/* ── 6. System / Account ── */}
      <Section title="System Account">
        <Stack spacing={2}>
          <Typography variant="caption" color="text.secondary">
            Leave username/password blank to keep existing credentials unchanged.
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField name="username" label="Username (optional)" value={form.username}
              onChange={onChange} fullWidth />
            <TextField name="password" type="password" label="New Password (optional)"
              value={form.password} onChange={onChange} fullWidth />
          </Stack>
          <FormControl fullWidth>
            <InputLabel>Linked User Account</InputLabel>
            <Select value={form.userId} label="Linked User Account"
              onChange={(e) => set('userId', e.target.value as string)}>
              <MenuItem value="">None</MenuItem>
              {users.map(u => (
                <MenuItem key={u.id} value={String(u.id)}>
                  {u.fullName} ({u.userName})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Section>

      {/* ── Actions ── */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button variant="contained" onClick={() => save.mutate()}
          disabled={save.isPending}
          sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>
          {save.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </Stack>
    </Stack>
  );
};

export default EditEmployee;
