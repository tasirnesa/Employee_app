import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Stack, Button, Chip, Avatar, IconButton, Tooltip,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Pagination, Skeleton, Alert, Menu, ListItemIcon, ListItemText,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listEmployees, activateEmployee, deactivateEmployee } from '../api/employeeApi';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PaidIcon from '@mui/icons-material/Paid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import RateReviewIcon from '@mui/icons-material/RateReview';
import DevicesIcon from '@mui/icons-material/Devices';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Employee } from '../types/interfaces';

const ROWS_PER_PAGE  = 15;
const CARDS_PER_PAGE = 12;

const getName = (v: unknown): string => {
  if (!v) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && 'name' in (v as any)) return (v as any).name || '—';
  return '—';
};

const initials = (e: Employee) =>
  `${e.firstName?.[0] || ''}${e.lastName?.[0] || ''}`.toUpperCase() || '?';

const DEPT_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#0ea5e9','#8b5cf6'];
const avatarColor = (name: string) => DEPT_COLORS[name.charCodeAt(0) % DEPT_COLORS.length];

// ── Employee action menu ───────────────────────────────────────────────────
const EmployeeMenu: React.FC<{
  employee: Employee;
  onActivate: () => void;
  onDeactivate: () => void;
}> = ({ employee, onActivate, onDeactivate }) => {
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const e = employee as any;

  const close = () => setAnchor(null);
  const go = (path: string) => { close(); navigate(path); };

  return (
    <>
      <IconButton size="small" onClick={(ev) => setAnchor(ev.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={open} onClose={close}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 200, border: '1px solid #eef2ff' } }}>
        <MenuItem onClick={() => go(`/employees/${e.id}/profile`)}>
          <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
          <ListItemText>360° Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go(`/employees/${e.id}/edit`)}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go(`/onboarding?employeeId=${e.id}`)}>
          <ListItemIcon><AssignmentTurnedInIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Onboarding</ListItemText>
        </MenuItem>
        {e.userId && (
          <MenuItem onClick={() => go(`/evaluations/create?evaluateeId=${e.userId}`)}>
            <ListItemIcon><RateReviewIcon fontSize="small" color="primary" /></ListItemIcon>
            <ListItemText>Create Evaluation</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => go(e.userId ? `/payroll?userId=${e.userId}` : '/payroll')}>
          <ListItemIcon><PaidIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Payroll</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go(e.userId ? `/attendance?userId=${e.userId}` : '/attendance')}>
          <ListItemIcon><AccessTimeIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Attendance</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go(`/document-management?employeeId=${e.id}`)}>
          <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Documents</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go(`/asset-management?employeeId=${e.id}`)}>
          <ListItemIcon><DevicesIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Assets</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => go(`/offboarding?employeeId=${e.id}`)}>
          <ListItemIcon><PersonRemoveIcon fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>Offboarding</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => { close(); e.isActive ? onDeactivate() : onActivate(); }}
          sx={{ color: e.isActive ? 'warning.main' : 'success.main' }}
        >
          <ListItemIcon>
            {e.isActive
              ? <PersonRemoveIcon fontSize="small" color="warning" />
              : <CheckCircleIcon fontSize="small" color="success" />}
          </ListItemIcon>
          <ListItemText>{e.isActive ? 'Deactivate' : 'Activate'}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

