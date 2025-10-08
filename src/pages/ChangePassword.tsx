import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import api from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const onSubmit = async () => {
    try {
      setError('');
      setSuccess('');
      if (!newPassword || newPassword.length < 8) {
        setError('New password must be at least 8 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const payload: any = { newPassword };
      // For first login, backend allows omitting currentPassword
      if (!user || String(user.isFirstLogin).toLowerCase() !== 'true') {
        payload.currentPassword = currentPassword;
      }
      await api.post('/api/auth/change-password', payload);
      setSuccess('Password changed successfully. Redirecting...');
      // Update local user state so guards stop redirecting
      if (user) {
        const updated = { ...user, isFirstLogin: 'false' as any };
        setUser(updated as any);
        localStorage.setItem('userProfile', JSON.stringify(updated));
      }
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to change password';
      setError(msg);
    }
  };

  const requireCurrent = !user || String(user.isFirstLogin).toLowerCase() !== 'true';

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h5" gutterBottom>
        Change Password
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {String(user?.isFirstLogin).toLowerCase() === 'true'
          ? 'It looks like this is your first login. Please set a new password to continue.'
          : 'Update your account password.'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {requireCurrent && (
          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
          />
        )}
        <TextField
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={onSubmit} size="large">
          Save Password
        </Button>
      </Box>
    </Container>
  );
};

export default ChangePassword;


