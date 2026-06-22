import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import DeleteIcon from '@mui/icons-material/Delete';
import DevicesIcon from '@mui/icons-material/Devices';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { listEmployees } from '../api/employeeApi';
import type { Employee } from '../types/interfaces';

interface EmployeeAsset {
  id: number;
  employeeId: number;
  assetType: string;
  brand?: string;
  serialNumber?: string;
  status: 'Assigned' | 'Returned' | 'Lost' | 'Damaged';
  assignedDate: string;
  returnedDate?: string;
  notes?: string;
}

const AssetManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({
    assetType: '',
    brand: '',
    serialNumber: '',
    notes: '',
  });

  useEffect(() => {
    const employeeId = searchParams.get('employeeId');
    if (employeeId) setSelectedEmployeeId(employeeId);
  }, [searchParams]);

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['employees', 'assets'],
    queryFn: () => listEmployees(true),
  });

  const { data: assets = [], isLoading: assetsLoading, error: assetsError } = useQuery<EmployeeAsset[]>({
    queryKey: ['assets', selectedEmployeeId],
    queryFn: async () => (await api.get(`/api/assets/employee/${selectedEmployeeId}`)).data,
    enabled: !!selectedEmployeeId,
  });

  const assignAssetMutation = useMutation({
    mutationFn: async () => (await api.post(`/api/assets/employee/${selectedEmployeeId}`, assetForm)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', selectedEmployeeId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding', Number(selectedEmployeeId)] });
      setDialogOpen(false);
      setAssetForm({ assetType: '', brand: '', serialNumber: '', notes: '' });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: EmployeeAsset['status'] }) =>
      (await api.patch(`/api/assets/${id}`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', selectedEmployeeId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding', Number(selectedEmployeeId)] });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/assets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', selectedEmployeeId] });
      queryClient.invalidateQueries({ queryKey: ['onboarding', Number(selectedEmployeeId)] });
    },
  });

  const selectedEmployee = employees.find(employee => String(employee.id) === selectedEmployeeId);

  const statusColor = (status: EmployeeAsset['status']) => {
    if (status === 'Assigned') return 'success';
    if (status === 'Returned') return 'default';
    if (status === 'Damaged') return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800}>Asset Management</Typography>
            <Typography color="text.secondary">Assign, return, and track employee equipment.</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!selectedEmployeeId}
            onClick={() => setDialogOpen(true)}
          >
            Assign Asset
          </Button>
        </Stack>

        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <TextField
            select
            fullWidth
            label="Employee"
            value={selectedEmployeeId}
            onChange={(event) => setSelectedEmployeeId(event.target.value)}
            disabled={employeesLoading}
          >
            {employees.map(employee => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} ({employee.email})
              </MenuItem>
            ))}
          </TextField>
        </Paper>

        {assetsError && <Alert severity="error">Unable to load assets for this employee.</Alert>}

        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Asset</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Serial Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Returned</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!selectedEmployeeId ? (
                <TableRow><TableCell colSpan={6} align="center">Select an employee to view assets.</TableCell></TableRow>
              ) : assetsLoading ? (
                <TableRow><TableCell colSpan={6} align="center">Loading assets...</TableCell></TableRow>
              ) : assets.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No assets assigned to {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'this employee'}.</TableCell></TableRow>
              ) : assets.map(asset => (
                <TableRow key={asset.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <DevicesIcon color="primary" />
                      <Box>
                        <Typography fontWeight={700}>{asset.assetType}</Typography>
                        <Typography variant="caption" color="text.secondary">{asset.brand || 'No brand/model'}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{asset.serialNumber || '-'}</TableCell>
                  <TableCell>{asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{asset.returnedDate ? new Date(asset.returnedDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell><Chip size="small" label={asset.status} color={statusColor(asset.status)} /></TableCell>
                  <TableCell align="right">
                    {asset.status === 'Assigned' && (
                      <Tooltip title="Mark returned">
                        <IconButton color="primary" onClick={() => updateAssetMutation.mutate({ id: asset.id, status: 'Returned' })}>
                          <AssignmentReturnIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <TextField
                      select
                      size="small"
                      value={asset.status}
                      onChange={(event) => updateAssetMutation.mutate({ id: asset.id, status: event.target.value as EmployeeAsset['status'] })}
                      sx={{ width: 130, mx: 1 }}
                    >
                      <MenuItem value="Assigned">Assigned</MenuItem>
                      <MenuItem value="Returned">Returned</MenuItem>
                      <MenuItem value="Lost">Lost</MenuItem>
                      <MenuItem value="Damaged">Damaged</MenuItem>
                    </TextField>
                    <Tooltip title="Delete asset">
                      <IconButton color="error" onClick={() => deleteAssetMutation.mutate(asset.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Asset</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Asset Type"
              value={assetForm.assetType}
              onChange={(event) => setAssetForm({ ...assetForm, assetType: event.target.value })}
              placeholder="Laptop, phone, ID card"
              fullWidth
            />
            <TextField
              label="Brand or Model"
              value={assetForm.brand}
              onChange={(event) => setAssetForm({ ...assetForm, brand: event.target.value })}
              fullWidth
            />
            <TextField
              label="Serial Number"
              value={assetForm.serialNumber}
              onChange={(event) => setAssetForm({ ...assetForm, serialNumber: event.target.value })}
              fullWidth
            />
            <TextField
              label="Notes"
              value={assetForm.notes}
              onChange={(event) => setAssetForm({ ...assetForm, notes: event.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!assetForm.assetType || assignAssetMutation.isPending}
            onClick={() => assignAssetMutation.mutate()}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssetManagement;
