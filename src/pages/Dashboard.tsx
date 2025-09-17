import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
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
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import type { User, Evaluation, EvaluationCriteria, EvaluationResult } from '../types/interfaces';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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

  const totalUsers = users?.length || 0;
  const usersByRole = users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const activeUsers = users?.filter((user) => user.activeStatus).length || 0;
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

  const averageScores = criteria?.map((criterion) => {
    const relevantResults = results?.filter((result) => result.criteriaID === criterion.criteriaID) || [];
    const avgScore =
      relevantResults.length > 0
        ? relevantResults.reduce((sum, result) => sum + result.score, 0) / relevantResults.length
        : 0;
    return { title: criterion.title, avgScore };
  }) || [];

  const scoreChartData = {
    labels: averageScores.map((item) => item.title),
    datasets: [
      {
        label: 'Average Score',
        data: averageScores.map((item) => item.avgScore),
        backgroundColor: '#36A2EB',
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
    .sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime())
    .slice(0, 5);

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Registered Users</Typography>
              <Typography variant="h4">{totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">User Status</Typography>
              <Typography>Active: {activeUsers}</Typography>
              <Typography>Inactive: {inactiveUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Users by Role</Typography>
              <Box sx={{ height: 200 }}>
                <Pie data={roleChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Recent Evaluations</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300, overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Evaluation ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Evaluator ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Evaluatee ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentEvaluations?.map((evaluation) => (
                      <TableRow key={evaluation.evaluationID}>
                        <TableCell>{evaluation.evaluationID}</TableCell>
                        <TableCell>{evaluation.evaluatorID}</TableCell>
                        <TableCell>{evaluation.evaluateeID}</TableCell>
                        <TableCell>{evaluation.evaluationType}</TableCell>
                        <TableCell>{new Date(evaluation.evaluationDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Average Evaluation Scores by Criteria</Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={scoreChartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;