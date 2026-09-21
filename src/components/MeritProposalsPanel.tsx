import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import api from '../lib/axios';

interface MeritProposal {
  id: number;
  employeeId: number;
  performanceRating: number;
  meritTier: string;
  bonusPercent: number;
  bonusAmount: number | string;
  salaryIncreasePercent?: number;
  status: string;
  reviewNotes?: string;
  employee?: { fullName: string };
  proposer?: { fullName: string };
  createdAt: string;
}

const statusColor = (s: string) =>
  s === 'Approved' ? 'success' : s === 'Rejected' ? 'error' : 'warning';

const MeritProposalsPanel: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['merit-proposals', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get('/api/hr-integration/merit-proposals', { params });
      return res.data as MeritProposal[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/hr-integration/merit-proposals/${id}/approve`, { applyToCompensation: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merit-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['compensations'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      api.post(`/api/hr-integration/merit-proposals/${id}/reject`, { reviewNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merit-proposals'] });
      setRejectOpen(false);
      setRejectId(null);
      setRejectNotes('');
    },
  });

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Merit proposals are created when an employee scores at or above the configured threshold on an evaluation.
        Approved salary increases update compensation; the merit bonus is applied on the next payroll run.
      </Alert>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>Merit Proposals</Typography>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bonus</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Salary +%</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              {isAdmin && <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}>Loading…</TableCell>
              </TableRow>
            )}
            {!isLoading && proposals.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No merit proposals found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {proposals.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.employee?.fullName || `User #${p.employeeId}`}</TableCell>
                <TableCell>{Number(p.performanceRating).toFixed(1)}/5</TableCell>
                <TableCell>{p.meritTier}</TableCell>
                <TableCell>{p.bonusPercent}% (${Number(p.bonusAmount).toFixed(2)})</TableCell>
                <TableCell>{p.salaryIncreasePercent ?? 0}%</TableCell>
                <TableCell>
                  <Chip label={p.status} size="small" color={statusColor(p.status) as any} />
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    {p.status === 'Pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => approveMutation.mutate(p.id)}
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => {
                            setRejectId(p.id);
                            setRejectOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Merit Proposal</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Notes for employee (optional)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => rejectId && rejectMutation.mutate({ id: rejectId, notes: rejectNotes })}
            disabled={rejectMutation.isPending}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeritProposalsPanel;
