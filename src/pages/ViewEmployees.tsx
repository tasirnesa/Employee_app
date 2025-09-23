import React from 'react';
import { Button, Stack, Typography, Chip, IconButton } from '@mui/material';
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
      <Stack spacing={1}>
        {data?.map((e) => (
          <Stack key={e.id} direction="row" alignItems="center" spacing={2} sx={{ border: '1px solid #eee', p: 1, borderRadius: 1 }}>
            <Stack flex={1}>
              <Typography fontWeight={600}>{e.firstName} {e.lastName}</Typography>
              <Typography variant="body2">{e.email}</Typography>
              <Typography variant="body2" color="text.secondary">{e.department || '-'} • {e.position || '-'}</Typography>
            </Stack>
            <Chip label={e.isActive ? 'Active' : 'Inactive'} color={e.isActive ? 'success' : 'default'} />
            {e.isActive ? (
              <Button size="small" variant="outlined" color="warning" onClick={() => deactivate.mutate(e.id)}>Deactivate</Button>
            ) : (
              <Button size="small" variant="outlined" color="success" onClick={() => activate.mutate(e.id)}>Activate</Button>
            )}
            <IconButton color="primary" onClick={() => navigate(`/employees/${e.id}/edit`)}>
              <EditIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};

export default ViewEmployees;


