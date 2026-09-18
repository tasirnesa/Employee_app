import React from 'react';
import { Box, Paper, Typography, Grid, alpha, Tooltip } from '@mui/material';
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
  CheckCircle as OnTrackIcon,
  Warning as OverdueIcon,
  CalendarToday as CalIcon,
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
  headcountGrowthRaw?: boolean;
  evaluationCompletionRate?: number;
  attendanceRate?: number;
  openCandidates?: number;
  myGoalsCount?: number;
  myGoalsAvgProgress?: number;
  myGoalsOnTrack?: number;
  myGoalsOverdue?: number;
  myPendingLeaves?: number;
  unreadNotifications?: number;
  newHiresThisMonth?: number;
  nextEvaluationTitle?: string;
  nextEvaluationDate?: string;
  headcountTrend?: { label: string; value: number }[];
  turnoverTrend?: { label: string; value: number }[];
}

interface HrStatsProps {
  stats?: DashboardStats;
}

const HrStats: React.FC<HrStatsProps> = ({ stats }) => {
  const role = stats?.role || 'Employee';
  const isAdmin = role === 'Admin' || role === 'SuperAdmin';
  const isManager = role === 'Manager';

  const growth = stats?.headcountGrowthPercent ?? 0;
  const growthLabel = stats?.headcountGrowthRaw
    ? growth > 0 ? `+${growth} new hires` : growth < 0 ? `${growth} hires` : 'No new hires'
    : growth > 0 ? `+${growth}%` : growth < 0 ? `${growth}%` : 'No change';
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
            title="Total Active Compensation"
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
  const goalsCount = stats?.myGoalsCount ?? 0;
  const onTrack = stats?.myGoalsOnTrack ?? 0;
  const overdue = stats?.myGoalsOverdue ?? 0;
  const avgProgress = stats?.myGoalsAvgProgress ?? 0;

  // Build a one-line narrative
  const goalNarrative = (() => {
    if (goalsCount === 0) return 'No active goals';
    const parts: string[] = [];
    if (onTrack > 0) parts.push(`${onTrack} on track`);
    if (overdue > 0) parts.push(`${overdue} overdue`);
    if (parts.length === 0) parts.push(`${avgProgress}% avg`);
    return parts.join(' · ');
  })();

  const nextEvalLabel = stats?.nextEvaluationDate
    ? `Next: ${new Date(stats.nextEvaluationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : undefined;

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Goals — narrative card */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 4,
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
            border: '1px solid #eef2ff',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', display: 'flex' }}>
              <GoalIcon />
            </Box>
            {overdue > 0 ? (
              <Tooltip title={`${overdue} goal${overdue > 1 ? 's' : ''} past due date`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
                  <OverdueIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight={700}>{overdue} overdue</Typography>
                </Box>
              </Tooltip>
            ) : onTrack > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                <OnTrackIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" fontWeight={700}>On track</Typography>
              </Box>
            ) : null}
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b' }}>{goalsCount}</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>Goals In Progress</Typography>
            <Typography variant="caption" sx={{ color: overdue > 0 ? 'error.main' : '#64748b', fontWeight: 600, mt: 0.5, display: 'block' }}>
              {goalNarrative}
            </Typography>
          </Box>
        </Paper>
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

      {/* Evaluations — show next review date */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 4,
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
            border: '1px solid #eef2ff',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: alpha('#ec4899', 0.1), color: '#ec4899', display: 'flex' }}>
              <EvalIcon />
            </Box>
            {nextEvalLabel && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <CalIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" fontWeight={700}>{nextEvalLabel}</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ mt: 1 }}>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b' }}>
              {stats?.activeEvaluations ?? 0}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>Active Evaluations</Typography>
            {evalTrend && (
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5, display: 'block' }}>
                {evalTrend}
              </Typography>
            )}
          </Box>
        </Paper>
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
