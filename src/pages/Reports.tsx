import { useQuery } from '@tanstack/react-query';
import { Container, Typography } from '@mui/material';
import axios from 'axios';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { EvaluationResult } from '../types/index'; // Added .ts

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

function Reports() {
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get('http://localhost:3000/api/results', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as EvaluationResult[];
    },
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  const chartData = {
    labels: results?.map((result: EvaluationResult) => `Evaluation ${result.evaluationID}`) || [],
    datasets: [
      {
        label: 'Average Score',
        data: results?.map((result: EvaluationResult) => result.score) || [],
        backgroundColor: results?.map((_, index) => [
          '#4CAF50',
          '#2196F3',
          '#FF9800',
          '#F44336',
          '#9C27B0',
        ][index % 5]) || [],
        borderColor: results?.map((_, index) => [
          '#388E3C',
          '#1976D2',
          '#F57C00',
          '#D32F2F',
          '#7B1FA2',
        ][index % 5]) || [],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      {results && results.length > 0 ? (
        <Bar
          data={chartData}
          options={{
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'Score' },
              },
              x: {
                title: { display: true, text: 'Evaluation ID' },
              },
            },
            plugins: {
              legend: { display: true },
              tooltip: { enabled: true },
            },
          }}
        />
      ) : (
        <Typography>No results available yet.</Typography>
      )}
    </Container>
  );
}

export default Reports;