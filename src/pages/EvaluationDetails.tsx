import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Typography, Card, Chip, Divider, List, ListItem, ListItemText, Button } from '@mui/material';

const EvaluationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['evaluationDetails', id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const res = await axios.get(`http://localhost:3000/api/evaluations/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data as any;
    },
    enabled: !!id,
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  const evalData = data?.evaluation;
  const results = data?.results || [];
  const goals = data?.goals || [];

  const computeAverageProgress = (goal: any) => {
    const arr = Array.isArray(goal?.keyResult) ? goal.keyResult : [];
    const values = arr
      .map((kr: any) => (kr && typeof kr === 'object' && kr.progress != null ? Number(kr.progress) || 0 : 0));
    if (!values.length) return typeof goal?.progress === 'number' ? goal.progress : 0;
    const sum = values.reduce((a: number, b: number) => a + Math.max(0, Math.min(100, b)), 0);
    return Math.round(sum / values.length);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Evaluation Details</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back</Button>
      </Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Evaluator: {evalData?.evaluator?.fullName || evalData?.evaluatorID} — Evaluatee: {evalData?.evaluatee?.fullName || evalData?.evaluateeID}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip label={`Type: ${evalData?.evaluationType || 'N/A'}`} />
          <Chip label={`Session: ${evalData?.sessionID}`} />
          <Chip label={`Date: ${evalData?.evaluationDate ? new Date(evalData.evaluationDate).toLocaleString() : 'N/A'}`} />
        </Box>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Criteria Results</Typography>
        <Divider sx={{ mb: 2 }} />
        <List dense>
          {results.map((r: any) => (
            <ListItem key={r.resultID} disableGutters>
              <ListItemText
                primary={`${r.criteria?.title || 'Criteria'} — Score: ${r.score}`}
                secondary={r.feedback ? `Feedback: ${r.feedback}` : undefined}
              />
            </ListItem>
          ))}
        </List>
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Current Goals Snapshot</Typography>
        <Divider sx={{ mb: 2 }} />
        <List dense>
          {goals.map((g: any) => {
            const avg = computeAverageProgress(g);
            return (
              <ListItem key={g.gid} disableGutters>
                <ListItemText
                  primary={`${g.objective} — Progress: ${avg}%`}
                  secondary={Array.isArray(g.keyResult)
                    ? g.keyResult.map((kr: any, idx: number) => `${idx + 1}. ${typeof kr === 'string' ? kr : kr?.title || 'Untitled'} (${typeof kr === 'object' && kr?.progress != null ? kr.progress : 0}%)`).join('  |  ')
                    : String(g.keyResult || '')}
                />
              </ListItem>
            );
          })}
        </List>
      </Card>
    </Box>
  );
};

export default EvaluationDetails;


