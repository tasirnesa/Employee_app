import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useUser } from '../context/UserContext';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  LinearProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Notifications as NotifIcon,
  AdminPanelSettings as AdminIcon,
  Groups as TeamIcon,
  Visibility,
  VisibilityOff,
  PhotoCamera as CameraIcon,
  CheckCircle as CheckIcon,
  Cancel as XIcon,
} from '@mui/icons-material';

// ------- helpers -------
const getRole = () => {
  try { return JSON.parse(localStorage.getItem('userProfile') || '{}').role || 'Employee'; }
  catch { return 'Employee'; }
};

const passwordChecks = (pw: string) => [
  { label: 'At least 8 characters', ok: pw.length >= 8 },
  { label: 'Uppercase letter',       ok: /[A-Z]/.test(pw) },
  { label: 'Lowercase letter',       ok: /[a-z]/.test(pw) },
  { label: 'Number',                 ok: /\d/.test(pw) },
  { label: 'Special character',      ok: /[^A-Za-z0-9]/.test(pw) },
];

const strengthScore = (pw: string) => passwordChecks(pw).filter((c) => c.ok).length;
const strengthLabel = (s: number) => ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][s] || '';
const strengthColor = (s: number) =>
  ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#6366f1'][s] || '#e2e8f0';

// ------- sub-panels -------

