import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Container, Typography, TextField, Button, Box, InputAdornment, IconButton, CircularProgress, Collapse } from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, PersonOutline, LoginOutlined } from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import { useQueryClient } from '@tanstack/react-query';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();
  const queryClient = useQueryClient();

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
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `linear-gradient(rgba(10, 25, 41, 0.45), rgba(10, 25, 41, 0.7)), url('/images/hr_login_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        p: 2,
      }}
    >
      {/* Top-left logo badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 32,
          left: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          component="img"
          src="/images/sidebar.jpeg"
          alt="EES Logo"
          sx={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        />
        <Typography variant="h6" fontWeight={800} color="white" sx={{ letterSpacing: 1 }}>
          EES
        </Typography>
      </Box>

      {/* Login Card - expand on hover, collapse on mouse leave */}
      <Box
        component="form"
        onSubmit={handleLogin}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          // Stay expanded if a field has focus or has content
          if (username || password) return;
          setIsExpanded(false);
        }}
        sx={{
          width: '100%',
          maxWidth: isExpanded ? 420 : 320,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 4,
          boxShadow: isExpanded
            ? '0 25px 50px -12px rgba(0,0,0,0.5)'
            : '0 10px 25px -5px rgba(0,0,0,0.3)',
          p: isExpanded ? { xs: 4, md: 5 } : { xs: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          gap: isExpanded ? 3 : 2,
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.8)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: isExpanded ? 'default' : 'pointer',
          transform: isExpanded ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        {/* Header - always visible */}
        <Box sx={{ textAlign: 'center', mb: isExpanded ? 1 : 0, transition: 'margin 0.3s ease' }}>
          <Box
            sx={{
              width: isExpanded ? 56 : 48,
              height: isExpanded ? 56 : 48,
              mx: 'auto',
              mb: 1.5,
              borderRadius: '50%',
              bgcolor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <LoginOutlined sx={{ fontSize: isExpanded ? 28 : 24, color: '#0284c7', transition: 'font-size 0.3s ease' }} />
          </Box>
          <Typography variant={isExpanded ? 'h5' : 'h6'} fontWeight={800} color="#0f172a" gutterBottom sx={{ transition: 'font-size 0.3s ease' }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="#64748b">
            {isExpanded ? 'Sign in to access your Employee Performance Portal' : 'Hover to sign in'}
          </Typography>
        </Box>

        {/* Collapsible form section */}
        <Collapse in={isExpanded} timeout={400} unmountOnExit={false}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && (
              <Box sx={{ bgcolor: '#fef2f2', borderLeft: '4px solid #ef4444', p: 1.5, borderRadius: 1 }}>
                <Typography color="#b91c1c" variant="body2" fontWeight={600}>
                  {error}
                </Typography>
              </Box>
            )}

            <TextField
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'white',
                }
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              fullWidth
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
                  borderRadius: 2,
                  bgcolor: 'white',
                }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(0,118,255,0.23)',
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 0.5 }}>
              <Button
                variant="text"
                onClick={() => navigate('/forgot-password')}
                sx={{
                  textTransform: 'none',
                  color: '#64748b',
                  fontWeight: 600,
                  '&:hover': { color: '#0f172a', bgcolor: 'transparent' }
                }}
              >
                Forgot your password?
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </Container>
  );
};

export default Login;
