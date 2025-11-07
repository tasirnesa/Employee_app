import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

const Projects: React.FC = () => {
  const qc = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem('userProfile') || '{}');
  const role = (currentUser?.role || '').toLowerCase();
  const isEmployee = role === 'employee';
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'Active',
    managerId: '',
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/api/projects');
      return res.data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-projects'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/users');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        startDate: form.startDate,
        endDate: form.endDate || null,
        status: form.status,
        managerId: parseInt(form.managerId),
      };
      const res = await api.post('/api/projects', payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      setForm({ name: '', description: '', startDate: '', endDate: '', status: 'Active', managerId: '' });
    },
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 8 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Projects</Typography>
      {!isEmployee && (
        <Button variant="contained" sx={{ mb: 2 }} onClick={() => setOpen(true)}>Create Project</Button>
      )}
      <TableContainer component={Paper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((p: any) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.manager?.fullName || `User ${p.managerId}`}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Project</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
          <FormControl fullWidth>
            <InputLabel>Manager</InputLabel>
            <Select label="Manager" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value as string })}>
              {users.map((u: any) => (
                <MenuItem key={u.id} value={String(u.id)}>{u.fullName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth />
          <TextField label="End Date" type="date" InputLabelProps={{ shrink: true }} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth />
          <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => createMutation.mutate()} disabled={!form.name || !form.startDate || !form.managerId || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Projects;


