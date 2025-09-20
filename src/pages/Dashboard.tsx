import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { User, Evaluation, EvaluationCriteria, EvaluationResult } from '../types/interfaces';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const token = localStorage.getItem('token');

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched users:', response.data);
      return response.data as User[];
    },
  });

  const { data: evaluations, isLoading: evaluationsLoading, error: evaluationsError } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/evaluations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched evaluations:', response.data);
      return response.data as Evaluation[];
    },
  });

  const { data: criteria, isLoading: criteriaLoading, error: criteriaError } = useQuery({
    queryKey: ['criteria'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/criteria', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched criteria:', response.data);
      return response.data as EvaluationCriteria[];
    },
  });

  const { data: results, isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/results', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched results:', response.data);
      return response.data as EvaluationResult[];
    },
  });

  const { data: sessionStats } = useQuery({
    queryKey: ['sessionStats'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/evaluation-sessions/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched session stats:', response.data);
      return response.data as { thisWeek: number; today: number; pending: number; meetings: number };
    },
  });

  const totalUsers = users?.length || 0;
  const usersByRole = users?.reduce((acc: Record<string, number>, user: User) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const activeUsers = users?.filter((user: User) => user.activeStatus).length || 0;
  const inactiveUsers = totalUsers - activeUsers;

  const roleChartData = {
    labels: Object.keys(usersByRole),
    datasets: [
      {
        data: Object.values(usersByRole),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  const averageScores = criteria?.map((criterion: EvaluationCriteria) => {
    const relevantResults = results?.filter((result: EvaluationResult) => result.criteriaID === criterion.criteriaID) || [];
    const avgScore =
      relevantResults.length > 0
        ? relevantResults.reduce((sum: number, result: EvaluationResult) => sum + result.score, 0) / relevantResults.length
        : 0;
    return { title: criterion.title, avgScore };
  }) || [];

  const scoreChartData = {
    labels: averageScores.map((item: { title: string; avgScore: number }) => item.title),
    datasets: [
      {
        label: 'Average Score',
        data: averageScores.map((item: { title: string; avgScore: number }) => item.avgScore),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  const totalEvaluations = evaluations?.length || 0;
  const overallAverageScore = results && results.length > 0
    ? results.reduce((sum: number, r: EvaluationResult) => sum + r.score, 0) / results.length
    : 0;

  const evaluationsByType = evaluations?.reduce((acc: Record<string, number>, e: Evaluation) => {
    acc[e.evaluationType] = (acc[e.evaluationType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const evalTypeChartData = {
    labels: Object.keys(evaluationsByType),
    datasets: [
      {
        data: Object.values(evaluationsByType),
        backgroundColor: ['#4BC0C0', '#FF6384', '#9966FF', '#FFCE56', '#36A2EB'],
        hoverBackgroundColor: ['#4BC0C0', '#FF6384', '#9966FF', '#FFCE56', '#36A2EB'],
      },
    ],
  };

  // Monthly evaluations trend (last 6 months)
  const trendLabels: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendLabels.push(d.toLocaleString(undefined, { month: 'short', year: '2-digit' }));
  }
  const monthlyCounts = new Array(trendLabels.length).fill(0);
  (evaluations || []).forEach((e: Evaluation) => {
    const d = new Date(e.evaluationDate);
    const label = d.toLocaleString(undefined, { month: 'short', year: '2-digit' });
    const idx = trendLabels.indexOf(label);
    if (idx !== -1) monthlyCounts[idx] += 1;
  });
  const trendChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Evaluations (last 6 months)',
        data: monthlyCounts,
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54,162,235,0.2)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  // Score distribution (bins 1..5)
  const scoreBins = [1, 2, 3, 4, 5];
  const scoreCounts = scoreBins.map((b) => (results || []).filter((r) => Math.round(r.score) === b).length);
  const scoreDistributionData = {
    labels: scoreBins.map((b) => `Score ${b}`),
    datasets: [
      {
        label: 'Responses',
        data: scoreCounts,
        backgroundColor: '#8E8CF3',
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
  };

  if (usersLoading || evaluationsLoading || criteriaLoading || resultsLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (usersError || evaluationsError || criteriaError || resultsError) {
    return (
      <Typography color="error">
        Error: {(usersError as Error)?.message || (evaluationsError as Error)?.message || (criteriaError as Error)?.message || (resultsError as Error)?.message}
      </Typography>
    );
  }

  const recentEvaluations = evaluations
    ?.slice()
    .sort((a: Evaluation, b: Evaluation) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime())
    .slice(0, 5);

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Registered Users</Typography>
              <Typography variant="h4">{totalUsers}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">User Status</Typography>
              <Typography>Active: {activeUsers}</Typography>
              <Typography>Inactive: {inactiveUsers}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Evaluations</Typography>
              <Typography>Total: {totalEvaluations}</Typography>
              <Typography>Avg Score: {overallAverageScore.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Sessions</Typography>
              <Typography>This week: {sessionStats?.thisWeek ?? 0}</Typography>
              <Typography>Today: {sessionStats?.today ?? 0}</Typography>
              <Typography>Pending: {sessionStats?.pending ?? 0}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Users by Role</Typography>
              <Box sx={{ height: 200 }}>
                <Pie data={roleChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Evaluations by Type</Typography>
              <Box sx={{ height: 200 }}>
                <Pie data={evalTypeChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 100%', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Recent Evaluations</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Evaluation ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Evaluator</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Evaluatee</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEvaluations?.map((evaluation: Evaluation) => (
                      <TableRow key={evaluation.evaluationID}>
                        <TableCell>{evaluation.evaluationID}</TableCell>
                        <TableCell>{evaluation.evaluator?.fullName || evaluation.evaluator?.FullName || evaluation.evaluatorID}</TableCell>
                        <TableCell>{evaluation.evaluatee?.fullName || evaluation.evaluatee?.FullName || evaluation.evaluateeID}</TableCell>
                        <TableCell>{evaluation.evaluationType}</TableCell>
                        <TableCell>{new Date(evaluation.evaluationDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 100%', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Average Evaluation Scores by Criteria</Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={scoreChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 100%', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Evaluations Trend</Typography>
              <Box sx={{ height: 300 }}>
                <Line data={trendChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 100%', minWidth: 260 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Score Distribution</Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={scoreDistributionData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;