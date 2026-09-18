import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Skeleton,
  InputAdornment,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { format, differenceInDays, isPast } from 'date-fns';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerIcon from '@mui/icons-material/Timer';
import PeopleIcon from '@mui/icons-material/People';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

// ── helpers ────────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  switch (s) {
    case 'Passed':   return 'success';
    case 'Failed':   return 'error';
    case 'Extended': return 'warning';
    case 'Active':   return 'primary';
    default:         return 'default';
  }
};

const daysLeft = (endDate: string) => {
  const d = differenceInDays(new Date(endDate), new Date());
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, overdue: true, pct: 100 };
  return { label: `${d}d left`, overdue: false, pct: undefined };
};

const progressPct = (startDate: string, endDate: string) => {
  const total = differenceInDays(new Date(endDate), new Date(startDate));
  const elapsed = differenceInDays(new Date(), new Date(startDate));
  return Math.min(100, Math.max(0, Math.round((elapsed / Math.max(total, 1)) * 100)));
};

// ── Evaluate Dialog ────────────────────────────────────────────────────────
const EvaluateDialog: React.FC<{
  open: boolean;
  probation: any;
  onClose: () => void;
  onSave: (data: { status: string; feedback: string; evaluation: string }) => void;
  isPending: boolean;
}> = ({ open, probation, onClose, onSave, isPending }) => {
  const [form, setForm] = useState({ status: '', feedback: '', evaluation: '' });

  const handleSubmit = () => {
    if (!form.status) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Evaluate Probation — {probation?.onboarding?.employee?.firstName} {probation?.onboarding?.employee?.lastName}
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            select
            label="Outcome"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value })}
            fullWidth
            required
          >
            <MenuItem value="Passed">✅ Passed — Employee confirmed permanent</MenuItem>
            <MenuItem value="Failed">❌ Failed — Employment ends</MenuItem>
            <MenuItem value="Extended">⏳ Extended — Additional review period</MenuItem>
          </TextField>
          <TextField
            label="Evaluation Summary"
            value={form.evaluation}
            onChange={e => setForm({ ...form, evaluation: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="Summary of performance during probation period…"
          />
          <TextField
            label="Feedback for Employee"
            value={form.feedback}
            onChange={e => setForm({ ...form, feedback: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="Constructive feedback that will be visible to the employee…"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!form.status || isPending}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {isPending ? 'Saving…' : 'Submit Evaluation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Probation Card ─────────────────────────────────────────────────────────
const ProbationCard: React.FC<{
  row: any;
  onEvaluate: (row: any) => void;
  onViewOnboarding: (employeeId: number) => void;
}> = ({ row, onEvaluate, onViewOnboarding }) => {
  const emp = row.onboarding?.employee;
  const name = emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  const initials = emp ? `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase() : '?';
  const dept = emp?.department?.name || '—';
  const pos  = emp?.position?.name  || '—';
  const { label: daysLabel, overdue } = daysLeft(row.endDate);
  const pct = progressPct(row.startDate, row.endDate);
  const isActive = row.status === 'Active';

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: overdue && isActive ? '#fca5a5' : '#eef2ff',
        p: 2.5,
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
        bgcolor: overdue && isActive ? '#fff7f7' : 'white',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#1e293b', width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#1e293b">{name}</Typography>
            <Typography variant="caption" color="text.secondary">{pos} · {dept}</Typography>
          </Box>
        </Box>
        <Chip
          label={row.status}
          size="small"
          color={statusColor(row.status) as any}
          sx={{ fontWeight: 700 }}
        />
      </Box>

      {/* Dates */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>START</Typography>
          <Typography variant="body2" fontWeight={700}>{format(new Date(row.startDate), 'MMM dd, yyyy')}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>REVIEW DATE</Typography>
          <Typography variant="body2" fontWeight={700}>{format(new Date(row.endDate), 'MMM dd, yyyy')}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>TIME</Typography>
          <Typography
            variant="body2"
            fontWeight={700}
            color={overdue && isActive ? 'error.main' : 'text.primary'}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {overdue && isActive && <WarningAmberIcon sx={{ fontSize: 14 }} />}
            {daysLabel}
          </Typography>
        </Box>
      </Box>

      {/* Progress bar (only for active) */}
      {isActive && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Time elapsed</Typography>
            <Typography variant="caption" fontWeight={700}>{pct}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 6, borderRadius: 3,
              bgcolor: '#f1f5f9',
              '& .MuiLinearProgress-bar': { bgcolor: overdue ? '#ef4444' : '#6366f1', borderRadius: 3 },
            }}
          />
        </Box>
      )}

      {/* Feedback snippet */}
      {row.feedback && (
        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, borderLeft: '3px solid #6366f1' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>FEEDBACK</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }} noWrap>{row.feedback}</Typography>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {emp?.id && (
          <Tooltip title="View Onboarding">
            <IconButton size="small" onClick={() => onViewOnboarding(emp.id)} sx={{ color: '#6366f1' }}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {isActive && (
          <Button
            size="small"
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={() => onEvaluate(row)}
            sx={{ borderRadius: 2, fontWeight: 700, fontSize: 12 }}
          >
            Evaluate
          </Button>
        )}
      </Box>
    </Paper>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
const ProbationManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [evaluating, setEvaluating]       = useState<any>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: probations = [], isLoading } = useQuery({
    queryKey: ['probations'],
    queryFn: async () => (await api.get('/api/probation')).data,
  });

  const evaluateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) =>
      (await api.post(`/api/probation/${id}/evaluate`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['probations'] });
      setEvaluating(null);
      setMutationError(null);
    },
    onError: (e: any) => setMutationError(e?.response?.data?.message || 'Failed to save evaluation'),
  });

  const filtered = (probations as any[]).filter(p => {
    const name = `${p.onboarding?.employee?.firstName || ''} ${p.onboarding?.employee?.lastName || ''}`.toLowerCase();
    return (
      name.includes(search.toLowerCase()) &&
      (filterStatus === '' || p.status === filterStatus)
    );
  });

  const active   = (probations as any[]).filter(p => p.status === 'Active').length;
  const overdue  = (probations as any[]).filter(p => p.status === 'Active' && isPast(new Date(p.endDate))).length;
  const passed   = (probations as any[]).filter(p => p.status === 'Passed').length;
  const extended = (probations as any[]).filter(p => p.status === 'Extended').length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#1e293b">Probation Reviews</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Track and evaluate employees currently in their probation period
        </Typography>
      </Box>

      {/* ── Summary ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Active',    value: active,   color: '#6366f1', icon: <HourglassEmptyIcon /> },
          { label: 'Overdue',   value: overdue,  color: '#ef4444', icon: <WarningAmberIcon /> },
          { label: 'Passed',    value: passed,   color: '#10b981', icon: <CheckCircleIcon /> },
          { label: 'Extended',  value: extended, color: '#f59e0b', icon: <TimerIcon /> },
        ].map(s => (
          <Paper
            key={s.label}
            elevation={0}
            onClick={() => setFilterStatus(filterStatus === s.label ? '' : s.label)}
            sx={{
              flex: '1 1 140px', p: 2, borderRadius: 3, cursor: 'pointer',
              border: '2px solid',
              borderColor: filterStatus === s.label ? s.color : '#eef2ff',
              display: 'flex', alignItems: 'center', gap: 1.5,
              transition: 'all 0.2s',
              '&:hover': { borderColor: s.color },
            }}
          >
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

      {/* ── Filters ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ flex: '1 1 220px', maxWidth: 340 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
            sx: { borderRadius: 2.5 },
          }}
        />
        <TextField
          select
          label="Status"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          size="small"
          sx={{ minWidth: 160 }}
          SelectProps={{ sx: { borderRadius: 2.5 } }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Passed">Passed</MenuItem>
          <MenuItem value="Failed">Failed</MenuItem>
          <MenuItem value="Extended">Extended</MenuItem>
        </TextField>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', alignSelf: 'center' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}

      {/* ── Grid ── */}
      {isLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 2.5 }}>
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rounded" height={220} sx={{ borderRadius: 3 }} />)}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #e2e8f0', borderRadius: 3 }}>
          <PeopleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">
            {search || filterStatus ? 'No probation records match your filters' : 'No probation records found'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 2.5 }}>
          {filtered.map((row: any) => (
            <ProbationCard
              key={row.id}
              row={row}
              onEvaluate={setEvaluating}
              onViewOnboarding={(empId) => navigate(`/onboarding?employeeId=${empId}`)}
            />
          ))}
        </Box>
      )}

      {/* ── Evaluate Dialog ── */}
      <EvaluateDialog
        open={!!evaluating}
        probation={evaluating}
        onClose={() => setEvaluating(null)}
        onSave={(data) => evaluateMutation.mutate({ id: evaluating.id, ...data })}
        isPending={evaluateMutation.isPending}
      />
    </Box>
  );
};

export default ProbationManagement;
