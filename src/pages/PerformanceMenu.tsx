import React, { useState, useMemo } from 'react';
import api from '../lib/axios';
import {
  Box, Card, CardContent, Typography, Tab, Tabs, Chip, LinearProgress,
  Avatar, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert, Snackbar,
  Stack, Tooltip, IconButton, Divider, Skeleton,
} from '@mui/material';
import { TabContext, TabPanel } from '@mui/lab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import GroupsIcon from '@mui/icons-material/Groups';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FlagIcon from '@mui/icons-material/Flag';

// ── types ──────────────────────────────────────────────────────────────────
interface PerformanceData {
  id: number;
  userId: number;
  evaluatorId: number;
  tasksCompleted: number;
  hoursWorked: number;
  efficiencyScore?: number;
  qualityScore?: number;
  punctualityScore?: number;
  collaborationScore?: number;
  innovationScore?: number;
  overallRating?: number;
  feedback?: string;
  evaluationPeriod: string;
  date: string;
  user?:     { id: number; fullName: string; userName: string };
  evaluator?:{ id: number; fullName: string; userName: string };
}

// ── helpers ────────────────────────────────────────────────────────────────
const ratingColor = (r?: number): 'success' | 'warning' | 'error' | 'default' => {
  if (!r) return 'default';
  if (r >= 4) return 'success';
  if (r >= 3) return 'warning';
  return 'error';
};

const ratingLabel = (r?: number) => {
  if (!r) return '—';
  if (r >= 4.5) return 'Outstanding';
  if (r >= 4)   return 'Excellent';
  if (r >= 3)   return 'Good';
  if (r >= 2)   return 'Fair';
  return 'Needs Improvement';
};

const ScoreBar: React.FC<{ value?: number; max?: number }> = ({ value, max = 5 }) => {
  if (!value) return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
      <LinearProgress
        variant="determinate"
        value={(value / max) * 100}
        sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#f1f5f9',
          '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
      />
      <Typography variant="caption" fontWeight={700}>{value}/{max}</Typography>
    </Box>
  );
};

