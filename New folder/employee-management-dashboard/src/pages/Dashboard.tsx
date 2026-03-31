import React from 'react';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import CriteriaView from '../components/CriteriaView';
import EvaluationResults from '../components/EvaluationResults';
import Goals from '../components/Goals';
import Performance from '../components/Performance';
import ScheduledSessions from '../components/ScheduledSessions';
import Reports from '../components/Reports';
import Settings from '../components/Settings';

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
          System Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of employee performance, goals, and system health.
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, 
        gap: 2, // Tighter spacing (16px) instead of gap: 3
        alignItems: 'stretch'
      }}>
        {/* Main Performance Metrics */}
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 8' } }}>
          <Paper sx={{ p: 2, height: '100%', maxHeight: 350, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Performance />
          </Paper>
        </Box>

        {/* Goals & Progress */}
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 4' } }}>
          <Paper sx={{ p: 2, height: '100%', maxHeight: 350, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Goals />
          </Paper>
        </Box>

        {/* Evaluation & Criteria */}
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 6' } }}>
          <Paper sx={{ p: 2, maxHeight: 400, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <EvaluationResults />
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 6' } }}>
          <Paper sx={{ p: 2, maxHeight: 400, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CriteriaView />
          </Paper>
        </Box>

        {/* Sessions, Reports & Settings */}
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 4' } }}>
          <Paper sx={{ p: 2, maxHeight: 350, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <ScheduledSessions />
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 4' } }}>
          <Paper sx={{ p: 2, maxHeight: 350, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Reports />
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 4' } }}>
          <Paper sx={{ p: 2, maxHeight: 350, overflowY: 'auto', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Settings />
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;