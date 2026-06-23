import React from 'react';
import { Box, Paper, Typography, Grid, alpha } from '@mui/material';
import {
  People as PeopleIcon,
  EmojiEvents as EvalIcon,
  DateRange as LeaveIcon,
  Payments as PayrollIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Groups as TeamIcon,
  Flag as GoalIcon,
  Work as WorkIcon,
  Notifications as NotifIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendPositive, color }) => (
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: trendPositive === true ? 'success.main' : trendPositive === false ? 'error.main' : 'text.secondary',
          }}
        >
          {trendPositive === true && <TrendUpIcon sx={{ fontSize: 16 }} />}
          {trendPositive === false && <TrendDownIcon sx={{ fontSize: 16 }} />}
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

export interface DashboardStats {
  role?: string;
  totalEmployees?: number;
  teamSize?: number;
  activeEvaluations?: number;
  pendingLeaves?: number;
  monthlyPayroll?: string;
  headcountGrowthPercent?: number;
  evaluationCompletionRate?: number;
  attendanceRate?: number;
  openCandidates?: number;
  myGoalsCount?: number;
  myGoalsAvgProgress?: number;
  myPendingLeaves?: number;
  unreadNotifications?: number;
  newHiresThisMonth?: number;
}

interface HrStatsProps {
  stats?: DashboardStats;
}

const HrStats: React.FC<HrStatsProps> = ({ stats }) => {
  const role = stats?.role || 'Employee';
  const isAdmin = role === 'Admin' || role === 'SuperAdmin';
  const isManager = role === 'Manager';

  const growth = stats?.headcountGrowthPercent ?? 0;
  const growthLabel = growth > 0 ? `+${growth}%` : growth < 0 ? `${growth}%` : 'No change';
  const evalTrend = stats?.evaluationCompletionRate != null
    ? `${stats.evaluationCompletionRate}% complete`
    : undefined;
  const leaveTrend = (stats?.pendingLeaves ?? 0) > 0 ? 'Requires action' : 'All clear';

  if (isAdmin) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Employees"
            value={stats?.totalEmployees ?? 0}
            icon={<PeopleIcon />}
            trend={growthLabel}
            trendPositive={growth > 0 ? true : growth < 0 ? false : undefined}
            color="#6366f1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Evaluations"
            value={stats?.activeEvaluations ?? 0}
            icon={<EvalIcon />}
            trend={evalTrend}
            color="#ec4899"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending Leaves"
            value={stats?.pendingLeaves ?? 0}
            icon={<LeaveIcon />}
            trend={leaveTrend}
            color="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Monthly Payroll"
            value={stats?.monthlyPayroll ?? '$0.00'}
            icon={<PayrollIcon />}
            trend={`${stats?.attendanceRate ?? 0}% attendance`}
            color="#10b981"
          />
        </Grid>
      </Grid>
    );
  }

  if (isManager) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Team Size"
            value={stats?.teamSize ?? 0}
            icon={<TeamIcon />}
            trend={stats?.newHiresThisMonth ? `+${stats.newHiresThisMonth} this month` : undefined}
            trendPositive={!!stats?.newHiresThisMonth}
            color="#6366f1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingLeaves ?? 0}
            icon={<LeaveIcon />}
            trend={leaveTrend}
            color="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Evaluations"
            value={stats?.activeEvaluations ?? 0}
            icon={<EvalIcon />}
            trend={evalTrend}
            color="#ec4899"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Open Candidates"
            value={stats?.openCandidates ?? 0}
            icon={<WorkIcon />}
            trend={`${stats?.attendanceRate ?? 0}% attendance`}
            color="#10b981"
          />
        </Grid>
      </Grid>
    );
  }

  // Employee view
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Goals In Progress"
          value={stats?.myGoalsCount ?? 0}
          icon={<GoalIcon />}
          trend={stats?.myGoalsAvgProgress != null ? `${stats.myGoalsAvgProgress}% avg progress` : undefined}
          color="#6366f1"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Pending Requests"
          value={stats?.myPendingLeaves ?? 0}
          icon={<LeaveIcon />}
          trend={leaveTrend}
          color="#f59e0b"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Active Evaluations"
          value={stats?.activeEvaluations ?? 0}
          icon={<EvalIcon />}
          trend={evalTrend}
          color="#ec4899"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard
          title="Notifications"
          value={stats?.unreadNotifications ?? 0}
          icon={<NotifIcon />}
          trend={(stats?.unreadNotifications ?? 0) > 0 ? 'Unread' : 'All read'}
          color="#10b981"
        />
      </Grid>
    </Grid>
  );
};

export default HrStats;
