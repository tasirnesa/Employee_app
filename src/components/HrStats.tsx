import React from 'react';
import { Box, Paper, Typography, Grid, alpha } from '@mui/material';
import {
  People as PeopleIcon,
  EmojiEvents as EvalIcon,
  DateRange as LeaveIcon,
  Payments as PayrollIcon,
  TrendingUp as TrendUpIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      height: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
      border: '1px solid #eef2ff',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
      },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          bgcolor: alpha(color, 0.1),
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: trend.startsWith('+') ? 'success.main' : 'text.secondary' }}>
          {trend.startsWith('+') && <TrendUpIcon sx={{ fontSize: 16 }} />}
          <Typography variant="caption" fontWeight={700}>{trend}</Typography>
        </Box>
      )}
    </Box>
    <Box sx={{ mt: 1 }}>
      <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight={500}>
        {title}
      </Typography>
    </Box>
  </Paper>
);

interface HrStatsProps {
  stats?: {
    totalEmployees: number;
    activeEvaluations: number;
    pendingLeaves: number;
    monthlyPayroll: string;
  };
}

const HrStats: React.FC<HrStatsProps> = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          icon={<PeopleIcon />}
          trend="+12%"
          color="#6366f1"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Active Evaluations"
          value={stats?.activeEvaluations || 0}
          icon={<EvalIcon />}
          trend="Current"
          color="#ec4899"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Pending Leaves"
          value={stats?.pendingLeaves || 0}
          icon={<LeaveIcon />}
          trend="Requires action"
          color="#f59e0b"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Monthly Payroll"
          value={stats?.monthlyPayroll || '$0.00'}
          icon={<PayrollIcon />}
          trend="Estimated"
          color="#10b981"
        />
      </Grid>
    </Grid>
  );
};

export default HrStats;
