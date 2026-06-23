import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

interface DashboardChartsProps {
  headcountByDepartment?: { name: string; count: number }[];
  evaluationCompletionRate?: number;
  attendanceRate?: number;
  openCandidates?: number;
  showOrgAnalytics?: boolean;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  headcountByDepartment = [],
  evaluationCompletionRate = 0,
  attendanceRate = 0,
  openCandidates = 0,
  showOrgAnalytics = true,
}) => {
  if (!showOrgAnalytics) return null;

  const deptLabels = headcountByDepartment.map((d) => d.name);
  const deptCounts = headcountByDepartment.map((d) => d.count);

  const headcountData = {
    labels: deptLabels.length ? deptLabels : ['No data'],
    datasets: [
      {
        label: 'Employees',
        data: deptCounts.length ? deptCounts : [0],
        backgroundColor: '#6366f1',
        borderRadius: 6,
      },
    ],
  };

  const workforceData = {
    labels: ['Evaluations Complete', 'Evaluations Pending', 'Attendance Rate', 'Open Candidates'],
    datasets: [
      {
        data: [
          evaluationCompletionRate,
          Math.max(0, 100 - evaluationCompletionRate),
          attendanceRate,
          Math.min(openCandidates * 10, 100),
        ],
        backgroundColor: ['#10b981', '#f1f5f9', '#6366f1', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ borderRadius: 4, border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', mb: 2 }}>
              Headcount by Department
            </Typography>
            <Box sx={{ height: 220 }}>
              <Bar data={headcountData} options={chartOptions} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 5 }}>
        <Card sx={{ borderRadius: 4, border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b', mb: 2 }}>
              Workforce Snapshot
            </Typography>
            <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: 180, height: 180 }}>
                <Doughnut
                  data={workforceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 } } } },
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Eval Completion</Typography>
                <Typography variant="subtitle2" fontWeight={800}>{evaluationCompletionRate}%</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Attendance</Typography>
                <Typography variant="subtitle2" fontWeight={800}>{attendanceRate}%</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Open Roles</Typography>
                <Typography variant="subtitle2" fontWeight={800}>{openCandidates}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardCharts;
