import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
// Removed Grid usage due to type issues; using Stack layout instead
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import type { User } from '../types/interfaces.ts';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.get(`http://localhost:3000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as User;
    },
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  const toBool = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  return (
    <Container sx={{ mt: 8 }} className="user-detail-container">
      <Card className="user-detail-card" elevation={3}>
        {user && (
          <>
            <CardHeader
              avatar={
                <Avatar className="user-avatar" sx={{ bgcolor: '#1976d2' }}>
                  {getInitials(user.fullName)}
                </Avatar>
              }
              title={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BadgeIcon fontSize="small" />
                  <Typography variant="h5" className="user-title">{user.fullName}</Typography>
                </Stack>
              }
              subheader={
                <Stack direction="row" spacing={1} className="user-chips">
                  <Chip size="small" label={user.userName} icon={<PersonIcon />} variant="outlined" />
                  <Chip size="small" label={user.role} className={`role-badge role-${String(user.role).toLowerCase()}`} />
                  <Chip size="small" label={toBool(user.status) ? 'Active' : 'Inactive'} className={toBool(user.status) ? 'chip chip-success' : 'chip chip-warning'} />
                </Stack>
              }
            />
            <Divider />
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography className="user-field"><strong>ID:</strong> {user.id}</Typography>
                  <Typography className="user-field"><strong>Gender:</strong> {user.gender || '—'}</Typography>
                  <Typography className="user-field"><strong>Age:</strong> {user.age ?? '—'}</Typography>
                  <Typography className="user-field"><strong>Created By:</strong> {user.createdBy}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography className="user-field"><strong>Locked:</strong> {toBool(user.locked) ? 'Yes' : 'No'} {toBool(user.locked) ? <LockIcon fontSize="small" className="icon-error" /> : <LockOpenIcon fontSize="small" className="icon-success" />}</Typography>
                  <Typography className="user-field"><strong>First Login:</strong> {toBool(user.isFirstLogin) ? 'Yes' : 'No'}</Typography>
                  <Typography className="user-field"><strong>Active:</strong> {toBool(user.activeStatus) ? 'Yes' : 'No'} {toBool(user.activeStatus) && <CheckCircleIcon fontSize="small" className="icon-success" />}</Typography>
                  <Typography className="user-field"><strong>Created Date:</strong> <EventIcon fontSize="small" /> {new Date(user.createdDate).toLocaleDateString()}</Typography>
                </Box>
              </Stack>
              <Box className="user-actions">
                <Button variant="outlined" onClick={() => navigate('/users/view')}>Back to Users</Button>
              </Box>
            </CardContent>
          </>
        )}
      </Card>
    </Container>
  );
};

export default UserDetail;