// ── Employee Card ──────────────────────────────────────────────────────────
const EmployeeCard: React.FC<{
  employee: Employee;
  onActivate: () => void;
  onDeactivate: () => void;
}> = ({ employee, onActivate, onDeactivate }) => {
  const navigate = useNavigate();
  const e = employee as any;
  const color = avatarColor(e.firstName || 'A');

  return (
    <Paper elevation={0} sx={{
      borderRadius: 3, border: '1px solid #eef2ff', p: 2.5, position: 'relative',
      transition: 'all 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', borderColor: color },
      cursor: 'pointer',
    }}
      onClick={() => navigate(`/employees/${e.id}/profile`)}
    >
      {/* Status dot */}
      <Box sx={{
        position: 'absolute', top: 12, right: 42,
        width: 8, height: 8, borderRadius: '50%',
        bgcolor: e.isActive ? '#10b981' : '#94a3b8',
      }} />

      {/* Menu */}
      <Box sx={{ position: 'absolute', top: 6, right: 4 }}
        onClick={ev => ev.stopPropagation()}>
        <EmployeeMenu employee={employee} onActivate={onActivate} onDeactivate={onDeactivate} />
      </Box>

      {/* Avatar + Name */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Avatar src={e.profileImageUrl || undefined}
          sx={{ width: 44, height: 44, bgcolor: color, fontWeight: 700, fontSize: 16 }}>
          {!e.profileImageUrl && initials(employee)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={800} color="#1e293b" noWrap>
            {e.firstName} {e.lastName}
          </Typography>
          {e.employeeNumber && (
            <Typography variant="caption" color="text.disabled">{e.employeeNumber}</Typography>
          )}
        </Box>
      </Stack>

      {/* Details */}
      <Stack spacing={0.5}>
        <Typography variant="caption" color="text.secondary" noWrap>
          🏢 {getName(e.department)}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          💼 {getName(e.position)}
        </Typography>
        {e.contractType && (
          <Typography variant="caption" color="text.secondary" noWrap>
            📋 {e.contractType} · {e.employmentType || '—'}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" noWrap>
          📧 {e.email}
        </Typography>
      </Stack>

      {/* Footer chips */}
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Chip
          label={e.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={e.isActive ? 'success' : 'default'}
          sx={{ fontWeight: 700, fontSize: 11 }}
        />
        {e.hireDate && (
          <Chip
            label={`Since ${new Date(e.hireDate).getFullYear()}`}
            size="small"
            sx={{ bgcolor: '#f1f5f9', fontSize: 11 }}
          />
        )}
      </Stack>
    </Paper>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const ViewEmployees: React.FC = () => {
  const navigate   = useNavigate();
  const qc         = useQueryClient();

  const [search, setSearch]         = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView]             = useState<'grid' | 'list'>('grid');
  const [page, setPage]             = useState(1);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: () => listEmployees(),
  });

  const activate = useMutation({
    mutationFn: (id: number) => activateEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });

  // Unique departments for filter
  const departments = useMemo(() => {
    const names = new Set<string>();
    data.forEach(e => { const n = getName((e as any).department); if (n !== '—') names.add(n); });
    return [...names].sort();
  }, [data]);

  // Filter + search
  const filtered = useMemo(() => data.filter(e => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(s) ||
      e.email.toLowerCase().includes(s) ||
      ((e as any).employeeNumber || '').toLowerCase().includes(s) ||
      getName((e as any).department).toLowerCase().includes(s) ||
      getName((e as any).position).toLowerCase().includes(s);
    const matchDept = !filterDept || getName((e as any).department) === filterDept;
    const matchStatus =
      filterStatus === '' ? true :
      filterStatus === 'active' ? e.isActive :
      !e.isActive;
    return matchSearch && matchDept && matchStatus;
  }), [data, search, filterDept, filterStatus]);

  const perPage   = view === 'grid' ? CARDS_PER_PAGE : ROWS_PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage  = Math.min(page, pageCount);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const handleSearch = (v: string) => { setSearch(v);       setPage(1); };
  const handleDept   = (v: string) => { setFilterDept(v);   setPage(1); };
  const handleStatus = (v: string) => { setFilterStatus(v); setPage(1); };
  const handleView   = (_: any, v: any) => { if (v) { setView(v); setPage(1); } };

  const activeCount   = data.filter(e => e.isActive).length;
  const inactiveCount = data.length - activeCount;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">Employees</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {data.length} total · {activeCount} active · {inactiveCount} inactive
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => navigate('/employees/create')}
          sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}>
          Add Employee
        </Button>
      </Box>

      {/* ── Summary ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',    value: data.length,   color: '#6366f1', icon: <PeopleIcon /> },
          { label: 'Active',   value: activeCount,   color: '#10b981', icon: <CheckCircleIcon /> },
          { label: 'Inactive', value: inactiveCount, color: '#94a3b8', icon: <PersonRemoveIcon /> },
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

      {/* ── Toolbar ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search name, email, ID…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          size="small"
          sx={{ flex: '1 1 220px', maxWidth: 360 }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
              sx: { borderRadius: 2.5 },
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Department</InputLabel>
          <Select value={filterDept} label="Department"
            onChange={e => handleDept(e.target.value as string)} sx={{ borderRadius: 2.5 }}>
            <MenuItem value="">All departments</MenuItem>
            {departments.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} label="Status"
            onChange={e => handleStatus(e.target.value as string)} sx={{ borderRadius: 2.5 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </Typography>
          <ToggleButtonGroup value={view} exclusive onChange={handleView} size="small"
            sx={{ '& .MuiToggleButton-root': { border: '1px solid #eef2ff', borderRadius: '8px !important' } }}>
            <ToggleButton value="grid"><Tooltip title="Card view"><GridViewIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="list"><Tooltip title="Table view"><TableRowsIcon fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load employees</Alert>}

      {/* ── Content ── */}
      {isLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 2.5 }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: 3 }} />)}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #e2e8f0', borderRadius: 3 }}>
          <PeopleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography color="text.secondary">
            {search || filterDept || filterStatus ? 'No employees match your filters' : 'No employees yet'}
          </Typography>
          {!search && !filterDept && !filterStatus && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2, borderRadius: 2 }}
              onClick={() => navigate('/employees/create')}>
              Add First Employee
            </Button>
          )}
        </Box>
      ) : view === 'grid' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 2.5 }}>
          {paginated.map(e => (
            <EmployeeCard key={e.id} employee={e}
              onActivate={() => activate.mutate(e.id)}
              onDeactivate={() => deactivate.mutate(e.id)} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0}
          sx={{ border: '1px solid #eef2ff', borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8faff', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 } }}>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Contract</TableCell>
                <TableCell>Hire Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map(e => {
                const emp = e as any;
                const color = avatarColor(emp.firstName || 'A');
                return (
                  <TableRow key={e.id} hover
                    onClick={() => navigate(`/employees/${e.id}/profile`)}
                    sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={emp.profileImageUrl || undefined}
                          sx={{ width: 32, height: 32, bgcolor: color, fontSize: 12, fontWeight: 700 }}>
                          {!emp.profileImageUrl && initials(e)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {emp.firstName} {emp.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {emp.employeeNumber || emp.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell><Typography variant="body2">{getName(emp.department)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{getName(emp.position)}</Typography></TableCell>
                    <TableCell>
                      {emp.contractType ? (
                        <Chip label={emp.contractType} size="small"
                          sx={{ bgcolor: '#eef2ff', color: '#6366f1', fontWeight: 600, fontSize: 11 }} />
                      ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={e.isActive ? 'Active' : 'Inactive'}
                        color={e.isActive ? 'success' : 'default'} sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right" onClick={ev => ev.stopPropagation()}>
                      <EmployeeMenu employee={e}
                        onActivate={() => activate.mutate(e.id)}
                        onDeactivate={() => deactivate.mutate(e.id)} />
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
            Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length}
          </Typography>
          <Pagination count={pageCount} page={safePage}
            onChange={(_, v) => setPage(v)} size="small" shape="rounded" color="primary" />
        </Box>
      )}
    </Box>
  );
};

export default ViewEmployees;
