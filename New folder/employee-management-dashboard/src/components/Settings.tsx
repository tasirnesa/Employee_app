import React from 'react';
import { Container, Typography, Card, CardContent, TextField, Button } from '@mui/material';

const Settings: React.FC = () => {
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');

  const handleSave = () => {
    // Logic to save settings
    console.log('Settings saved:', { username, email });
  };

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6">Personal Information</Typography>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Settings;