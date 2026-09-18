import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Pagination,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import type { Evaluation } from '../types/interfaces';
import { useUser } from '../context/UserContext';

const ROWS_PER_PAGE = 15;

const scoreColor = (score: number) => {
  if (score >= 4) return '#10b981';
  if (score >= 3) return '#6366f1';
  if (score >= 2) return '#f59e0b';
  return '#ef4444';
};

const ViewEvaluations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isEmployee = user?.role === 'Employee';

  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage]           = useState(1);

  const { data: evaluations = [], isLoading, error } = useQuery<Evaluation[]>({
    queryKey: ['evaluations'],
    queryFn: async () => (await api.get('/api/evaluations')).data,
  });

  // Summary stats
  const avgScore = useMemo(() => {
    if (!evaluations.length) return null;
    return null; // scores are in results, not on the evaluation record itself
  }, [evaluations]);

  const uniqueTypes = useMemo(
    () => [...new Set(evaluations.map((e) => e.evaluationType).filter(Boolean))],
    [evaluations]
  );

  const filtered = useMemo(() =>
    evaluations.filter((e) => {
      const searchLower = search.toLowerCase();
      const evaluatorName = (e.evaluator as any)?.fullName || '';
      const evaluateeName = (e.evaluatee as any)?.fullName || '';
      const matchesSearch =
        !search ||
        evaluatorName.toLowerCase().includes(searchLower) ||
        evaluateeName.toLowerCase().includes(searchLower) ||
        (e.evaluationType || '').toLowerCase().includes(searchLower) ||
        String(e.evaluationID).includes(search);
      const matchesType = !filterType || e.evaluationType === filterType;
      return matchesSearch && matchesType;
    }),
    [evaluations, search, filterType]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage  = Math.min(page, pageCount);
  const paginated = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleType   = (v: string) => { setFilterType(v); setPage(1); };

  const initials = (name?: string) =>
    (name || 'U').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">Evaluations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {evaluations.length} total evaluation{evaluations.length !== 1 ? 's' : ''} recorded
          </Typography>
        </Box>
        {!isEmployee && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/evaluations/create')}
            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
          >
            New Evaluation
          </Button>
        )}
      </Box>

      {/* ── Summary chips ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: evaluations.length, color: '#6366f1' },
          { label: 'This month', value: evaluations.filter((e) => {
            const d = new Date(e.evaluationDate);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length, color: '#10b981' },
          { label: 'Types', value: uniqueTypes.length, color: '#f59e0b' },
        ].map((s) => (
          <Paper key={s.label} elevation={0}
            sx={{ px: 2.5, py: 1.5, borderRadius: 3, border: '1px solid #eef2ff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* ── Toolbar ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by name, type or ID…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          size="small"
          sx={{ flex: '1 1 240px', maxWidth: 380 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
            sx: { borderRadius: 2.5 },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Evaluation Type</InputLabel>
          <Select value={filterType} onChange={(e) => handleType(e.target.value as string)}
            label="Evaluation Type" sx={{ borderRadius: 2.5 }}>
            <MenuItem value="">All types</MenuItem>
            {uniqueTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load evaluations</Alert>}

      {/* ── Table ── */}
      {isLoading ? (
        <Stack spacing={1}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #e2e8f0', borderRadius: 3 }}>
          <AssignmentIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">
            {search || filterType ? 'No evaluations match your filters' : 'No evaluations recorded yet'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0}
          sx={{ border: '1px solid #eef2ff', borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8faff', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 } }}>
                <TableCell>ID</TableCell>
                <TableCell>Evaluator</TableCell>
                <TableCell>Evaluatee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((ev) => {
                const evaluatorName = (ev.evaluator as any)?.fullName || String(ev.evaluatorID);
                const evaluateeName = (ev.evaluatee as any)?.fullName || String(ev.evaluateeID);
                return (
                  <TableRow key={ev.evaluationID} hover sx={{ '&:last-child td': { borderBottom: 0 }, cursor: 'pointer' }}
                    onClick={() => navigate(`/evaluations/${ev.evaluationID}`)}>
                    <TableCell>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">#{ev.evaluationID}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: '#6366f1' }}>
                          {initials(evaluatorName)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} noWrap>{evaluatorName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, fontWeight: 700, bgcolor: '#10b981' }}>
                          {initials(evaluateeName)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} noWrap>{evaluateeName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={ev.evaluationType || '—'} size="small"
                        sx={{ bgcolor: '#eef2ff', color: '#6366f1', fontWeight: 600, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">#{ev.sessionID}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(ev.evaluationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/evaluations/${ev.evaluationID}`); }}
                          sx={{ color: '#6366f1' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Pagination ── */}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
          </Typography>
          <Pagination count={pageCount} page={safePage} onChange={(_, v) => setPage(v)}
            size="small" shape="rounded" color="primary" />
        </Box>
      )}
    </Box>
  );
};

export default ViewEvaluations;
