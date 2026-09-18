import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import type { User } from '../types/interfaces';

const toBool = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, py: 0.75 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130, fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
  </Box>
);

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', id],
    queryFn: async () => (await api.get(`/api/users/${id}`)).data,
    enabled: !!id,
  });

  // Try to find linked employee record
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-link', id],
    queryFn: async () => (await api.get('/api/employees')).data,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const linkedEmployee = employees.find((e: any) => e.userId === user?.id);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  };

  if (isLoading) return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
    </Container>
  );

  if (error || !user) return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Alert severity="error">Failed to load user. Please try again.</Alert>
      <Button onClick={() => navigate('/users/view')} sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
        Back to Users
      </Button>
    </Container>
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/users/view')}
          variant="text"
          sx={{ color: 'text.secondary' }}
        >
          Users
        </Button>
        <Tooltip title="Edit User">
          <IconButton
            onClick={() => navigate(`/users/view`)}
            sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #eef2ff' }}>
        {/* Profile banner */}
        <Box sx={{
          height: 100,
          background: 'linear-gradient(135deg, #1e3a5f 0%, #6366f1 100%)',
          borderRadius: '12px 12px 0 0',
        }} />

        <CardContent sx={{ pt: 0, px: 4, pb: 4 }}>
          {/* Avatar + name */}
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: -5, mb: 3 }}>
            <Avatar
              sx={{
                width: 80, height: 80,
                bgcolor: '#1e293b',
                fontSize: 28, fontWeight: 700,
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              }}
            >
              {getInitials(user.fullName)}
            </Avatar>
            <Box sx={{ pb: 0.5 }}>
              <Typography variant="h5" fontWeight={800} color="#1e293b">{user.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">@{user.userName}</Typography>
            </Box>
          </Box>

          {/* Status chips */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
            <Chip
              label={user.role}
              size="small"
              sx={{ fontWeight: 700, bgcolor: '#eef2ff', color: '#6366f1' }}
            />
            <Chip
              size="small"
              label={toBool(user.activeStatus) ? 'Active' : 'Inactive'}
              color={toBool(user.activeStatus) ? 'success' : 'default'}
              sx={{ fontWeight: 600 }}
            />
            {toBool(user.locked) && (
              <Chip
                size="small"
                icon={<LockIcon sx={{ fontSize: 14 }} />}
                label="Locked"
                color="error"
                sx={{ fontWeight: 600 }}
              />
            )}
            {toBool(user.isFirstLogin) && (
              <Chip
                size="small"
                label="First Login Pending"
                color="warning"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Info grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            {/* Account details */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                Account
              </Typography>
              <InfoRow label="User ID" value={`#${user.id}`} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Gender" value={user.gender} />
              <InfoRow label="Age" value={user.age} />
              <InfoRow label="Created" value={new Date(user.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} />
            </Box>

            {/* Organisation */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                Organisation
              </Typography>
              <InfoRow
                label="Department"
                value={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BusinessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    {(user as any).department?.name || '—'}
                  </Box>
                }
              />
              <InfoRow
                label="Position"
                value={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WorkIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    {(user as any).position?.name || '—'}
                  </Box>
                }
              />
              <InfoRow label="Status" value={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {toBool(user.activeStatus)
                    ? <><CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} /> Active</>
                    : <><LockOpenIcon sx={{ fontSize: 14 }} /> Inactive</>
                  }
                </Box>
              } />
            </Box>
          </Box>

          {/* Linked employee */}
          {linkedEmployee && (
            <>
              <Divider sx={{ my: 3 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
                  Linked HR Record
                </Typography>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #eef2ff',
                    cursor: 'pointer', '&:hover': { bgcolor: '#f1f5f9' },
                  }}
                  onClick={() => navigate(`/employees/${linkedEmployee.id}/profile`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccountCircleIcon sx={{ color: '#6366f1' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {linkedEmployee.firstName} {linkedEmployee.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Employee #{linkedEmployee.id} · {linkedEmployee.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip size="small" label="View 360° Profile" color="primary" variant="outlined" />
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default UserDetail;
