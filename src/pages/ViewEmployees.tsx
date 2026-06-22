import React from 'react';
import { Button, Stack, Typography, Chip, IconButton, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper, Tooltip } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listEmployees, activateEmployee, deactivateEmployee } from '../api/employeeApi';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import DescriptionIcon from '@mui/icons-material/Description';
import PaidIcon from '@mui/icons-material/Paid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import DevicesIcon from '@mui/icons-material/Devices';

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

  const getName = (value: unknown) => {
    if (!value) return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && 'name' in value) return String((value as { name?: string }).name || '-');
    return '-';
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Employees</Typography>
        <Button variant="contained" onClick={() => navigate('/employees/create')}>Create Employee</Button>
      </Stack>
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 1, overflowX: 'auto' }}>
        <Table size="small" stickyHeader sx={{ minWidth: 1120 }}>
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
                <TableCell>{getName(e.department)}</TableCell>
                <TableCell>{getName(e.position)}</TableCell>
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
                  <Tooltip title="Onboarding">
                    <IconButton color="primary" onClick={() => navigate(`/onboarding?employeeId=${e.id}`)}>
                      <AssignmentTurnedInIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Documents">
                    <IconButton color="primary" onClick={() => navigate('/document-management')}>
                      <DescriptionIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Assets">
                    <IconButton color="primary" onClick={() => navigate(`/asset-management?employeeId=${e.id}`)}>
                      <DevicesIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Payroll">
                    <IconButton color="primary" onClick={() => navigate('/payroll')}>
                      <PaidIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Attendance">
                    <IconButton color="primary" onClick={() => navigate('/attendance')}>
                      <AccessTimeIcon />
                    </IconButton>
                  </Tooltip>
                  {e.userId && (
                    <Tooltip title="Create Evaluation">
                      <IconButton color="primary" onClick={() => navigate('/evaluations/create')}>
                        <RateReviewIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Offboarding">
                    <IconButton color="warning" onClick={() => navigate(`/offboarding?employeeId=${e.id}`)}>
                      <PersonRemoveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Employee">
                    <IconButton color="primary" onClick={() => navigate(`/employees/${e.id}/edit`)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
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


