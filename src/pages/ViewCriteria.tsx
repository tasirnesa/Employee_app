import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Skeleton,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VerifiedIcon from '@mui/icons-material/Verified';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import type { EvaluationCriteria } from '../types/interfaces';
import { useUser } from '../context/UserContext';

const ViewCriteria: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isEmployee = user?.role === 'Employee';

  const [search, setSearch]           = useState('');
  const [detailOpen, setDetailOpen]   = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [authorizeOpen, setAuthorizeOpen] = useState(false);
  const [selected, setSelected]       = useState<EvaluationCriteria | null>(null);
  const [editForm, setEditForm]       = useState({ title: '', description: '' });
  const [mutationError, setMutationError] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: criteria = [], isLoading, error: fetchError } = useQuery<EvaluationCriteria[]>({
    queryKey: ['criteria'],
    queryFn: async () => (await api.get('/api/criteria')).data,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.put(`/api/criteria/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
      setEditOpen(false);
      setMutationError(null);
    },
    onError: (e: any) => setMutationError(e?.response?.data?.error || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/criteria/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
      setDeleteOpen(false);
      setMutationError(null);
    },
    onError: (e: any) => setMutationError(e?.response?.data?.error || 'Failed to delete'),
  });

  const authorizeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/criteria/${id}/authorize`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
      setAuthorizeOpen(false);
      setMutationError(null);
    },
    onError: (e: any) => setMutationError(e?.response?.data?.error || 'Failed to authorize'),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openEdit = (c: EvaluationCriteria) => {
    setSelected(c);
    setEditForm({ title: c.title, description: c.description || '' });
    setMutationError(null);
    setEditOpen(true);
  };

  const filtered = criteria.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">Evaluation Criteria</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {criteria.length} criteria defined
          </Typography>
        </Box>
        {!isEmployee && (
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => navigate('/criteria/create')}
            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}>
            Create Criteria
          </Button>
        )}
      </Box>

      {/* ── Search ── */}
      <TextField
        placeholder="Search criteria…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 3, maxWidth: 360 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>,
          sx: { borderRadius: 2.5 },
        }}
      />

      {fetchError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load criteria</Alert>}

      {/* ── Table ── */}
      {isLoading ? (
        <Stack spacing={1}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, border: '1px dashed #e2e8f0', borderRadius: 3 }}>
          <Typography color="text.secondary">
            {search ? 'No criteria match your search' : 'No criteria defined yet'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0}
          sx={{ border: '1px solid #eef2ff', borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f8faff', fontWeight: 700, color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 } }}>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                {!isEmployee && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.criteriaID} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">#{c.criteriaID}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{c.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                      {c.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {(c as any).creator?.fullName || `User #${c.createdBy}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.isAuthorized ? 'Authorized' : 'Pending'}
                      size="small"
                      color={c.isAuthorized ? 'success' : 'warning'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  {!isEmployee && (
                    <TableCell align="right">
                      <Tooltip title="Details">
                        <IconButton size="small" onClick={() => { setSelected(c); setDetailOpen(true); }}
                          sx={{ color: '#6366f1' }}>
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: '#f59e0b' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!c.isAuthorized && (
                        <Tooltip title="Authorize">
                          <IconButton size="small"
                            onClick={() => { setSelected(c); setMutationError(null); setAuthorizeOpen(true); }}
                            sx={{ color: '#10b981' }}>
                            <VerifiedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small"
                          onClick={() => { setSelected(c); setMutationError(null); setDeleteOpen(true); }}
                          sx={{ color: '#ef4444' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Criteria Details
            <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {selected && (
            <Stack spacing={1.5}>
              {[
                { label: 'ID',          value: `#${selected.criteriaID}` },
                { label: 'Title',       value: selected.title },
                { label: 'Description', value: selected.description || '—' },
                { label: 'Created By',  value: (selected as any).creator?.fullName || `User #${selected.createdBy}` },
                { label: 'Created',     value: new Date(selected.createdDate).toLocaleString() },
                { label: 'Status',      value: selected.isAuthorized ? 'Authorized' : 'Pending Authorization' },
                ...(selected.isAuthorized ? [
                  { label: 'Authorized By',   value: selected.authorizedBy ? `User #${selected.authorizedBy}` : '—' },
                  { label: 'Authorized Date', value: selected.authorizedDate ? new Date(selected.authorizedDate).toLocaleString() : '—' },
                ] : []),
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130, fontWeight: 600 }}>{label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Edit Criteria
            <IconButton size="small" onClick={() => setEditOpen(false)}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Title" value={editForm.title} fullWidth required autoFocus
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            <TextField label="Description" value={editForm.description} fullWidth multiline rows={3}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" sx={{ borderRadius: 2, fontWeight: 700 }}
            disabled={!editForm.title.trim() || updateMutation.isPending}
            onClick={() => selected && updateMutation.mutate({
              id: selected.criteriaID,
              data: { title: editForm.title.trim(), description: editForm.description.trim() || null },
            })}>
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Delete Criteria?</DialogTitle>
        <DialogContent>
          {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{selected?.title}</strong>?
            This will fail if the criteria is used in existing evaluations.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" color="error" sx={{ borderRadius: 2, fontWeight: 700 }}
            disabled={deleteMutation.isPending}
            onClick={() => selected && deleteMutation.mutate(selected.criteriaID)}>
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Authorize Dialog ── */}
      <Dialog open={authorizeOpen} onClose={() => setAuthorizeOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Authorize Criteria?</DialogTitle>
        <DialogContent>
          {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Authorize <strong>{selected?.title}</strong>? Once authorized, this criteria can be used in evaluations.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAuthorizeOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" color="success" sx={{ borderRadius: 2, fontWeight: 700 }}
            disabled={authorizeMutation.isPending}
            onClick={() => selected && authorizeMutation.mutate(selected.criteriaID)}>
            {authorizeMutation.isPending ? 'Authorizing…' : 'Authorize'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewCriteria;
