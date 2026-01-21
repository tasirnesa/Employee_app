import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import StarIcon from '@mui/icons-material/Star';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';

const EvaluationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch {
      return {} as any;
    }
  })();
  const isEmployee = currentUser?.role === 'Employee';

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

  if (isLoading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <LinearProgress sx={{ width: '50%' }} />
    </Box>
  );
  if (error) return (
    <Box sx={{ p: 4 }}>
      <Typography color="error" variant="h6">Error Loading Evaluation</Typography>
      <Typography color="text.secondary">{(error as Error).message}</Typography>
      <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
    </Box>
  );

  const evalData = data?.evaluation;
  const results = data?.results || [];
  const goals = data?.goals || [];

  const averageScore = results.length > 0
    ? (results.reduce((acc: number, r: any) => acc + (r.score || 0), 0) / results.length).toFixed(1)
    : '0';

  const computeAverageProgress = (goal: any) => {
    const arr = Array.isArray(goal?.keyResult) ? goal.keyResult : [];
    const values = arr
      .map((kr: any) => (kr && typeof kr === 'object' && kr.progress != null ? Number(kr.progress) || 0 : 0));
    if (!values.length) return typeof goal?.progress === 'number' ? goal.progress : 0;
    const sum = values.reduce((a: number, b: number) => a + Math.max(0, Math.min(100, b)), 0);
    return Math.round(sum / values.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'success.main';
    if (score >= 3) return 'primary.main';
    if (score >= 2) return 'warning.main';
    return 'error.main';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'action.hover' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Evaluation Report
          </Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          Print Report
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, height: '100%', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar sx={{ width: 100, height: 100, margin: '0 auto', mb: 2, bgcolor: 'primary.main' }}>
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold">{evalData?.evaluatee?.fullName || 'N/A'}</Typography>
              <Typography color="text.secondary" variant="body2">Employee Profile</Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={3}>
              <Box>
                <Typography color="text.secondary" variant="caption" display="block" gutterBottom>OVERALL RATING</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon color="warning" sx={{ fontSize: 32 }} />
                  <Typography variant="h3" fontWeight="bold">{averageScore}</Typography>
                  <Typography color="text.secondary" variant="h6">/ 5</Typography>
                </Box>
              </Box>

              <Box>
                <Typography color="text.secondary" variant="caption" display="block" gutterBottom>EVALUATED BY</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonIcon color="action" />
                  <Typography variant="body1" fontWeight="medium">{evalData?.evaluator?.fullName || 'N/A'}</Typography>
                </Stack>
              </Box>

              <Box>
                <Typography color="text.secondary" variant="caption" display="block" gutterBottom>EVALUATION TYPE</Typography>
                <Chip icon={<AssignmentIcon />} label={evalData?.evaluationType || 'Standard'} color="secondary" variant="outlined" />
              </Box>

              <Box>
                <Typography color="text.secondary" variant="caption" display="block" gutterBottom>DATE COMPLETED</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DateRangeIcon color="action" />
                  <Typography variant="body1">
                    {evalData?.evaluationDate ? new Date(evalData.evaluationDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Right Column: Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {/* Criteria Breakdown */}
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Performance Metrics Breakdown
              </Typography>
              <Stack spacing={4}>
                {results.map((r: any) => (
                  <Box key={r.resultID}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">{r.criteria?.title || 'Unknown Criteria'}</Typography>
                      <Typography variant="body2" fontWeight="bold" color={getScoreColor(r.score)}>{r.score} / 5</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(r.score / 5) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.100',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getScoreColor(r.score),
                          borderRadius: 4
                        }
                      }}
                    />
                    {r.feedback && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic', pl: 2, borderLeft: '2px solid #eee' }}>
                        "{r.feedback}"
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Goals Snapshot */}
            <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Active Goals Status at Evaluation
              </Typography>
              <List disablePadding>
                {goals.map((g: any, index: number) => {
                  const avg = computeAverageProgress(g);
                  return (
                    <Box key={g.gid}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold">{g.objective}</Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={avg}
                                  sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" fontWeight="bold">{avg}%</Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {Array.isArray(g.keyResult)
                                  ? g.keyResult.map((kr: any) => typeof kr === 'string' ? kr : kr?.title).join(' • ')
                                  : 'No key results defined'}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < goals.length - 1 && <Divider />}
                    </Box>
                  );
                })}
              </List>
            </Paper>

            {/* Post-Evaluation Actions - ONLY for non-employees */}
            {!isEmployee && (
              <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                  Post-Evaluation Actions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Based on the score of <strong>{averageScore}</strong>, here are recommended next steps:
                </Typography>
                <Stack spacing={2}>
                  {Number(averageScore) >= 4.0 && (
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<StarIcon />}
                      onClick={() => navigate(`/users/${evalData?.evaluateeID}`)}
                    >
                      Recommend Promotion / Role Update
                    </Button>
                  )}
                  {Number(averageScore) < 3.0 && (
                    <Button
                      variant="contained"
                      color="warning"
                      fullWidth
                      startIcon={<AssignmentIcon />}
                      onClick={() => navigate('/goals')}
                    >
                      Assign Performance Improvement Plan
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<DateRangeIcon />}
                    onClick={() => navigate('/schedule')}
                  >
                    Schedule Follow-up Meeting
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EvaluationDetails;