// ── main ───────────────────────────────────────────────────────────────────
const PerformanceMenu: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAdmin   = user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isManager = user?.role === 'Manager';
  const canManage = isAdmin || isManager;
  const currentUserId = user?.id;

  const [tab, setTab] = useState('1');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailUser, setDetailUser]  = useState<PerformanceData | null>(null);
  const [pageError, setPageError]    = useState<string | null>(null);
  const [pageSuccess, setPageSuccess]= useState<string | null>(null);

  const [form, setForm] = useState({
    userId: '', evaluatorId: currentUserId ? String(currentUserId) : '',
    tasksCompleted: '', hoursWorked: '',
    efficiencyScore: '', qualityScore: '', punctualityScore: '',
    collaborationScore: '', innovationScore: '', overallRating: '',
    feedback: '', evaluationPeriod: '', date: new Date().toISOString().split('T')[0],
  });

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // ── queries ────────────────────────────────────────────────────────────
  const { data: allData = [], isLoading } = useQuery<PerformanceData[]>({
    queryKey: ['performanceData'],
    queryFn: async () => (await api.get('/api/performance')).data,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/api/users')).data,
    enabled: canManage,
  });

  // Fetch linked evaluations for the selected employee (detail view dependency)
  const { data: employeeEvals = [] } = useQuery({
    queryKey: ['perf-evals', detailUser?.userId],
    queryFn: async () => {
      const res = await api.get('/api/evaluations');
      return (res.data || []).filter((e: any) => e.evaluateeID === detailUser?.userId);
    },
    enabled: !!detailUser,
  });

  // ── mutations ──────────────────────────────────────────────────────────
  const recalcMine = useMutation({
    mutationFn: () => api.post('/api/performance/recalculate', { userId: currentUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceData'] });
      setPageSuccess('Your performance has been recalculated for this month');
    },
    onError: (e: any) => setPageError(e?.response?.data?.error || e.message),
  });

  const recalcAll = useMutation({
    mutationFn: () => api.post('/api/performance/recalculate-all', {}),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['performanceData'] });
      const d = res.data;
      setPageSuccess(`Recalculation done — ${d.succeeded} succeeded, ${d.failed} failed`);
    },
    onError: (e: any) => setPageError(e?.response?.data?.error || e.message),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/api/performance', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performanceData'] });
      setDialogOpen(false);
      setPageSuccess('Performance record added');
      setForm({
        userId: '', evaluatorId: currentUserId ? String(currentUserId) : '',
        tasksCompleted: '', hoursWorked: '',
        efficiencyScore: '', qualityScore: '', punctualityScore: '',
        collaborationScore: '', innovationScore: '', overallRating: '',
        feedback: '', evaluationPeriod: '', date: new Date().toISOString().split('T')[0],
      });
    },
    onError: (e: any) => setPageError(e?.response?.data?.error || e.message),
  });

  // ── derived data ───────────────────────────────────────────────────────
  const myData = useMemo(
    () => allData.filter(d => d.userId === currentUserId),
    [allData, currentUserId]
  );

  const calcMetrics = (data: PerformanceData[]) => {
    if (!data.length) return { avg: 0, tasks: 0, hours: 0, trend: 'stable' as const };
    const avg   = data.reduce((s, d) => s + (d.overallRating || 0), 0) / data.length;
    const tasks = data.reduce((s, d) => s + d.tasksCompleted, 0);
    const hours = data.reduce((s, d) => s + d.hoursWorked, 0);
    const recent = data.slice(0, 3).reduce((s, d) => s + (d.overallRating || 0), 0) / Math.max(data.slice(0, 3).length, 1);
    const older  = data.slice(3, 6).length
      ? data.slice(3, 6).reduce((s, d) => s + (d.overallRating || 0), 0) / data.slice(3, 6).length
      : recent;
    const trend = recent > older + 0.1 ? 'up' : recent < older - 0.1 ? 'down' : 'stable';
    return { avg, tasks, hours, trend } as const;
  };

  const myMetrics = useMemo(() => calcMetrics(myData), [myData]);

  // Group allData by user for admin view
  const byUser = useMemo(() => {
    const map = new Map<number, PerformanceData[]>();
    allData.forEach(d => {
      const arr = map.get(d.userId) || [];
      arr.push(d);
      map.set(d.userId, arr);
    });
    return map;
  }, [allData]);

  const handleSubmit = () => {
    if (!form.userId || !form.evaluatorId || !form.tasksCompleted ||
        !form.hoursWorked || !form.evaluationPeriod || !form.date) {
      setPageError('Please fill in all required fields');
      return;
    }
    const num = (v: string) => v ? parseFloat(v) : null;
    createMutation.mutate({
      userId:            parseInt(form.userId),
      evaluatorId:       parseInt(form.evaluatorId),
      tasksCompleted:    parseInt(form.tasksCompleted),
      hoursWorked:       parseInt(form.hoursWorked),
      efficiencyScore:   num(form.efficiencyScore),
      qualityScore:      num(form.qualityScore),
      punctualityScore:  num(form.punctualityScore),
      collaborationScore:num(form.collaborationScore),
      innovationScore:   num(form.innovationScore),
      overallRating:     num(form.overallRating),
      feedback:          form.feedback || null,
      evaluationPeriod:  form.evaluationPeriod,
      date:              form.date,
    });
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* ── Feedback ── */}
      <Snackbar open={!!pageSuccess} autoHideDuration={4000}
        onClose={() => setPageSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setPageSuccess(null)} sx={{ borderRadius: 2 }}>
          {pageSuccess}
        </Alert>
      </Snackbar>
      {pageError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setPageError(null)}>
          {pageError}
        </Alert>
      )}

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">Performance Analytics</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Data driven by evaluations, completed goals, and approved timesheets
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Tooltip title="Recalculate your performance for this month">
            <Button variant="outlined" size="small" startIcon={<RefreshIcon />}
              onClick={() => recalcMine.mutate()}
              disabled={recalcMine.isPending || !currentUserId}
              sx={{ borderRadius: 2 }}>
              {recalcMine.isPending ? 'Recalculating…' : 'Refresh Mine'}
            </Button>
          </Tooltip>
          {isAdmin && (
            <Tooltip title="Recalculate performance for all active users">
              <Button variant="outlined" color="secondary" size="small" startIcon={<GroupsIcon />}
                onClick={() => recalcAll.mutate()}
                disabled={recalcAll.isPending}
                sx={{ borderRadius: 2 }}>
                {recalcAll.isPending ? 'Running…' : 'Recalculate All'}
              </Button>
            </Tooltip>
          )}
          {canManage && (
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Add Record
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── My summary cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 2, mb: 3 }}>
        {[
          { label: 'Avg Rating',      value: `${myMetrics.avg.toFixed(1)} / 5`, color: '#f59e0b', icon: <StarIcon /> },
          { label: 'Tasks Completed', value: myMetrics.tasks,                   color: '#10b981', icon: <WorkIcon /> },
          { label: 'Hours Logged',    value: `${myMetrics.hours}h`,             color: '#6366f1', icon: <ScheduleIcon /> },
          { label: 'Trend',           value: myMetrics.trend.charAt(0).toUpperCase() + myMetrics.trend.slice(1),
            color: myMetrics.trend === 'up' ? '#10b981' : myMetrics.trend === 'down' ? '#ef4444' : '#f59e0b',
            icon: myMetrics.trend === 'up' ? <TrendingUpIcon /> : myMetrics.trend === 'down' ? <TrendingDownIcon /> : <AssessmentIcon /> },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            sx={{ p: 2, borderRadius: 3, border: '1px solid #eef2ff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: `${s.color}15`, color: s.color, width: 40, height: 40, borderRadius: 2 }}>
              {s.icon}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#1e293b">{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ── Tabs ── */}
      <Card elevation={0} sx={{ border: '1px solid #eef2ff', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TabContext value={tab}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}
              sx={{ px: 2, borderBottom: '1px solid #f1f5f9',
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
              <Tab label="My Performance" value="1" />
              {canManage && <Tab label="Team Overview" value="2" />}
            </Tabs>

            {/* ── Tab 1: My performance ── */}
            <TabPanel value="1" sx={{ p: 2 }}>
              {isLoading ? (
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
              ) : myData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed #e2e8f0', borderRadius: 2 }}>
                  <AssessmentIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                  <Typography color="text.secondary" gutterBottom>
                    No performance records yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Complete an evaluation to generate your first performance record, or click "Refresh Mine"
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ '& th': { fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase' } }}>
                        <TableCell>Period</TableCell>
                        <TableCell>Overall</TableCell>
                        <TableCell>Tasks</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Efficiency</TableCell>
                        <TableCell>Quality</TableCell>
                        <TableCell>Punctuality</TableCell>
                        <TableCell>Collaboration</TableCell>
                        <TableCell>Innovation</TableCell>
                        <TableCell>Feedback</TableCell>
                        <TableCell>Evals</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myData.map(d => (
                        <TableRow key={d.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700}>{d.evaluationPeriod}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={`${Number(d.overallRating || 0).toFixed(1)}/5`}
                              size="small" color={ratingColor(d.overallRating)}
                              sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>{d.tasksCompleted}</TableCell>
                          <TableCell>{d.hoursWorked}h</TableCell>
                          <TableCell><ScoreBar value={d.efficiencyScore} /></TableCell>
                          <TableCell><ScoreBar value={d.qualityScore} /></TableCell>
                          <TableCell><ScoreBar value={d.punctualityScore} /></TableCell>
                          <TableCell><ScoreBar value={d.collaborationScore} /></TableCell>
                          <TableCell><ScoreBar value={d.innovationScore} /></TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary"
                              sx={{ maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {d.feedback || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View linked evaluations">
                              <IconButton size="small" sx={{ color: '#6366f1' }}
                                onClick={() => navigate(`/evaluations/view`)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            {/* ── Tab 2: Team Overview (Admin/Manager) ── */}
            {canManage && (
              <TabPanel value="2" sx={{ p: 2 }}>
                {isLoading ? (
                  <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
                ) : byUser.size === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">No performance data yet</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase' } }}>
                          <TableCell>Employee</TableCell>
                          <TableCell>Period</TableCell>
                          <TableCell>Overall</TableCell>
                          <TableCell>Rating</TableCell>
                          <TableCell>Tasks</TableCell>
                          <TableCell>Hours</TableCell>
                          <TableCell>Evaluator</TableCell>
                          <TableCell>Evaluations</TableCell>
                          <TableCell>Feedback</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allData.map(d => (
                          <TableRow key={d.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#6366f1', fontSize: 11, fontWeight: 700 }}>
                                  {(d.user?.fullName || '?')[0].toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={700} noWrap>
                                    {d.user?.fullName || `User #${d.userId}`}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{d.evaluationPeriod}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={`${Number(d.overallRating || 0).toFixed(1)}/5`}
                                size="small" color={ratingColor(d.overallRating)} sx={{ fontWeight: 700 }} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" fontWeight={600}
                                color={d.overallRating && d.overallRating >= 4 ? 'success.main'
                                  : d.overallRating && d.overallRating >= 3 ? 'warning.main' : 'error.main'}>
                                {ratingLabel(d.overallRating)}
                              </Typography>
                            </TableCell>
                            <TableCell>{d.tasksCompleted}</TableCell>
                            <TableCell>{d.hoursWorked}h</TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {d.evaluator?.fullName || `#${d.evaluatorId}`}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View evaluations for this employee">
                                <Button size="small" variant="text" startIcon={<VisibilityIcon />}
                                  sx={{ fontSize: 11 }}
                                  onClick={() => navigate(`/evaluations/view?evaluateeId=${d.userId}`)}>
                                  Evals
                                </Button>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary"
                                sx={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {d.feedback || '—'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            )}
          </TabContext>
        </CardContent>
      </Card>

      {/* ── How performance is calculated info box ── */}
      <Paper elevation={0} sx={{ mt: 3, p: 2.5, borderRadius: 3, bgcolor: '#f8faff', border: '1px solid #eef2ff' }}>
        <Typography variant="subtitle2" fontWeight={800} color="#1e293b" sx={{ mb: 1 }}>
          How performance is calculated
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { icon: <StarIcon sx={{ color: '#f59e0b', fontSize: 16 }} />, label: 'Overall Rating', desc: 'Average of all EvaluationResult scores for this user' },
            { icon: <WorkIcon sx={{ color: '#10b981', fontSize: 16 }} />, label: 'Tasks Completed', desc: 'Count of Goals with status = Completed' },
            { icon: <ScheduleIcon sx={{ color: '#6366f1', fontSize: 16 }} />, label: 'Hours Logged', desc: 'Sum of approved Timesheet hours for the current month' },
            { icon: <FlagIcon sx={{ color: '#ec4899', fontSize: 16 }} />, label: 'Sub-scores', desc: 'Manually entered — efficiency, quality, punctuality, collaboration, innovation' },
          ].map(({ icon, label, desc }) => (
            <Box key={label} sx={{ display: 'flex', gap: 1, minWidth: 200 }}>
              {icon}
              <Box>
                <Typography variant="caption" fontWeight={700} color="#1e293b">{label}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ══════════════════════════════════════════════════════
          Add Performance Record Dialog
      ══════════════════════════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Performance Record</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {/* Employee + Evaluator */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Employee *</InputLabel>
                <Select value={form.userId} label="Employee *"
                  onChange={e => setF('userId', e.target.value as string)}>
                  {(users as any[]).map(u => <MenuItem key={u.id} value={String(u.id)}>{u.fullName}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Evaluator *</InputLabel>
                <Select value={form.evaluatorId} label="Evaluator *"
                  onChange={e => setF('evaluatorId', e.target.value as string)}>
                  {(users as any[]).map(u => <MenuItem key={u.id} value={String(u.id)}>{u.fullName}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>

            {/* Period + Date */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Evaluation Period *" value={form.evaluationPeriod} fullWidth required
                placeholder="e.g. September 2026"
                onChange={e => setF('evaluationPeriod', e.target.value)} />
              <TextField label="Date *" type="date" value={form.date} fullWidth required
                onChange={e => setF('date', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>

            {/* Tasks + Hours */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Tasks Completed *" type="number" value={form.tasksCompleted} fullWidth required
                onChange={e => setF('tasksCompleted', e.target.value)}
                helperText="Number of goals/tasks completed this period" />
              <TextField label="Hours Worked *" type="number" value={form.hoursWorked} fullWidth required
                onChange={e => setF('hoursWorked', e.target.value)}
                helperText="Total approved timesheet hours" />
            </Stack>

            <Divider>
              <Typography variant="caption" color="text.secondary">COMPETENCY SCORES (1–5, optional)</Typography>
            </Divider>

            {/* 5 sub-scores in a grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 2 }}>
              {[
                { key: 'efficiencyScore',    label: 'Efficiency' },
                { key: 'qualityScore',       label: 'Quality' },
                { key: 'punctualityScore',   label: 'Punctuality' },
                { key: 'collaborationScore', label: 'Collaboration' },
                { key: 'innovationScore',    label: 'Innovation' },
              ].map(({ key, label }) => (
                <TextField key={key} label={`${label} (1–5)`} type="number" value={(form as any)[key]}
                  onChange={e => setF(key, e.target.value)}
                  slotProps={{ input: { inputProps: { min: 1, max: 5, step: 0.1 } } }} />
              ))}
              <TextField label="Overall Rating (1–5)" type="number" value={form.overallRating}
                onChange={e => setF('overallRating', e.target.value)}
                helperText="Leave blank to auto-compute from evaluations"
                slotProps={{ input: { inputProps: { min: 1, max: 5, step: 0.1 } } }} />
            </Box>

            {/* Feedback */}
            <TextField label="Feedback" value={form.feedback} fullWidth multiline rows={3}
              onChange={e => setF('feedback', e.target.value)}
              placeholder="Qualitative feedback for the employee…" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={createMutation.isPending} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {createMutation.isPending ? 'Saving…' : 'Save Record'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceMenu;
