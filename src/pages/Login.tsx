import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box } from '@mui/material';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password,
      });
      console.log('Login response:', response.data);
      localStorage.setItem('token', response.data.token);
      console.log('Token stored:', localStorage.getItem('token'));
      const user = response.data.user;
      if (user && String(user.isFirstLogin).toLowerCase() === 'true') {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || 'Invalid credentials';
      console.error('Login error:', err.response?.data || err.message);
      setError(serverMsg);
    }
  };

  return (
    <Container
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage:
          `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.55)), url('/images/images1.jfif')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: 360,
          bgcolor: 'rgba(255,255,255,0.82)',
          borderRadius: 3,
          boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.6)',
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Employee Performance Portal
        </Typography>
        <Typography variant="body2" align="center" sx={{ color: 'text.secondary', mb: 1 }}>
          Sign in to manage evaluations and goals
        </Typography>
        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleLogin} size="large">
          Login
        </Button>
      </Box>
    </Container>
  );
};

export default Login;