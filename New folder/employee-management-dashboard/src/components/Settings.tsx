import React from 'react';
import { Container, Typography, Card, CardContent, TextField, Button, Box } from '@mui/material';

const Settings: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');

  const handleSave = () => {
    // Logic to save settings
    console.log('Settings saved:', { username, email });
  };

  return (
    <>
      <Typography variant="h6" fontWeight={700} gutterBottom>Personal Information</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Username"
          size="small"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
        />
        <TextField
          label="Email"
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <Button variant="contained" color="primary" onClick={handleSave} sx={{ alignSelf: 'flex-start' }}>
          Save Changes
        </Button>
      </Box>
    </>
  );
};

export default Settings;