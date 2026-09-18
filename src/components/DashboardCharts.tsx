import React from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Grid, Chip } from '@mui/material';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

interface TrendPoint {
  label: string;
  value: number;
}

interface DashboardChartsProps {
  headcountByDepartment?: { name: string; count: number }[];
  evaluationCompletionRate?: number;
  attendanceRate?: number;
  openCandidates?: number;
  showOrgAnalytics?: boolean;
  headcountTrend?: TrendPoint[];
  turnoverTrend?: TrendPoint[];
}

interface KpiRowProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  color: string;
  icon: React.ReactNode;
}

const KpiRow: React.FC<KpiRowProps> = ({ label, value, max = 100, unit = '%', color, icon }) => {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          <Typography variant="body2" fontWeight={600} color="#334155">
            {label}
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight={800} color="#1e293b">
          {unit === '%' ? `${value}%` : `${value} ${unit}`}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: '#f1f5f9',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
        }}
      />
    </Box>
  );
};

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  headcountByDepartment = [],
  evaluationCompletionRate = 0,
  attendanceRate = 0,
  openCandidates = 0,
  showOrgAnalytics = true,
  headcountTrend = [],
  turnoverTrend = [],
}) => {
  if (!showOrgAnalytics) return null;

  // ── Dept bar chart ────────────────────────────────────────────────────────
  const deptLabels = headcountByDepartment.map((d) => d.name);
  const deptCounts = headcountByDepartment.map((d) => d.count);
  const maxCount = deptCounts.length ? Math.max(...deptCounts) : 1;

  const headcountData = {
    labels: deptLabels.length ? deptLabels : ['No data'],
    datasets: [
      {
        label: 'Employees',
        data: deptCounts.length ? deptCounts : [0],
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return '#6366f1';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(99,102,241,0.5)');
          gradient.addColorStop(1, 'rgba(99,102,241,1)');
          return gradient;
        },
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const barOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y} employees`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: {
          stepSize: Math.max(1, Math.ceil(maxCount / 5)),
          color: '#94a3b8',
          font: { size: 11 },
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  // ── 6-month trend line ────────────────────────────────────────────────────
  const trendLabels = headcountTrend.map((p) => p.label);
  const trendValues = headcountTrend.map((p) => p.value);
  const turnoverValues = turnoverTrend.map((p) => p.value);

  // Annotate last point if it changed
  const lastHires = trendValues[trendValues.length - 1] ?? 0;
  const prevHires = trendValues[trendValues.length - 2] ?? 0;
  const trendDelta = lastHires - prevHires;
  const trendChip =
    trendDelta > 0
      ? { label: `+${trendDelta} vs last month`, color: 'success' as const }
      : trendDelta < 0
        ? { label: `${trendDelta} vs last month`, color: 'error' as const }
        : { label: 'Flat vs last month', color: 'default' as const };

  const trendData = {
    labels: trendLabels.length ? trendLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Hires',
        data: trendValues.length ? trendValues : [0, 0, 0, 0, 0, 0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        pointBackgroundColor: '#6366f1',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 2.5,
      },
      {
        label: 'Departures',
        data: turnoverValues.length ? turnoverValues : [0, 0, 0, 0, 0, 0],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244,63,94,0.04)',
        pointBackgroundColor: '#f43f5e',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 2.5,
        borderDash: [5, 3],
      },
    ],
  };

  const lineOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#64748b',
          font: { size: 11 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: { stepSize: 1, color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  const candidateMax = Math.max(openCandidates, 10);

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Row 1: Dept headcount + KPI snapshot */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ borderRadius: 4, border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', mb: 2 }}>
              Headcount by Department
            </Typography>
            <Box sx={{ height: 220 }}>
              {deptLabels.length === 0 ? (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #e2e8f0', borderRadius: 3 }}>
                  <Typography variant="body2" color="text.disabled">No department data available</Typography>
                </Box>
              ) : (
                <Bar data={headcountData} options={barOptions} />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card sx={{ borderRadius: 4, border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', mb: 3 }}>
              Workforce Snapshot
            </Typography>
            <KpiRow label="Evaluation Completion" value={evaluationCompletionRate} color="#10b981" icon={<AssignmentTurnedInIcon fontSize="small" />} />
            <KpiRow label="Monthly Attendance Rate" value={attendanceRate} color="#6366f1" icon={<AccessTimeIcon fontSize="small" />} />
            <KpiRow label="Open Candidates" value={openCandidates} max={candidateMax} unit="candidates" color="#f59e0b" icon={<WorkIcon fontSize="small" />} />
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>EVAL COMPLETE</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#10b981">{evaluationCompletionRate}%</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>ATTENDANCE</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#6366f1">{attendanceRate}%</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>OPEN ROLES</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#f59e0b">{openCandidates}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Row 2: 6-month hire vs departure trend */}
      <Grid size={{ xs: 12 }}>
        <Card sx={{ borderRadius: 4, border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TrendingUpIcon sx={{ color: '#6366f1' }} />
                <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b' }}>
                  Workforce Trend — Last 6 Months
                </Typography>
              </Box>
              <Chip
                label={trendChip.label}
                color={trendChip.color}
                size="small"
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
            </Box>
            <Box sx={{ height: 200 }}>
              <Line data={trendData} options={lineOptions} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardCharts;
