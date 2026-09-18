import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Skeleton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
  Tooltip,
  InputAdornment,
  Rating,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../lib/axios';

// ── helpers ────────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  switch (s) {
    case 'Completed':  return 'success';
    case 'InProgress': return 'warning';
    case 'Cancelled':  return 'error';
    default:           return 'default';
  }
};

const calcProgress = (tasks: any[]) => {
  if (!tasks?.length) return 0;
  return Math.round((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100);
};

// ── Detail Drawer / Dialog ─────────────────────────────────────────────────
const DetailDialog: React.FC<{
  record: any;
  open: boolean;
  onClose: () => void;
  onCompleteTask: (id: number) => void;
  onFinalize: (id: number) => void;
  taskPending: boolean;
  finalizePending: boolean;
}> = ({ record, open, onClose, onCompleteTask, onFinalize, taskPending, finalizePending }) => {
  const pct = calcProgress(record?.tasks || []);
  const emp = record?.employee;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            Offboarding Checklist
            <Typography variant="body2" color="text.secondary" fontWeight={400}>
              {emp?.firstName} {emp?.lastName} · {emp?.position?.name || '—'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={record?.status} size="small" color={statusColor(record?.status) as any} sx={{ fontWeight: 700 }} />
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>
        {/* Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600}>Overall progress</Typography>
            <Typography variant="body2" fontWeight={800} color="primary">{pct}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
          />
        </Box>

        {/* Task list */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Separation Tasks</Typography>
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {(record?.tasks || []).map((task: any, idx: number) => (
              <React.Fragment key={task.id}>
                <ListItem
                  sx={{ py: 1.25 }}
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      checked={task.status === 'Completed'}
                      disabled={task.status === 'Completed' || record?.status !== 'InProgress' || taskPending}
                      onChange={() => onCompleteTask(task.id)}
                      color="success"
                    />
                  }
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {task.status === 'Completed'
                      ? <CheckCircleIcon color="success" fontSize="small" />
                      : <RadioButtonUncheckedIcon color="disabled" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ textDecoration: task.status === 'Completed' ? 'line-through' : 'none', color: task.status === 'Completed' ? 'text.disabled' : 'text.primary' }}
                      >
                        {task.title}
                      </Typography>
                    }
                    secondary={task.description}
                  />
                </ListItem>
                {idx < record.tasks.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Exit interview data if present */}
        {(record?.exitInterviewScore || record?.exitInterviewComments) && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Exit Interview</Typography>
            {record.exitInterviewScore && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Satisfaction:</Typography>
                <Rating value={record.exitInterviewScore} readOnly size="small" max={5} />
              </Box>
            )}
            {record.exitInterviewComments && (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
                <Typography variant="body2" color="text.secondary">{record.exitInterviewComments}</Typography>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
        {record?.status === 'InProgress' && pct === 100 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<PersonRemoveIcon />}
            onClick={() => onFinalize(record.id)}
            disabled={finalizePending}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            {finalizePending ? 'Finalizing…' : 'Finalize & Deactivate'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ── Offboarding Card ───────────────────────────────────────────────────────
const OffboardingCard: React.FC<{
  record: any;
  onView: (r: any) => void;
}> = ({ record, onView }) => {
  const emp = record.employee;
  const pct = calcProgress(record.tasks);
  const initials = `${emp?.firstName?.[0] || ''}${emp?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3, border: '1px solid #eef2ff', p: 2.5,
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#1e293b', width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
              {emp?.firstName} {emp?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {emp?.position?.name || '—'}
            </Typography>
          </Box>
        </Box>
        <Chip label={record.status} size="small" color={statusColor(record.status) as any} sx={{ fontWeight: 700 }} />
      </Box>

      <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>INITIATED</Typography>
          <Typography variant="body2" fontWeight={700}>
            {new Date(record.initiationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Typography>
        </Box>
        {record.plannedLastDate && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>LAST DAY</Typography>
            <Typography variant="body2" fontWeight={700}>
              {new Date(record.plannedLastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Typography>
          </Box>
        )}
        {record.reason && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>REASON</Typography>
            <Typography variant="body2" fontWeight={700}>{record.reason}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {record.tasks.filter((t: any) => t.status === 'Completed').length}/{record.tasks.length} tasks
          </Typography>
          <Typography variant="caption" fontWeight={700}>{pct}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button size="small" variant="outlined" startIcon={<VisibilityIcon />}
          onClick={() => onView(record)} sx={{ borderRadius: 2, fontWeight: 600 }}>
          View Checklist
        </Button>
      </Box>
    </Paper>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
const Offboarding: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [initiateOpen, setInitiateOpen]   = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: '', plannedLastDate: '', reason: '', notes: '',
    exitInterviewScore: 0, exitInterviewComments: '',
  });

  useEffect(() => {
    const empId = searchParams.get('employeeId');
    if (empId) { setForm(f => ({ ...f, employeeId: empId })); setInitiateOpen(true); }
  }, [searchParams]);

  const { data: offboardings = [], isLoading } = useQuery({
    queryKey: ['offboardings'],
    queryFn: async () => (await api.get('/api/offboarding')).data,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async () => (await api.get('/api/employees?isActive=true')).data,
  });

  const initiateMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/offboarding/initiate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
      setInitiateOpen(false);
      setForm({ employeeId: '', plannedLastDate: '', reason: '', notes: '', exitInterviewScore: 0, exitInterviewComments: '' });
      setMutationError(null);
    },
    onError: (e: any) => setMutationError(e?.response?.data?.error || 'Failed to initiate offboarding'),
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: number) => api.patch(`/api/offboarding/tasks/${taskId}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['offboardings'] }),
    onError: (e: any) => setMutationError(e?.response?.data?.error || 'Failed to complete task'),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/offboarding/${id}/finalize`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
      setSelectedRecord(null);
      setMutationError(null);
    },
    onError: (e: any) => setMutationError(e?.response?.data?.error || 'Failed to finalize'),
  });

  const handleInitiate = () => {
    if (!form.employeeId) { setMutationError('Please select an employee'); return; }
    setMutationError(null);
    initiateMutation.mutate({
      employeeId: form.employeeId,
      plannedLastDate: form.plannedLastDate || undefined,
      reason: form.reason || undefined,
      notes: form.notes || undefined,
    });
  };

  // Keep selectedRecord in sync with fresh query data
  const freshRecord = selectedRecord
    ? (offboardings as any[]).find((r: any) => r.id === selectedRecord.id)
    : null;

  const filtered = (offboardings as any[]).filter((r: any) => {
    const name = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) && (filterStatus === '' || r.status === filterStatus);
  });

  const inProgress = (offboardings as any[]).filter((r: any) => r.status === 'InProgress').length;
  const completed  = (offboardings as any[]).filter((r: any) => r.status === 'Completed').length;
  const cancelled  = (offboardings as any[]).filter((r: any) => r.status === 'Cancelled').length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">Offboarding</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage employee separation processes
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setInitiateOpen(true)}
          sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}>
          Initiate Offboarding
        </Button>
      </Box>

      {/* ── Summary ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'In Progress', value: inProgress, color: '#f59e0b', icon: <ExitToAppIcon /> },
          { label: 'Completed',   value: completed,  color: '#10b981', icon: <AssignmentTurnedInIcon /> },
          { label: 'Cancelled',   value: cancelled,  color: '#ef4444', icon: <CancelIcon /> },
        ].map(s => (
          <Paper key={s.label} elevation={0}
            onClick={() => setFilterStatus(filterStatus === s.label.replace(' ', '') ? '' : s.label.replace(' ', ''))}
            sx={{ flex: '1 1 140px', p: 2, borderRadius: 3, cursor: 'pointer',
              border: '2px solid', borderColor: '#eef2ff',
              display: 'flex', alignItems: 'center', gap: 1.5,
              '&:hover': { borderColor: s.color } }}>
            <Avatar sx={{ bgcolor: `${s.color}15`, color: s.color, width: 36, height: 36, borderRadius: 2 }}>{s.icon}</Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1e293b">{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ── Toolbar ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search employee…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ flex: '1 1 220px', maxWidth: 320 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
            sx: { borderRadius: 2.5 },
          }}
        />
        <TextField select label="Status" value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)} size="small" sx={{ minWidth: 150 }}
          SelectProps={{ sx: { borderRadius: 2.5 } }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="InProgress">In Progress</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="Cancelled">Cancelled</MenuItem>
        </TextField>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {mutationError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setMutationError(null)}>{mutationError}</Alert>}

      {/* ── Grid ── */}
      {isLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 2.5 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: 3 }} />)}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #e2e8f0', borderRadius: 3 }}>
          <PeopleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">
            {search || filterStatus ? 'No records match your filters' : 'No offboarding records yet'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 2.5 }}>
          {filtered.map((r: any) => (
            <OffboardingCard key={r.id} record={r} onView={setSelectedRecord} />
          ))}
        </Box>
      )}

      {/* ── Initiate Dialog ── */}
      <Dialog open={initiateOpen} onClose={() => setInitiateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Initiate Offboarding
            <IconButton size="small" onClick={() => setInitiateOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField select label="Employee" value={form.employeeId}
              onChange={e => setForm({ ...form, employeeId: e.target.value })} fullWidth required>
              {(employees as any[]).map((emp: any) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                  {emp.position?.name ? ` — ${emp.position.name}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Reason for Separation" value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })} fullWidth>
              <MenuItem value="">— Select reason —</MenuItem>
              <MenuItem value="Resignation">Resignation</MenuItem>
              <MenuItem value="Termination">Termination</MenuItem>
              <MenuItem value="Retirement">Retirement</MenuItem>
              <MenuItem value="Contract End">Contract End</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField label="Planned Last Working Day" type="date" fullWidth
              InputLabelProps={{ shrink: true }} value={form.plannedLastDate}
              onChange={e => setForm({ ...form, plannedLastDate: e.target.value })} />
            <TextField label="Notes (optional)" multiline rows={3} fullWidth value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInitiateOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleInitiate}
            disabled={initiateMutation.isPending} sx={{ borderRadius: 2, fontWeight: 700 }}>
            {initiateMutation.isPending ? 'Initiating…' : 'Start Process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Detail Dialog ── */}
      {freshRecord && (
        <DetailDialog
          record={freshRecord}
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onCompleteTask={(id) => completeTaskMutation.mutate(id)}
          onFinalize={(id) => finalizeMutation.mutate(id)}
          taskPending={completeTaskMutation.isPending}
          finalizePending={finalizeMutation.isPending}
        />
      )}
    </Box>
  );
};

export default Offboarding;
