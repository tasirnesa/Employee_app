import React, { useState } from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import DepartmentManagement from '../components/DepartmentManagement';
import SettingIcon from '@mui/icons-material/Settings';

const DepartmentManagementPage: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(true);

  return (
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SettingIcon sx={{ fontSize: 40 }} color="primary" />
          <Typography variant="h4">
            Department Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setDialogOpen(true)}
        >
          Manage Departments
        </Button>
      </Box>

      <DepartmentManagement
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Container>
  );
};

export default DepartmentManagementPage;

