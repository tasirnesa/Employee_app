import React from 'react';
import { Button, Stack, Typography, Chip, IconButton, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listEmployees, activateEmployee, deactivateEmployee } from '../api/employeeApi';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';

const ViewEmployees: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['employees'], queryFn: () => listEmployees() });

  const activate = useMutation({
    mutationFn: (id: number) => activateEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });

  if (isLoading) return <Typography>Loading employees...</Typography>;
  if (error) return <Typography color="error">Failed to load employees</Typography>;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Employees</Typography>
        <Button variant="contained" onClick={() => navigate('/employees/create')}>Create Employee</Button>
      </Stack>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 1, overflowX: 'auto' }}>
        <Table size="small" stickyHeader sx={{ minWidth: 960 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Hire Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{e.firstName} {e.lastName}</Typography>
                </TableCell>
                <TableCell>{e.email}</TableCell>
                <TableCell>{e.department || '-'}</TableCell>
                <TableCell>{e.position || '-'}</TableCell>
                <TableCell>{e.phone || '-'}</TableCell>
                <TableCell>{e.hireDate ? new Date(e.hireDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <Chip size="small" label={e.isActive ? 'Active' : 'Inactive'} color={e.isActive ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  {e.isActive ? (
                    <Button size="small" variant="outlined" color="warning" onClick={() => deactivate.mutate(e.id)} sx={{ mr: 1 }}>Deactivate</Button>
                  ) : (
                    <Button size="small" variant="outlined" color="success" onClick={() => activate.mutate(e.id)} sx={{ mr: 1 }}>Activate</Button>
                  )}
                  <IconButton color="primary" onClick={() => navigate(`/employees/${e.id}/edit`)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default ViewEmployees;


