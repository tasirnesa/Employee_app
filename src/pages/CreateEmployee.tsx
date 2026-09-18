import React, { useCallback, useState } from 'react';
import {
  Box, Stack, TextField, Button, Typography, FormControl, InputLabel,
  Select, MenuItem, Alert, Paper, Divider, Stepper, Step, StepLabel,
  CircularProgress,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../lib/axios';
import type { Department, Position, User } from '../types/interfaces';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// ── constants ──────────────────────────────────────────────────────────────
const CONTRACT_TYPES   = ['Permanent', 'Contract', 'Part-time', 'Intern', 'Consultant'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Remote', 'Hybrid'];
const GENDER_OPTIONS   = ['Male', 'Female'];
const EMERGENCY_RELS   = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Other'];

const STEPS = ['Identity & Contact', 'Employment Details', 'Emergency & Financial', 'Account Setup'];

// ── Section wrapper ────────────────────────────────────────────────────────
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="caption" fontWeight={800} color="#64748b"
      sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11, display: 'block', mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

// ── Main Component ─────────────────────────────────────────────────────────
const CreateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [form, setForm] = useState({
    // Step 0 — Identity & Contact
    employeeNumber: '',
    firstName: '',
    lastName: '',
    gender: '',
    birthDate: '',
    nationality: '',
    nationalId: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    profileImageUrl: '',
    // Step 1 — Employment
    hireDate: '',
    departmentId: '',
    positionId: '',
    contractType: '',
    employmentType: '',
    workLocation: '',
    // Step 2 — Emergency & Financial
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    bankName: '',
    bankAccount: '',
    tinNumber: '',
    // Step 3 — Account
    username: '',
    password: '',
    userId: '',        // link existing user
  });

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/api/departments')).data,
    staleTime: 5 * 60 * 1000,
  });
  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: async () => (await api.get('/api/positions')).data,
    staleTime: 5 * 60 * 1000,
  });
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users-for-linking'],
    queryFn: async () => (await api.get('/api/users')).data,
    staleTime: 5 * 60 * 1000,
  });

  // ── Mutation ───────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      const append = (k: string, v: string) => { if (v) fd.append(k, v); };

      append('employeeNumber',    form.employeeNumber);
      fd.append('firstName',      form.firstName);
      fd.append('lastName',       form.lastName);
      append('gender',            form.gender);
      append('email',             form.email);
      append('phone',             form.phone);
      append('address',           form.address);
      append('city',              form.city);
      append('country',           form.country);
      append('nationality',       form.nationality);
      append('nationalId',        form.nationalId);
      append('profileImageUrl',   form.profileImageUrl);

      append('hireDate',          form.hireDate);
      append('departmentId',      form.departmentId);
      append('positionId',        form.positionId);
      append('contractType',      form.contractType);
      append('employmentType',    form.employmentType);
      append('workLocation',      form.workLocation);

      append('emergencyName',     form.emergencyName);
      append('emergencyPhone',    form.emergencyPhone);
      append('emergencyRelation', form.emergencyRelation);
      append('bankName',          form.bankName);
      append('bankAccount',       form.bankAccount);
      append('tinNumber',         form.tinNumber);

      append('username',          form.username);
      append('password',          form.password);
      append('userId',            form.userId);

      if (form.birthDate) {
        fd.append('birthDate', form.birthDate);
        fd.append('age', String(new Date().getFullYear() - new Date(form.birthDate).getFullYear()));
      }
      if (file) fd.append('profileImage', file);

      return (await api.post('/api/employees', fd)).data;
    },
    onSuccess: () => setStep(STEPS.length),
    onError: (err: any) => {
      const msg: string = err?.response?.data?.error || err?.message || 'Failed to create employee';
      setError(msg);
      if (msg.toLowerCase().includes('email')) {
        setEmailError(msg);
        setStep(0);
      }
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────
  const set = (name: string, value: string) => setForm(p => ({ ...p, [name]: value }));
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.name, e.target.value);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback((f: File[]) => f[0] && setFile(f[0]), []),
    multiple: false,
    accept: { 'image/*': [] },
  });

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.firstName.trim()) return 'First name is required';
      if (!form.lastName.trim())  return 'Last name is required';
      if (!form.email.trim())     return 'Email is required';
    }
    if (step === 1) {
      if (!form.departmentId) return 'Department is required';
      if (!form.positionId)   return 'Position is required';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep(s => s + 1);
  };

  const handleBack = () => { setError(null); setStep(s => s - 1); };

  // ── Step content ───────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      case 0: return (
        <>
          <Section title="Name & Identity">
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField name="employeeNumber" label="Employee Number (optional)"
                  value={form.employeeNumber} onChange={onChange} fullWidth
                  placeholder="e.g. EMP-00123" />
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
                  <Select value={form.gender} label="Gender" onChange={e => set('gender', e.target.value as string)}>
                    <MenuItem value="">Select</MenuItem>
                    {GENDER_OPTIONS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField name="birthDate" label="Date of Birth" type="date" value={form.birthDate}
                  onChange={onChange} fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText={form.birthDate
                    ? `Age: ${new Date().getFullYear() - new Date(form.birthDate).getFullYear()} years`
                    : ''} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField name="nationality" label="Nationality" value={form.nationality}
                  onChange={onChange} fullWidth placeholder="e.g. Ethiopian" />
                <TextField name="nationalId" label="National ID / Passport No."
                  value={form.nationalId} onChange={onChange} fullWidth />
              </Stack>
            </Stack>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="Contact">
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  name="email" label="Work Email" type="email"
                  value={form.email}
                  onChange={e => {
                    setEmailError(null);
                    setError(null);
                    set('email', e.target.value);
                  }}
                  fullWidth required
                  error={!!emailError}
                  helperText={emailError || undefined}
                />
                <TextField name="phone" label="Phone" value={form.phone}
                  onChange={onChange} fullWidth />
              </Stack>
              <TextField name="address" label="Address" value={form.address}
                onChange={onChange} fullWidth />
              <Stack direction="row" spacing={2}>
                <TextField name="city" label="City" value={form.city}
                  onChange={onChange} fullWidth />
                <TextField name="country" label="Country" value={form.country}
                  onChange={onChange} fullWidth />
              </Stack>
            </Stack>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="Profile Photo">
            <Box {...getRootProps()} sx={{
              border: '2px dashed #c7d2fe', borderRadius: 2, p: 3,
              textAlign: 'center', cursor: 'pointer', bgcolor: '#f8faff',
              '&:hover': { borderColor: '#6366f1', bgcolor: '#eef2ff' },
            }}>
              <input {...getInputProps()} />
              <Typography variant="body2" color="text.secondary">
                {file
                  ? `✅ ${file.name}`
                  : isDragActive
                    ? 'Drop it here…'
                    : 'Drag & drop a photo, or click to browse'}
              </Typography>
            </Box>
            <TextField name="profileImageUrl" label="Or enter image URL" value={form.profileImageUrl}
              onChange={onChange} fullWidth size="small" sx={{ mt: 1 }} />
          </Section>
        </>
      );

      case 1: return (
        <Section title="Employment Details">
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField name="hireDate" label="Hire / Joining Date" type="date"
                value={form.hireDate} onChange={onChange} fullWidth
                slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Department *</InputLabel>
                <Select value={form.departmentId} label="Department *"
                  onChange={e => set('departmentId', e.target.value as string)}>
                  <MenuItem value="">Select department</MenuItem>
                  {departments.map(d => <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Position / Job Role *</InputLabel>
                <Select value={form.positionId} label="Position / Job Role *"
                  onChange={e => set('positionId', e.target.value as string)}>
                  <MenuItem value="">Select position</MenuItem>
                  {positions.map(p => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Contract Type</InputLabel>
                <Select value={form.contractType} label="Contract Type"
                  onChange={e => set('contractType', e.target.value as string)}>
                  <MenuItem value="">Select</MenuItem>
                  {CONTRACT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select value={form.employmentType} label="Employment Type"
                  onChange={e => set('employmentType', e.target.value as string)}>
                  <MenuItem value="">Select</MenuItem>
                  {EMPLOYMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
            <TextField name="workLocation" label="Work Location / Office"
              value={form.workLocation} onChange={onChange} fullWidth
              placeholder="e.g. Addis Ababa HQ, Remote" />
          </Stack>
        </Section>
      );

      case 2: return (
        <>
          <Section title="Emergency Contact">
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField name="emergencyName" label="Contact Name"
                  value={form.emergencyName} onChange={onChange} fullWidth />
                <TextField name="emergencyPhone" label="Contact Phone"
                  value={form.emergencyPhone} onChange={onChange} fullWidth />
              </Stack>
              <FormControl fullWidth sx={{ maxWidth: 280 }}>
                <InputLabel>Relationship</InputLabel>
                <Select value={form.emergencyRelation} label="Relationship"
                  onChange={e => set('emergencyRelation', e.target.value as string)}>
                  <MenuItem value="">Select</MenuItem>
                  {EMERGENCY_RELS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </Section>

          <Divider sx={{ my: 2 }} />

          <Section title="Financial & Tax">
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField name="bankName" label="Bank Name"
                  value={form.bankName} onChange={onChange} fullWidth />
                <TextField name="bankAccount" label="Bank Account Number"
                  value={form.bankAccount} onChange={onChange} fullWidth />
              </Stack>
              <TextField name="tinNumber" label="TIN Number"
                value={form.tinNumber} onChange={onChange} fullWidth sx={{ maxWidth: 320 }} />
            </Stack>
          </Section>
        </>
      );

      case 3: return (
        <Section title="System Account (optional)">
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              You can create a login for this employee so they can access the system,
              OR link them to an existing user account. Leave both blank to skip.
            </Alert>

            <Typography variant="subtitle2" fontWeight={700}>Create new login credentials</Typography>
            <Stack direction="row" spacing={2}>
              <TextField name="username" label="Username" value={form.username}
                onChange={onChange} fullWidth
                disabled={!!form.userId}
                helperText={form.userId ? 'Disabled — linking existing user' : ''} />
              <TextField name="password" type="password" label="Password"
                value={form.password} onChange={onChange} fullWidth
                disabled={!!form.userId}
                helperText={form.userId ? 'Disabled — linking existing user' : ''} />
            </Stack>

            <Divider>OR</Divider>

            <Typography variant="subtitle2" fontWeight={700}>Link an existing user account</Typography>
            <FormControl fullWidth disabled={!!(form.username || form.password)}>
              <InputLabel>Existing User</InputLabel>
              <Select value={form.userId} label="Existing User"
                onChange={e => set('userId', e.target.value as string)}>
                <MenuItem value="">None</MenuItem>
                {users.map(u => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.fullName} ({u.userName}) — {u.role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {(form.username || form.password) && form.userId && (
              <Alert severity="warning">
                Both new credentials and a linked user are set. Clear one to avoid conflicts.
              </Alert>
            )}
          </Stack>
        </Section>
      );

      default: return null;
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────
  if (step === STEPS.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, maxWidth: 480, mx: 'auto' }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={800} gutterBottom>Employee Created!</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The employee record has been saved with all details.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="outlined" onClick={() => navigate('/employees/create')}
            sx={{ borderRadius: 2 }}>
            Add Another
          </Button>
          <Button variant="contained" onClick={() => navigate('/employees/view')}
            sx={{ borderRadius: 2, fontWeight: 700 }}>
            View All Employees
          </Button>
        </Stack>
      </Box>
    );
  }

  // ── Wizard shell ───────────────────────────────────────────────────────
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={800} color="#1e293b" sx={{ mb: 0.5 }}>
        Create Employee
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Complete all steps to add a new employee to the system
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map(label => (
          <Step key={label}>
            <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 12 } }}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eef2ff', mb: 3 }}>
        {error && !emailError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {renderStep()}
      </Paper>

      <Stack direction="row" justifyContent="space-between">
        <Button
          variant="outlined"
          onClick={step === 0 ? () => navigate(-1) : handleBack}
          sx={{ borderRadius: 2 }}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button variant="contained" onClick={handleNext} sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}>
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            {mutation.isPending ? 'Creating…' : 'Create Employee'}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default CreateEmployee;
