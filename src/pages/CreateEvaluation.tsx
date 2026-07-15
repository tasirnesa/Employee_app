import React, { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  TextareaAutosize,
  CircularProgress,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import {
  Assignment as EvalIcon,
  CheckCircle as SuccessIcon,
  Score as ScoreIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import type { Evaluation, EvaluationCriteria, EvaluationResult, Employee, Goal } from '../types/interfaces';
import { listEmployees } from '../api/employeeApi';
import { useUser } from '../context/UserContext';

const steps = ['Setup Details', 'Scoring & Feedback', 'Review & Submit'];

const CreateEvaluation: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const currentUserId = user?.id || JSON.parse(localStorage.getItem('userProfile') || 'null')?.id;
  const currentFullName = user?.fullName || JSON.parse(localStorage.getItem('userProfile') || 'null')?.fullName || 'Current User';

  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    evaluationType: '',
    sessionID: 0,
    evaluateeID: 0,
    criteriaScores: {} as { [key: number]: number },
    criteriaFeedback: {} as { [key: number]: string },
  });

  const [updatePerformance, setUpdatePerformance] = useState(true);
  const pendingEvaluateeUserIdRef = useRef<number | null>(null);

  // Queries
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', 'active-for-evaluation'],
    queryFn: async () => (await listEmployees()) as Employee[],
  });

  const { data: criteria, isLoading: criteriaLoading } = useQuery({
    queryKey: ['criteria'],
    queryFn: async () => {
      const response = await api.get('/api/criteria');
      return response.data as EvaluationCriteria[];
    },
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions-for-eval'],
    queryFn: async () => {
      const response = await api.get('/api/sessions');
      return response.data as Array<{ sessionID: number; title: string; startDate: string; endDate: string; department?: string; type: string }>;
    },
  });

  // Evaluatee Goals
  const { data: evaluateeGoals } = useQuery({
    queryKey: ['goals', pendingEvaluateeUserIdRef.current],
    queryFn: async () => {
      if (!pendingEvaluateeUserIdRef.current) return [] as Goal[];
      const res = await api.get('/api/goals', { params: { userId: pendingEvaluateeUserIdRef.current } });
      return res.data as Goal[];
    },
    enabled: pendingEvaluateeUserIdRef.current != null,
  });

  const createEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: any) => {
      const response = await api.post('/api/evaluations', evaluationData);
      return response.data;
    },
    onSuccess: async () => {
      try {
        queryClient.invalidateQueries({ queryKey: ['evaluations'] });
        if (updatePerformance && pendingEvaluateeUserIdRef.current) {
          await api.post('/api/performance/recalculate', { userId: pendingEvaluateeUserIdRef.current });
        }
      } catch (e) {
        console.error('Performance recalc error:', e);
      } finally {
        setActiveStep(steps.length); // Move to success step
      }
    },
    onError: (error: any) => {
      setErrors(error.response?.data?.error || error.message || 'Error saving evaluation');
    },
  });

  // Derived states
  const evaluatorEmployee = employees?.find((e) => e.userId === currentUserId);
  const evaluatorDeptStr = typeof evaluatorEmployee?.department === 'object'
    ? String((evaluatorEmployee.department as any)?.name).trim().toLowerCase()
    : String(evaluatorEmployee?.department || '').trim().toLowerCase();

  const now = new Date();
  const availableSessions = (sessions || []).filter((s) => {
    const isOn = String(s.type || '').toLowerCase() === 'on';
    if (!isOn) return false;
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    if (now < start || now > end) return false;
    if (!s.department || !evaluatorDeptStr) return true;
    return String(s.department).trim().toLowerCase() === evaluatorDeptStr;
  });

  const selectedSession = availableSessions.find((s) => s.sessionID === formData.sessionID);

  const availableEvaluatees = (employees || [])
    .filter((e) => (e.userId || -1) !== currentUserId)
    .filter((e) => {
      if (!selectedSession || !selectedSession.department) return true;
      const empDept = typeof e.department === 'object' ? (e.department as any)?.name : e.department;
      return String(empDept || '').trim().toLowerCase() === String(selectedSession.department).trim().toLowerCase();
    });

  const selectedEvaluateeName = availableEvaluatees.find(
    (e) => (e.userId || e.id) === formData.evaluateeID
  )?.firstName + ' ' + availableEvaluatees.find(
    (e) => (e.userId || e.id) === formData.evaluateeID
  )?.lastName;

  // Handlers
  const handleNext = () => {
    setErrors(null);
    if (activeStep === 0) {
      if (!formData.evaluationType || !formData.sessionID || !formData.evaluateeID) {
        setErrors('Evaluation Type, Session, and Evaluatee are required.');
        return;
      }
      // Update pending evaluatee ref for goals query
      const byEmp = employees?.find((e) => e.userId === formData.evaluateeID || e.id === formData.evaluateeID);
      pendingEvaluateeUserIdRef.current = byEmp?.userId || formData.evaluateeID;
    }
    if (activeStep === 1) {
      const hasScores = Object.values(formData.criteriaScores).some((s) => s > 0);
      if (!hasScores) {
        setErrors('Please score at least one criterion before continuing.');
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = () => {
    setErrors(null);
    let evaluateeEmployeeId: number | undefined = undefined;
    const byEmp = employees?.find((e) => e.userId === formData.evaluateeID || e.id === formData.evaluateeID);
    if (byEmp) {
      evaluateeEmployeeId = byEmp.id;
    }

    const goalsResults = (evaluateeGoals || []).map((g) => ({ gid: g.gid, progress: g.progress ?? 0 }));

    const payload = {
      evaluation: {
        evaluatorID: Number(currentUserId),
        evaluateeID: pendingEvaluateeUserIdRef.current,
        evaluateeEmployeeId,
        evaluationType: formData.evaluationType,
        sessionID: formData.sessionID,
      },
      results: (criteria || []).map((criterion) => ({
        criteriaID: criterion.criteriaID,
        score: formData.criteriaScores[criterion.criteriaID] || 0,
        feedback: formData.criteriaFeedback[criterion.criteriaID] || '',
      })),
      goalsResults,
    };

    createEvaluationMutation.mutate(payload);
  };

  // Render Steps
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Setup Details
        return (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box sx={{ gridColumn: 'span 2' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EvalIcon color="primary" /> Evaluation Setup
              </Typography>
            </Box>

            <TextField label="Evaluator" value={currentFullName} fullWidth InputProps={{ readOnly: true }} />

            <TextField
              label="Evaluation Type"
              fullWidth
              placeholder="e.g. Annual Review, Mid-Year Check-in"
              value={formData.evaluationType}
              onChange={(e) => setFormData({ ...formData, evaluationType: e.target.value })}
            />

            <FormControl fullWidth>
              <InputLabel>Session</InputLabel>
              <Select
                value={formData.sessionID}
                label="Session"
                onChange={(e) => {
                  setFormData({ ...formData, sessionID: Number(e.target.value), evaluateeID: 0 }); // reset evaluatee on session change
                }}
              >
                <MenuItem value={0} disabled>Select Session</MenuItem>
                {availableSessions.map((s) => (
                  <MenuItem key={s.sessionID} value={s.sessionID}>
                    {s.title}{s.department ? ` - ${s.department}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!formData.sessionID}>
              <InputLabel>Evaluatee</InputLabel>
              <Select
                value={formData.evaluateeID}
                label="Evaluatee"
                onChange={(e) => setFormData({ ...formData, evaluateeID: Number(e.target.value) })}
              >
                <MenuItem value={0} disabled>
                  {formData.sessionID ? "Select Evaluatee" : "Select Session First"}
                </MenuItem>
                {availableEvaluatees.map((e) => (
                  <MenuItem key={e.id} value={e.userId ? e.userId : e.id}>
                    {e.firstName} {e.lastName} ({e.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 1: // Scoring & Feedback
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScoreIcon color="primary" /> Scoring & Feedback
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Evaluating {selectedEvaluateeName || 'Employee'}. Rate them on a scale of 1-5 for each metric.
            </Typography>

            <Box sx={{ maxHeight: '420px', overflowY: 'auto', pr: 2 }}>
              {criteria?.map((criterion) => (
                <Paper key={criterion.criteriaID} variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
                  <FormLabel component="legend" sx={{ mb: 1.5, fontWeight: 700, color: '#1e293b' }}>
                    {criterion.title}
                  </FormLabel>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {criterion.description || 'Rate this metric from 1 (Poor) to 5 (Excellent).'}
                  </Typography>
                  <RadioGroup
                    row
                    value={formData.criteriaScores[criterion.criteriaID] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteriaScores: { ...formData.criteriaScores, [criterion.criteriaID]: parseInt(e.target.value) }
                    })}
                  >
                    {[1, 2, 3, 4, 5].map((val) => (
                      <FormControlLabel key={val} value={val} control={<Radio />} label={val.toString()} />
                    ))}
                  </RadioGroup>
                  <TextareaAutosize
                    value={formData.criteriaFeedback[criterion.criteriaID] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      criteriaFeedback: { ...formData.criteriaFeedback, [criterion.criteriaID]: e.target.value }
                    })}
                    minRows={2}
                    placeholder={`Provide optional feedback for ${criterion.title}...`}
                    style={{ width: '100%', marginTop: '16px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
                  />
                </Paper>
              ))}
            </Box>
          </Box>
        );

      case 2: // Review & Submit
        const scoredCount = Object.values(formData.criteriaScores).filter(v => v > 0).length;
        const totalScore = Object.values(formData.criteriaScores).reduce((a, b) => a + (b || 0), 0);
        const avgScore = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : 'N/A';

        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PreviewIcon color="primary" /> Review Submission
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please review the evaluation summary before submitting.
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Evaluatee</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedEvaluateeName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Session</Typography>
                  <Typography variant="body1" fontWeight={700}>{selectedSession?.title}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Type</Typography>
                  <Typography variant="body1" fontWeight={700}>{formData.evaluationType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Average Score</Typography>
                  <Typography variant="body1" fontWeight={700}>{avgScore} / 5</Typography>
                </Box>
              </Box>
            </Paper>

            <FormControlLabel
              control={<Checkbox checked={updatePerformance} onChange={(e) => setUpdatePerformance(e.target.checked)} />}
              label="Recalculate dynamic performance analytics for this user upon submission"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  if (employeesLoading || criteriaLoading || sessionsLoading) return <Typography sx={{ p: 3 }}>Loading wizard...</Typography>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>

        {activeStep === steps.length ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Evaluation Submitted!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              The performance evaluation has been successfully recorded.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/evaluations/view')} size="large">
              View All Evaluations
            </Button>
          </Box>
        ) : (
          <Box>
            <Typography variant="h5" align="center" fontWeight={700} gutterBottom sx={{ color: '#1e293b' }}>
              Create Evaluation
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {errors && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errors}</Alert>}

            <Box sx={{ minHeight: '300px', mb: 4 }}>
              {renderStepContent(activeStep)}
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={createEvaluationMutation.isPending}
                  startIcon={createEvaluationMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
                  size="large"
                >
                  Submit Evaluation
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext} size="large">
                  Next Step
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CreateEvaluation;
