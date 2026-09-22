import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton, 
  CircularProgress,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, PersonOutline } from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import { useQueryClient } from '@tanstack/react-query';

import { useGoogleLogin } from '@react-oauth/google';
import { msalInstance } from '../lib/msalConfig';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();
  const queryClient = useQueryClient();

  const handleSSOSuccess = async (endpoint: string, payload: any) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post(`/api/auth/sso/${endpoint}`, payload);
      localStorage.setItem('token', response.data.token);
      const user = response.data.user;

      setUser(user);
      localStorage.setItem('userProfile', JSON.stringify(user));
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      if (user && String(user.isFirstLogin).toLowerCase() === 'true') {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || `Failed to sign in with ${endpoint === 'google' ? 'Google' : 'Microsoft'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Send access_token to backend which can fetch the email profile
      handleSSOSuccess('google', { access_token: tokenResponse.access_token });
    },
    onError: () => setError('Google Sign-In failed or was cancelled.')
  });

  const loginMicrosoft = async () => {
    try {
      // Check if MSAL was properly initialized (requires a real Client ID in .env)
      if (!msalInstance || !import.meta.env.VITE_MICROSOFT_CLIENT_ID) {
        setError('Microsoft SSO is not configured yet. Please use your username and password to sign in.');
        return;
      }
      const response = await msalInstance.loginPopup({ scopes: ['User.Read'] });
      if (response && response.account) {
        handleSSOSuccess('microsoft', { account: response.account });
      }
    } catch (e: any) {
      if (e?.errorCode !== 'user_cancelled') {
        setError(e?.message || 'Microsoft Sign-In failed.');
      }
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
      const user = response.data.user;

      setUser(user);
      localStorage.setItem('userProfile', JSON.stringify(user));
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      if (user && String(user.isFirstLogin).toLowerCase() === 'true') {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || 'Invalid credentials';
      setError(serverMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw', bgcolor: '#ffffff' }}>
      
      {/* ── Left Pane: Authentication Gateway ── */}
      <Box
        sx={{
          flex: { xs: '1 1 100%', md: '0 0 50%', lg: '0 0 40%' },
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 4, sm: 8, md: 8, lg: 10 },
          py: 6,
          justifyContent: 'center',
          borderRight: { md: '1px solid #e2e8f0' },
          bgcolor: 'white',
          position: 'relative',
          zIndex: 2,
          boxShadow: { md: '20px 0 25px -5px rgba(0,0,0,0.05)' },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
          
          {/* Logo & Header */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box
                component="img"
                src="/images/sidebar.jpeg"
                alt="EES Logo"
                sx={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover' }}
              />
              <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ letterSpacing: 0.5 }}>
                EES HR
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom sx={{ letterSpacing: '-0.025em' }}>
              Welcome back
            </Typography>
            <Typography variant="body1" color="#64748b">
              Please enter your details to sign in to your workspace.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && (
              <Box sx={{ bgcolor: '#fef2f2', borderLeft: '4px solid #ef4444', p: 1.5, borderRadius: 1 }}>
                <Typography color="#b91c1c" variant="body2" fontWeight={600}>
                  {error}
                </Typography>
              </Box>
            )}

            {/* Inputs */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="#475569" sx={{ mb: 1, display: 'block' }}>
                Username
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                placeholder="Enter your username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    bgcolor: '#f8fafc',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                  }
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} color="#475569" sx={{ mb: 1, display: 'block' }}>
                Password
              </Typography>
              <TextField
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    bgcolor: '#f8fafc',
                    '& fieldset': { borderColor: '#e2e8f0' },
                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
              <Button
                variant="text"
                onClick={() => navigate('/forgot-password')}
                sx={{ textTransform: 'none', color: '#6366f1', fontWeight: 600, p: 0, minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
              >
                Forgot password?
              </Button>
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              fullWidth
              sx={{
                py: 1.5,
                mt: 1,
                borderRadius: 2.5,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '1rem',
                bgcolor: '#4f46e5',
                color: 'white',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                '&:hover': {
                  bgcolor: '#4338ca',
                  boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
            </Button>
          </Box>

          <Divider sx={{ my: 4, color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
            or continue with
          </Divider>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              disabled={isLoading}
              onClick={loginMicrosoft}
              startIcon={
                <Box component="img" src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                  sx={{ width: 18, height: 18 }} />
              }
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                borderColor: '#e2e8f0',
                color: '#334155',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                '&:disabled': { opacity: 0.6 },
              }}
            >
              Microsoft
            </Button>
            <Button
              fullWidth
              variant="outlined"
              disabled={isLoading}
              onClick={() => loginGoogle()}
              startIcon={
                <Box component="img" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  sx={{ width: 18, height: 18 }} />
              }
              sx={{
                py: 1.25,
                borderRadius: 2.5,
                borderColor: '#e2e8f0',
                color: '#334155',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' },
                '&:disabled': { opacity: 0.6 },
              }}
            >
              Google
            </Button>
          </Box>

        </Box>
      </Box>

      {/* ── Right Pane: Imagery & Storytelling ── */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          bgcolor: '#f1f5f9',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('/images/hr_login_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.9)',
          }}
        />
        {/* Subtle overlay gradient to ensure image looks premium */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(79,70,229,0.3) 0%, rgba(15,23,42,0.6) 100%)',
          }}
        />
        
        {/* Quote / Value Prop Overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 48,
            left: 48,
            right: 48,
            bgcolor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            p: 4,
            color: 'white',
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ lineHeight: 1.4 }}>
            "Centralising our people operations with EES transformed how we manage growth and talent across the entire organisation."
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonOutline sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>System Admin</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Internal HR Operations</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      
    </Box>
  );
};

export default Login;
