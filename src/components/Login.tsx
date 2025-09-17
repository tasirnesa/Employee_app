import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button } from '@mui/material';
<<<<<<< HEAD
=======
import { useUser } from '../context/UserContext';
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
<<<<<<< HEAD
=======
  const { setUser } = useUser();
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.token);
<<<<<<< HEAD
=======
      localStorage.setItem('userProfile', JSON.stringify(response.data.user));
      setUser(response.data.user); 
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
      navigate('/dashboard');
    } catch (err: any) {
      setError('Invalid credentials');
      console.error('Login error:', err);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField
        label="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" onClick={handleLogin}>
        Login
      </Button>
    </Container>
  );
};

export default Login;