import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import CriteriaView from '../components/CriteriaView';
import EvaluationResults from '../components/EvaluationResults';
import Goals from '../components/Goals';
import Performance from '../components/Performance';
import ScheduledSessions from '../components/ScheduledSessions';
import Reports from '../components/Reports';
import Settings from '../components/Settings';

const Dashboard: React.FC = () => {
  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Employee Dashboard
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <CriteriaView />
        </Box>
        <Box>
          <EvaluationResults />
        </Box>
        <Box>
          <Goals />
        </Box>
        <Box>
          <Performance />
        </Box>
        <Box>
          <ScheduledSessions />
        </Box>
        <Box>
          <Reports />
        </Box>
        <Box>
          <Settings />
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;