const ProfileTab: React.FC<{ currentUser: any; onSaved: () => void }> = ({ currentUser, onSaved }) => {
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    email:    currentUser?.email    || '',
    gender:   currentUser?.gender   || '',
  });
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saved, setSaved]             = useState(false);
  const [err, setErr]                 = useState('');
  const fileInputRef                  = React.useRef<HTMLInputElement>(null);

  // fetch linked employee record to get its id for the upload endpoint
  const { data: myEmployee } = useQuery({
    queryKey: ['my-employee', currentUser?.id],
    queryFn: async () => {
      const res = await api.get('/api/employees');
      const list: any[] = res.data;
      return list.find((e) => e.userId === currentUser?.id) || null;
    },
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      setErr('');
      // 1. Update user profile fields
      await api.put('/api/users/me', { fullName: form.fullName, email: form.email, gender: form.gender });

      // 2. If a new photo was chosen and we have the employee id, upload it
      if (photoFile && myEmployee?.id) {
        const fd = new FormData();
        fd.append('profileImage', photoFile);
        // carry required fields so the employee update doesn't wipe them
        fd.append('firstName', myEmployee.firstName || '');
        fd.append('lastName',  myEmployee.lastName  || '');
        fd.append('email',     myEmployee.email     || form.email);
        await api.put(`/api/employees/${myEmployee.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e.message || 'Failed to save.');
    }
  };

  const resolveAvatar = (raw?: string | null) => {
    if (!raw) return undefined;
    if (/^blob:/i.test(raw) || /^https?:\/\//i.test(raw)) return raw;
    const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    return raw.startsWith('/') ? `${base}${raw}` : `${base}/uploads/${raw}`;
  };

  const avatarSrc = resolveAvatar(photoPreview || myEmployee?.profileImageUrl);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />

      {/* Avatar row */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar src={avatarSrc} sx={{ width: 80, height: 80, bgcolor: '#6366f1', fontSize: 32, fontWeight: 800 }}>
            {!avatarSrc && (form.fullName?.charAt(0) || '?')}
          </Avatar>
          <Tooltip title="Click to change photo">
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{ position: 'absolute', bottom: -4, right: -4, bgcolor: 'white', border: '1px solid #e2e8f0', boxShadow: 1 }}
            >
              <CameraIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>{form.fullName}</Typography>
          <Chip label={currentUser?.role} size="small" sx={{ bgcolor: '#eef2ff', color: '#6366f1', fontWeight: 700 }} />
          {photoFile && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              📎 {photoFile.name} — will upload on Save
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField
          label="Full Name" fullWidth value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <TextField
          label="Email" fullWidth value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <FormControl fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select value={form.gender} label="Gender" onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Username (read-only)" fullWidth value={currentUser?.userName || ''} disabled
        />
      </Box>

      {saved && <Alert severity="success" sx={{ borderRadius: 3 }}>Profile saved successfully!</Alert>}
      {err   && <Alert severity="error"   sx={{ borderRadius: 3 }}>{err}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" sx={{ borderRadius: 3, px: 4 }} onClick={handleSave}>
          Save Profile
        </Button>
      </Box>
    </Box>
  );
};

const SecurityTab: React.FC = () => {
  const [pw, setPw]     = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saved, setSaved] = useState(false);
  const [err, setErr]   = useState('');
  const score = strengthScore(pw.next);

  const handleSave = async () => {
    setErr('');
    if (pw.next !== pw.confirm) { setErr('Passwords do not match.'); return; }
    if (score < 3) { setErr('Please use a stronger password.'); return; }
    try {
      await api.put('/api/users/me', { currentPassword: pw.current, password: pw.next });
      setSaved(true);
      setPw({ current: '', next: '', confirm: '' });
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e.message || 'Failed to update password.');
    }
  };

  const checks = passwordChecks(pw.next);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" fontWeight={800}>Change Password</Typography>

      <TextField
        label="Current Password" type={show.current ? 'text' : 'password'} fullWidth
        value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })}
        InputProps={{ endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShow({ ...show, current: !show.current })}>
              {show.current ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        )}}
      />
      <TextField
        label="New Password" type={show.next ? 'text' : 'password'} fullWidth
        value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })}
        InputProps={{ endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShow({ ...show, next: !show.next })}>
              {show.next ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        )}}
      />

      {/* Strength meter */}
      {pw.next && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Password Strength</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: strengthColor(score) }}>
              {strengthLabel(score)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate" value={(score / 5) * 100}
            sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9',
                  '& .MuiLinearProgress-bar': { bgcolor: strengthColor(score), borderRadius: 3 } }}
          />
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {checks.map((c) => (
              <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {c.ok
                  ? <CheckIcon sx={{ fontSize: 14, color: '#22c55e' }} />
                  : <XIcon     sx={{ fontSize: 14, color: '#cbd5e1' }} />}
                <Typography variant="caption" color={c.ok ? 'text.primary' : 'text.disabled'}>
                  {c.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <TextField
        label="Confirm New Password" type={show.confirm ? 'text' : 'password'} fullWidth
        value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
        error={!!pw.confirm && pw.next !== pw.confirm}
        helperText={!!pw.confirm && pw.next !== pw.confirm ? 'Passwords do not match' : ''}
        InputProps={{ endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={() => setShow({ ...show, confirm: !show.confirm })}>
              {show.confirm ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        )}}
      />

      {saved && <Alert severity="success" sx={{ borderRadius: 3 }}>Password updated successfully!</Alert>}
      {err   && <Alert severity="error"   sx={{ borderRadius: 3 }}>{err}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" sx={{ borderRadius: 3, px: 4 }} onClick={handleSave}
          disabled={!pw.current || !pw.next || !pw.confirm}>
          Update Password
        </Button>
      </Box>
    </Box>
  );
};

interface NotifSetting { label: string; key: string; email: boolean; inApp: boolean; }
const defaultNotifSettings: NotifSetting[] = [
  { label: 'Leave Request Updates',     key: 'leave',       email: true,  inApp: true  },
  { label: 'New Evaluation Scheduled',  key: 'evaluation',  email: true,  inApp: true  },
  { label: 'Goal Deadline Approaching', key: 'goal',        email: false, inApp: true  },
  { label: 'Payslip Available',         key: 'payslip',     email: true,  inApp: true  },
  { label: 'Merit Proposal Decision',   key: 'merit',       email: true,  inApp: true  },
  { label: 'Announcements',             key: 'announcement',email: false, inApp: true  },
  { label: 'Messages',                  key: 'messages',    email: false, inApp: true  },
];

const NotificationsTab: React.FC = () => {
  const [settings, setSettings] = useState<NotifSetting[]>(defaultNotifSettings);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string, type: 'email' | 'inApp') => {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, [type]: !s[type] } : s));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" fontWeight={800}>Notification Preferences</Typography>
      <Typography variant="body2" color="text.secondary">
        Choose how you'd like to be notified for each event type.
      </Typography>

      {/* Header row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 1, px: 2 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary">EVENT</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center">EMAIL</Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center">IN-APP</Typography>
      </Box>

      {settings.map((s, idx) => (
        <Card key={s.key} elevation={0} sx={{
          border: '1px solid', borderColor: idx % 2 === 0 ? '#f1f5f9' : '#eef2ff',
          borderRadius: 3, bgcolor: idx % 2 === 0 ? 'white' : '#fafaff'
        }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={600}>{s.label}</Typography>
              <Box sx={{ textAlign: 'center' }}>
                <Switch checked={s.email} onChange={() => toggle(s.key, 'email')} size="small" />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Switch checked={s.inApp} onChange={() => toggle(s.key, 'inApp')} size="small" color="secondary" />
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      {saved && <Alert severity="success" sx={{ borderRadius: 3 }}>Preferences saved!</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button variant="contained" sx={{ borderRadius: 3, px: 4 }} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>
          Save Preferences
        </Button>
      </Box>
    </Box>
  );
};

interface AdminConfig { leaveMaxDays: number; workdayStart: string; workdayEnd: string; currency: string; payPeriod: string; evalPassMark: number; }
const AdminConsoleTab: React.FC = () => {
  const [cfg, setCfg] = useState<AdminConfig>({
    leaveMaxDays: 20, workdayStart: '08:00', workdayEnd: '17:00',
    currency: 'USD', payPeriod: 'Monthly', evalPassMark: 60,
  });
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    try {
      setErr('');
      // POST system config - endpoint may not exist yet, gracefully surface error
      await api.post('/api/admin/system-config', cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Could not save system config (endpoint may be pending).');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" fontWeight={800}>HR System Configuration</Typography>
        <Typography variant="body2" color="text.secondary">
          These settings apply organization-wide. Changes take effect immediately.
        </Typography>
      </Box>

      {/* Leave Policy */}
      <Card elevation={0} sx={{ border: '1px solid #eef2ff', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>Leave Policy</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Default Annual Leave Days" type="number" value={cfg.leaveMaxDays}
              onChange={(e) => setCfg({ ...cfg, leaveMaxDays: Number(e.target.value) })} />
          </Box>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card elevation={0} sx={{ border: '1px solid #eef2ff', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>Default Working Hours</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Day Start" type="time" value={cfg.workdayStart}
              onChange={(e) => setCfg({ ...cfg, workdayStart: e.target.value })}
              InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
            <TextField label="Day End" type="time" value={cfg.workdayEnd}
              onChange={(e) => setCfg({ ...cfg, workdayEnd: e.target.value })}
              InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
          </Box>
        </CardContent>
      </Card>

      {/* Payroll */}
      <Card elevation={0} sx={{ border: '1px solid #eef2ff', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>Payroll Settings</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Pay Period</InputLabel>
              <Select value={cfg.payPeriod} label="Pay Period" onChange={(e) => setCfg({ ...cfg, payPeriod: e.target.value })}>
                <MenuItem value="Weekly">Weekly</MenuItem>
                <MenuItem value="Bi-weekly">Bi-weekly</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select value={cfg.currency} label="Currency" onChange={(e) => setCfg({ ...cfg, currency: e.target.value })}>
                <MenuItem value="USD">USD – US Dollar</MenuItem>
                <MenuItem value="EUR">EUR – Euro</MenuItem>
                <MenuItem value="GBP">GBP – British Pound</MenuItem>
                <MenuItem value="ETB">ETB – Ethiopian Birr</MenuItem>
                <MenuItem value="KES">KES – Kenyan Shilling</MenuItem>
                <MenuItem value="SAR">SAR – Saudi Riyal</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Evaluation */}
      <Card elevation={0} sx={{ border: '1px solid #eef2ff', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} color="primary" gutterBottom>Evaluation Settings</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Default Pass Mark (%)" type="number" value={cfg.evalPassMark}
              onChange={(e) => setCfg({ ...cfg, evalPassMark: Number(e.target.value) })}
              inputProps={{ min: 0, max: 100 }} />
          </Box>
        </CardContent>
      </Card>

      {saved && <Alert severity="success" sx={{ borderRadius: 3 }}>System config saved!</Alert>}
      {err   && <Alert severity="warning" sx={{ borderRadius: 3 }}>{err}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" sx={{ borderRadius: 3, px: 4 }} onClick={handleSave}>
          Save System Config
        </Button>
      </Box>
    </Box>
  );
};

const TeamSettingsTab: React.FC = () => {
  const [cycle, setCycle] = useState('Quarterly');
  const [saved, setSaved] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" fontWeight={800}>Team Defaults</Typography>
        <Typography variant="body2" color="text.secondary">
          These preferences apply to your managed team.
        </Typography>
      </Box>
      <Card elevation={0} sx={{ border: '1px solid #eef2ff', borderRadius: 3 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Default Review Cycle</InputLabel>
            <Select value={cycle} label="Default Review Cycle" onChange={(e) => setCycle(e.target.value)}>
              <MenuItem value="Monthly">Monthly</MenuItem>
              <MenuItem value="Quarterly">Quarterly</MenuItem>
              <MenuItem value="Bi-annual">Bi-annual</MenuItem>
              <MenuItem value="Annual">Annual</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Notify me when a team member's leave is pending"
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Receive weekly team performance digest"
          />
        </CardContent>
      </Card>
      {saved && <Alert severity="success" sx={{ borderRadius: 3 }}>Team settings saved!</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" sx={{ borderRadius: 3, px: 4 }} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>
          Save Team Settings
        </Button>
      </Box>
    </Box>
  );
};

// ------- main settings page -------

interface TabDef { label: string; icon: React.ReactElement; roles: string[]; }

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser } = useUser();
  const role = getRole();
  const isAdmin   = role === 'Admin' || role === 'SuperAdmin';
  const isManager = role === 'Manager';

  const [tab, setTab] = useState(0);

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => (await api.get('/api/users/me')).data,
  });

  const handleProfileSaved = async () => {
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    queryClient.invalidateQueries({ queryKey: ['my-employee'] });
    try {
      const res = await api.get('/api/users/me');
      setUser(res.data);
      localStorage.setItem('userProfile', JSON.stringify(res.data));
    } catch (e) {
      // ignore
    }
  };

  const tabs: (TabDef & { panel: React.ReactNode })[] = [
    {
      label: 'Profile',
      icon: <PersonIcon />,
      roles: ['Employee', 'Manager', 'Admin', 'SuperAdmin'],
      panel: !isLoading && currentUser
        ? <ProfileTab currentUser={currentUser} onSaved={handleProfileSaved} />
        : null,
    },
    {
      label: 'Security',
      icon: <LockIcon />,
      roles: ['Employee', 'Manager', 'Admin', 'SuperAdmin'],
      panel: <SecurityTab />,
    },
    {
      label: 'Notifications',
      icon: <NotifIcon />,
      roles: ['Employee', 'Manager', 'Admin', 'SuperAdmin'],
      panel: <NotificationsTab />,
    },
    ...(isManager ? [{
      label: 'Team',
      icon: <TeamIcon />,
      roles: ['Manager'],
      panel: <TeamSettingsTab />,
    }] : []),
    ...(isAdmin ? [{
      label: 'Admin Console',
      icon: <AdminIcon />,
      roles: ['Admin', 'SuperAdmin'],
      panel: <AdminConsoleTab />,
    }] : []),
  ];

  const visibleTabs = tabs.filter((t) => !t.roles || t.roles.includes(role));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8faff' }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #eef2ff', px: { xs: 2, md: 6 }, py: 3 }}>
        <Typography variant="h5" fontWeight={900} color="#1e293b">Settings</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your account, security, and preferences.
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 3, alignItems: 'start' }}>

          {/* Sidebar nav */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 0.5, flexWrap: 'wrap' }}>
            {visibleTabs.map((t, i) => (
              <Box
                key={t.label}
                onClick={() => setTab(i)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1.5, borderRadius: 3, cursor: 'pointer',
                  fontWeight: 600, fontSize: 14,
                  color: tab === i ? '#6366f1' : '#475569',
                  bgcolor: tab === i ? '#eef2ff' : 'transparent',
                  border: tab === i ? '1px solid #c7d2fe' : '1px solid transparent',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: '#f1f5ff', color: '#6366f1' },
                }}
              >
                <Box sx={{ fontSize: 18, color: tab === i ? '#6366f1' : '#94a3b8', display: 'flex' }}>
                  {t.icon}
                </Box>
                {t.label}
              </Box>
            ))}
          </Box>

          {/* Panel */}
          <Card elevation={0} sx={{ border: '1px solid #eef2ff', borderRadius: 4, p: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)' }}>
            {isLoading
              ? <Typography color="text.secondary">Loading…</Typography>
              : visibleTabs[tab]?.panel}
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default Settings;
