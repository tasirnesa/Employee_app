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

  // Helper function to check if new password differs from old password by at least 4 characters
  const passwordsDifferByAtLeast4Chars = (oldPassword: string, newPassword: string): boolean => {
    if (!oldPassword || !newPassword) return true; // Allow if either is missing
    
    const old = oldPassword.toLowerCase();
    const newPwd = newPassword.toLowerCase();
    
    // Check if passwords are identical
    if (old === newPwd) return false;
    
    // Calculate Levenshtein distance
    const matrix: number[][] = [];
    for (let i = 0; i <= newPwd.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= old.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= newPwd.length; i++) {
      for (let j = 1; j <= old.length; j++) {
        if (newPwd.charAt(i - 1) === old.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[newPwd.length][old.length] >= 4;
  };

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
      
      // Always require current password for validation
      if (!currentPassword) {
        setError('Current password is required');
        return;
      }
      
      // Check if new password differs from current password by at least 4 characters
      if (!passwordsDifferByAtLeast4Chars(currentPassword, newPassword)) {
        setError('New password must differ from current password by at least 4 characters');
        return;
      }
      
      const payload: any = { 
        newPassword,
        currentPassword 
      };
      await api.post('/api/auth/change-password', payload);
      setSuccess('Password changed successfully. Please log in again with your new password.');
      
      // Clear all user data and session
      setUser(null);
      localStorage.removeItem('userProfile');
      localStorage.removeItem('token');
      
      // Force a page reload to clear any cached state
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Failed to change password';
      setError(msg);
    }
  };

  const requireCurrent = true; // Always require current password

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h5" gutterBottom>
        Change Password
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        {String(user?.isFirstLogin).toLowerCase() === 'true'
          ? 'It looks like this is your first login. Please enter your current password and set a new password to continue.'
          : 'Update your account password. You will be redirected to login after changing your password.'}
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

