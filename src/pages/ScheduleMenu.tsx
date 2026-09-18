import React, { useState } from 'react';
import api from '../lib/axios';
import {
  Box, Typography, Button, Alert, Stack, Chip, Paper,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Tooltip, List, ListItem, ListItemText,
  Checkbox, Divider, Skeleton, Avatar,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { useUser } from '../context/UserContext';

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const isSessionActive = (s: any) =>
  String(s.type || s.status || '').toLowerCase() === 'on';

const sessionStatus = (s: any) => {
  const active = isSessionActive(s);
  const now = new Date();
  const end = new Date(s.endDate);
  if (active && end < now) return { label: 'Expired', color: 'error' as const };
  if (active)              return { label: 'Active',  color: 'success' as const };
  return                          { label: 'Inactive', color: 'default' as const };
};

// ── Main ───────────────────────────────────────────────────────────────────
const ScheduleMenu: React.FC = () => {
  const navigate     = useNavigate();
  const qc           = useQueryClient();
  const { user }     = useUser();
  const isEmployee   = user?.role === 'Employee';
  const isAdmin      = user?.role === 'Admin' || user?.role === 'SuperAdmin' || user?.role === 'Manager';

  // ── dialog states ──────────────────────────────────────────────────────
  const [createOpen,  setCreateOpen]  = useState(false);
  const [statusOpen,  setStatusOpen]  = useState(false);
  const [criteriaOpen,setCriteriaOpen]= useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);

  // create form
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', department: '', passMark: '60' });
  const [formError, setFormError] = useState('');

  // status dialog
  const [statusEndDate, setStatusEndDate] = useState('');
  const [statusError, setStatusError]     = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');

  // criteria dialog
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<number[]>([]);
  const [criteriaError, setCriteriaError]   = useState('');
  const [criteriaSuccess, setCriteriaSuccess] = useState('');

  const [globalSuccess, setGlobalSuccess] = useState('');

  // ── queries ────────────────────────────────────────────────────────────
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await api.get('/api/sessions')).data,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.getDepartments(),
  });

  const { data: allCriteria = [] } = useQuery({
    queryKey: ['criteria'],
    queryFn: async () => (await api.get('/api/criteria')).data.filter((c: any) => c.isAuthorized),
  });

  const { data: sessionCriteria = [], refetch: refetchSC } = useQuery({
    queryKey: ['session-criteria', activeSession?.sessionID ?? activeSession?.id],
    queryFn: async () => {
      const id = activeSession?.sessionID ?? activeSession?.id;
      if (!id) return [];
      return (await api.get(`/api/sessions/${id}/criteria`)).data;
    },
    enabled: !!activeSession && criteriaOpen,
  });

  // ── create session ─────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      setFormError('Title, Start Date and End Date are required');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setFormError('End date must be after start date');
      return;
    }
    try {
      setFormError('');
      await api.post('/api/sessions', {
        title:      form.title,
        startDate:  form.startDate,
        endDate:    form.endDate,
        department: form.department || null,
        passMark:   Number(form.passMark) || 60,
      });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      setCreateOpen(false);
      setForm({ title: '', startDate: '', endDate: '', department: '', passMark: '60' });
      flash('Session created successfully');
    } catch (e: any) {
      setFormError(e?.response?.data?.error || 'Failed to create session');
    }
  };

  // ── activate / deactivate ──────────────────────────────────────────────
  const openStatusDialog = (session: any) => {
    setActiveSession(session);
    setStatusEndDate('');
    setStatusError('');
    setStatusSuccess('');
    setStatusOpen(true);
  };

  const handleToggleStatus = async (targetStatus: 'on' | 'off') => {
    const id = activeSession?.sessionID ?? activeSession?.id;
    if (!id) return;
    if (targetStatus === 'on' && !statusEndDate) {
      setStatusError('Please set an end date to activate this session');
      return;
    }
    try {
      setStatusError('');
      await api.put(`/api/sessions/${id}/status`, {
        status:    targetStatus,
        startDate: targetStatus === 'on' ? new Date().toISOString().split('T')[0] : undefined,
        endDate:   targetStatus === 'on' ? statusEndDate : undefined,
      });
      qc.invalidateQueries({ queryKey: ['sessions'] });
      setStatusOpen(false);
      flash(targetStatus === 'on' ? 'Session activated — evaluations can now be submitted' : 'Session deactivated');
    } catch (e: any) {
      setStatusError(e?.response?.data?.error || 'Failed to update status');
    }
  };

  // ── criteria assignment ────────────────────────────────────────────────
  const openCriteriaDialog = (session: any) => {
    setActiveSession(session);
    setSelectedCriteriaIds([]);
    setCriteriaError('');
    setCriteriaSuccess('');
    setCriteriaOpen(true);
  };

  const handleAssignCriteria = async () => {
    if (!selectedCriteriaIds.length) { setCriteriaError('Select at least one criterion'); return; }
    const id = activeSession?.sessionID ?? activeSession?.id;
    try {
      setCriteriaError('');
      const res = await api.post(`/api/sessions/${id}/criteria`, {
        criteriaIds: selectedCriteriaIds, isRequired: true, weight: 1.0,
      });
      setCriteriaSuccess(res.data.message || 'Criteria assigned');
      setSelectedCriteriaIds([]);
      refetchSC();
    } catch (e: any) {
      setCriteriaError(e?.response?.data?.error || 'Failed to assign');
    }
  };

  const handleRemoveCriteria = async (criteriaId: number) => {
    const id = activeSession?.sessionID ?? activeSession?.id;
    try {
      await api.delete(`/api/sessions/${id}/criteria/${criteriaId}`);
      refetchSC();
    } catch (e: any) {
      setCriteriaError(e?.response?.data?.error || 'Failed to remove');
    }
  };

  const flash = (msg: string) => {
    setGlobalSuccess(msg);
    setTimeout(() => setGlobalSuccess(''), 4000);
  };

  const unassigned = allCriteria.filter(
    (c: any) => !sessionCriteria.some((sc: any) => sc.criteriaID === c.criteriaID)
  );

  // ── totals ──────────────────────────────────────────────────────────────
  const activeCount   = sessions.filter((s: any) => isSessionActive(s)).length;
  const inactiveCount = sessions.length - activeCount;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">Evaluation Sessions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Create sessions, assign criteria, then activate to open evaluations
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}>
            New Session
          </Button>
        )}
      </Box>

      {/* ── Global success ── */}
      {globalSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setGlobalSuccess('')}>
          {globalSuccess}
        </Alert>
      )}

      {/* ── Summary strip ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Sessions', value: sessions.length, color: '#6366f1', icon: <CalendarMonthIcon /> },
          { label: 'Active',         value: activeCount,     color: '#10b981', icon: <CheckCircleIcon /> },
          { label: 'Inactive',       value: inactiveCount,   color: '#94a3b8', icon: <RadioButtonUncheckedIcon /> },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ flex: '1 1 140px', p: 2, borderRadius: 3, border: '1px solid #eef2ff',
              display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: `${s.color}15`, color: s.color, width: 36, height: 36, borderRadius: 2 }}>
              {s.icon}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1e293b">{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ── How it works guide ── */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: '#f8faff', border: '1px solid #eef2ff' }}>
        <Typography variant="subtitle2" fontWeight={800} color="#1e293b" sx={{ mb: 1 }}>
          How evaluation sessions work
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {[
            { step: '1', label: 'Create Session', desc: 'Click "New Session" — set title, dates, department' },
            { step: '2', label: 'Assign Criteria', desc: 'Click the 📋 Criteria button to choose scoring criteria' },
            { step: '3', label: 'Activate', desc: 'Click ⚡ Activate — this opens the session for evaluations' },
            { step: '4', label: 'Evaluate', desc: 'Go to Evaluations → Create Evaluation and select this session' },
            { step: '5', label: 'Deactivate', desc: 'Click ⏹ Deactivate when the review period ends' },
          ].map(({ step, label, desc }) => (
            <Box key={step} sx={{ display: 'flex', gap: 1, minWidth: 160 }}>
              <Avatar sx={{ bgcolor: '#6366f1', color: 'white', width: 24, height: 24, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {step}
              </Avatar>
              <Box>
                <Typography variant="caption" fontWeight={700} color="#1e293b">{label}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ── Sessions Table ── */}
      {isLoading ? (
        <Stack spacing={1}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : sessions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #e2e8f0', borderRadius: 3 }}>
          <CalendarMonthIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary" gutterBottom>No sessions yet</Typography>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2, mt: 1 }}>
              Create First Session
            </Button>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0}
          sx={{ border: '1px solid #eef2ff', borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8faff', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 } }}>
                <TableCell>Session</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Pass Mark</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((s: any) => {
                const id     = s.sessionID ?? s.id;
                const status = sessionStatus(s);
                const active = isSessionActive(s);
                return (
                  <TableRow key={id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{s.title}</Typography>
                      <Typography variant="caption" color="text.secondary">#{id}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.department || <span style={{ color: '#94a3b8' }}>All</span>}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{fmt(s.startDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{fmt(s.endDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={status.label} size="small" color={status.color}
                        sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.passMark ?? 60}%</Typography>
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {/* Assign Criteria */}
                          <Tooltip title="Assign Criteria">
                            <IconButton size="small" onClick={() => openCriteriaDialog(s)}
                              sx={{ color: '#6366f1' }}>
                              <AssignmentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Activate / Deactivate */}
                          {!active ? (
                            <Tooltip title="Activate session — allows evaluations to be submitted">
                              <IconButton size="small" onClick={() => openStatusDialog(s)}
                                sx={{ color: '#10b981' }}>
                                <PowerSettingsNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Deactivate session — closes it to new evaluations">
                              <IconButton size="small"
                                onClick={async () => {
                                  setActiveSession(s);
                                  await api.put(`/api/sessions/${id}/status`, { status: 'off' });
                                  qc.invalidateQueries({ queryKey: ['sessions'] });
                                  flash('Session deactivated');
                                }}
                                sx={{ color: '#ef4444' }}>
                                <PowerSettingsNewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Go to Create Evaluation */}
                          {active && (
                            <Tooltip title="Create Evaluation for this session">
                              <IconButton size="small"
                                onClick={() => navigate(`/evaluations/create?sessionId=${id}`)}
                                sx={{ color: '#f59e0b' }}>
                                <RateReviewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DIALOG 1 — Create Session
      ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}
        maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>New Evaluation Session</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Session Title" value={form.title} required autoFocus
              onChange={e => setForm({ ...form, title: e.target.value })} fullWidth
              placeholder="e.g. Q3 2026 Annual Performance Review" />
            <FormControl fullWidth>
              <InputLabel>Department (optional — leave blank for all)</InputLabel>
              <Select value={form.department} label="Department (optional — leave blank for all)"
                onChange={e => setForm({ ...form, department: e.target.value as string })}>
                <MenuItem value="">All Departments</MenuItem>
                {(departments as any[]).map((d: any) => (
                  <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField label="Start Date" type="date" value={form.startDate} required fullWidth
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="End Date" type="date" value={form.endDate} required fullWidth
                onChange={e => setForm({ ...form, endDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true }, input: { inputProps: { min: form.startDate } } }} />
            </Stack>
            <TextField label="Pass Mark (%)" type="number" value={form.passMark}
              onChange={e => setForm({ ...form, passMark: e.target.value })} fullWidth
              helperText="Minimum average score % to pass this evaluation period"
              slotProps={{ input: { inputProps: { min: 0, max: 100 } } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Create Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════
          DIALOG 2 — Activate Session
      ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={statusOpen} onClose={() => setStatusOpen(false)}
        maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Activate Session
          <Typography variant="body2" color="text.secondary" fontWeight={400}>
            {activeSession?.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {statusError   && <Alert severity="error"   sx={{ mb: 2 }}>{statusError}</Alert>}
          {statusSuccess && <Alert severity="success" sx={{ mb: 2 }}>{statusSuccess}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Activating this session will allow evaluators to submit evaluations for the selected session.
            </Alert>
            <TextField label="Start Date" type="date" disabled fullWidth
              value={new Date().toISOString().split('T')[0]}
              helperText="Activation starts today"
              slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="End Date *" type="date" value={statusEndDate} required fullWidth
              onChange={e => setStatusEndDate(e.target.value)}
              helperText="Evaluations can be submitted until this date"
              slotProps={{ inputLabel: { shrink: true }, input: { inputProps: { min: new Date().toISOString().split('T')[0] } } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setStatusOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => handleToggleStatus('on')}
            startIcon={<PowerSettingsNewIcon />} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Activate
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════
          DIALOG 3 — Criteria Assignment
      ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={criteriaOpen} onClose={() => setCriteriaOpen(false)}
        maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Assign Criteria
          <Typography variant="body2" color="text.secondary" fontWeight={400}>
            {activeSession?.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {criteriaError   && <Alert severity="error"   sx={{ mb: 2 }}>{criteriaError}</Alert>}
          {criteriaSuccess && <Alert severity="success" sx={{ mb: 2 }}>{criteriaSuccess}</Alert>}

          {/* Currently assigned */}
          {sessionCriteria.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Assigned ({sessionCriteria.length})
              </Typography>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <List dense disablePadding>
                  {(sessionCriteria as any[]).map((sc: any) => (
                    <ListItem key={sc.criteriaID}
                      sx={{ borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 0 } }}
                      secondaryAction={
                        <Tooltip title="Remove">
                          <IconButton size="small" color="error"
                            onClick={() => handleRemoveCriteria(sc.criteriaID)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={600}>{sc.criteria?.title}</Typography>
                            {sc.isRequired && (
                              <Chip label="Required" size="small"
                                sx={{ height: 16, fontSize: 10, bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 700 }} />
                            )}
                          </Stack>
                        }
                        secondary={sc.criteria?.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">ADD MORE CRITERIA</Typography>
          </Divider>

          {allCriteria.length === 0 ? (
            <Alert severity="warning">
              No authorized criteria yet. Go to Evaluation → Criteria → Create and authorize some first.
            </Alert>
          ) : unassigned.length === 0 ? (
            <Alert severity="success">All authorized criteria are assigned to this session.</Alert>
          ) : (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
              <List dense disablePadding>
                {(unassigned as any[]).map((c: any) => (
                  <ListItem key={c.criteriaID}
                    sx={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 0 },
                      '&:hover': { bgcolor: '#f8faff' } }}
                    onClick={() => setSelectedCriteriaIds(p =>
                      p.includes(c.criteriaID) ? p.filter(x => x !== c.criteriaID) : [...p, c.criteriaID]
                    )}>
                    <Checkbox size="small" checked={selectedCriteriaIds.includes(c.criteriaID)}
                      sx={{ p: 0.5, mr: 1 }} />
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>{c.title}</Typography>}
                      secondary={c.description} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCriteriaOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Done</Button>
          {unassigned.length > 0 && (
            <Button variant="contained" startIcon={<AddIcon />}
              disabled={selectedCriteriaIds.length === 0}
              onClick={handleAssignCriteria}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Assign {selectedCriteriaIds.length > 0 ? `(${selectedCriteriaIds.length})` : ''}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScheduleMenu;
