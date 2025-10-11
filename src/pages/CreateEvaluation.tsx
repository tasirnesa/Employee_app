import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, type FieldProps } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import {
  Container,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Checkbox,
} from '@mui/material';
import type { Evaluation, User, EvaluationCriteria, EvaluationResult, Employee, Goal } from '../types/interfaces';
import { listEmployees } from '../api/employeeApi';
import { useUser } from '../context/UserContext';

const CreateEvaluation: React.FC = () => {
  console.log('CreateEvaluation rendering');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEvaluator, setSelectedEvaluator] = useState<number | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [updatePerformance, setUpdatePerformance] = useState(true);
  const [pendingEvaluationData, setPendingEvaluationData] = useState<
    | { evaluation: Partial<Evaluation>; results: Partial<EvaluationResult>[]; goalsResults: { gid: number; progress: number }[] }
    | null
  >(null);

  const { user } = useUser();
  const currentUserId = user?.id || JSON.parse(localStorage.getItem('userProfile') || 'null')?.id;

  const { data: employees, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees', 'active-for-evaluation'],
    queryFn: async () => {
      const res = await listEmployees();
      return res as Employee[];
    },
  });

  const { data: criteria, isLoading: criteriaLoading, error: criteriaError } = useQuery({
    queryKey: ['criteria'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/criteria', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched criteria:', response.data);
      return response.data as EvaluationCriteria[];
    },
  });

  // Load goals for selected evaluatee (based on evaluatee selection)
  const [evaluateeUserIdForGoals, setEvaluateeUserIdForGoals] = useState<number | null>(null);
  const { data: evaluateeGoals } = useQuery({
    queryKey: ['goals', evaluateeUserIdForGoals],
    queryFn: async () => {
      if (!evaluateeUserIdForGoals) return [] as Goal[];
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const res = await axios.get('http://localhost:3000/api/goals', {
        params: { userId: evaluateeUserIdForGoals },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data as Goal[];
    },
    enabled: evaluateeUserIdForGoals != null,
  });

  // Load sessions for selection and department filtering
  const { data: sessions } = useQuery({
    queryKey: ['sessions-for-eval'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/evaluation-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data as Array<{ sessionID: number; title: string; startDate: string; endDate: string; department?: string }>;
    },
  });

  const createEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: { evaluation: Partial<Evaluation>; results: Partial<EvaluationResult>[] }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.post('http://localhost:3000/api/evaluations', evaluationData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: async (_created, _vars, _ctx) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['evaluations'] });
        if (updatePerformance) {
          const token = localStorage.getItem('token');
          const evaluateeUserId = pendingEvaluateeUserIdRef.current;
          if (token && evaluateeUserId) {
            await axios.post(
              'http://localhost:3000/api/performance/recalculate',
              { userId: evaluateeUserId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }
      } catch (e) {
        console.error('Performance recalc error:', (e as any).response?.data || (e as any).message);
      } finally {
        navigate('/evaluations/view');
      }
    },
    onError: (error: any) => {
      console.error('Create evaluation error:', error.response?.data || error.message);
    },
  });
  // Keep track of resolved evaluatee userId for optional performance recalculation
  const pendingEvaluateeUserIdRef = React.useRef<number | null>(null);


  const validationSchema = Yup.object({
    evaluatorID: Yup.number().required('Evaluator is required'),
    evaluateeID: Yup.number().required('Evaluatee is required').test(
      'not-same-as-evaluator',
      'Evaluatee cannot be the same as evaluator',
      (value, context) => value !== context.parent.evaluatorID
    ),
    evaluationType: Yup.string().required('Evaluation type is required'),
    sessionID: Yup.number().required('Session is required').positive().integer(),
    criteriaScores: Yup.object().test(
      'criteria-required',
      'At least one criterion score is required',
      (value) => Object.values(value || {}).some(score => score !== undefined && score !== 0)
    ),
  });

  if (employeesLoading || criteriaLoading) return <Typography>Loading data...</Typography>;
  if (employeesError) return <Typography color="error">Error: {(employeesError as Error).message}</Typography>;
  if (criteriaError) return <Typography color="error">Error: {(criteriaError as Error).message}</Typography>;

  return (
    <Container maxWidth="sm" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create Evaluation
      </Typography>
      <Formik
        initialValues={{
          evaluatorID: Number(currentUserId) || 0,
          evaluateeID: 0,
          evaluationType: '',
          sessionID: 0,
          criteriaScores: {} as { [key: number]: number },
          criteriaFeedback: {} as { [key: number]: string },
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting, setFieldError }) => {
          if (!criteria || criteria.length === 0) {
            console.error('Criteria data is missing or empty');
            setSubmitting(false);
            return;
          }
          // Normalize evaluateeID: allow selecting employee.id if userId missing; map to userId if available
          let evaluateeIdToUse = values.evaluateeID;
          let evaluateeEmployeeId: number | undefined = undefined;
          const byEmp = employees?.find((e) => e.id === values.evaluateeID);
          if (byEmp) {
            evaluateeEmployeeId = byEmp.id;
            evaluateeIdToUse = byEmp.userId || 0;
          }
          pendingEvaluateeUserIdRef.current = evaluateeIdToUse || null;
          setEvaluateeUserIdForGoals(evaluateeIdToUse || null);
          const goalsResults = (evaluateeGoals || []).map((g) => ({ gid: g.gid, progress: g.progress ?? 0 }));
          const evaluationData = {
            evaluation: {
              evaluatorID: Number(currentUserId),
              evaluateeID: evaluateeIdToUse || undefined,
              evaluateeEmployeeId,
              evaluationType: values.evaluationType,
              sessionID: values.sessionID,
            },
            results: criteria.map((criterion) => ({
              criteriaID: criterion.criteriaID, // Matches Criteria type
              score: values.criteriaScores[criterion.criteriaID] || 0,
              feedback: values.criteriaFeedback[criterion.criteriaID] || '',
            })),
            goalsResults,
          };
          console.log('Submitting evaluation data:', evaluationData);
          setPendingEvaluationData(evaluationData);
          setOpenConfirmDialog(true);
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting, setFieldValue, values }) => (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Evaluator"
                value={user?.fullName || JSON.parse(localStorage.getItem('userProfile') || 'null')?.fullName || 'Current User'}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: 'background.paper' }}
              />
              <FormControl fullWidth error={touched.evaluateeID && !!errors.evaluateeID}>
                <InputLabel id="evaluatee-label">Evaluatee</InputLabel>
                <Field
                  as={Select}
                  name="evaluateeID"
                  labelId="evaluatee-label"
                  label="Evaluatee"
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MenuItem value={0} disabled>Select Evaluatee</MenuItem>
                  {employees && employees.length > 0 ? (
                    employees
                      ?.filter((e) => (e.userId || -1) !== currentUserId)
                      .filter((e) => {
                        const session = (sessions || []).find(s => s.sessionID === values.sessionID);
                        if (!session || !session.department) return true;
                        return String(e.department || '').trim().toLowerCase() === String(session.department || '').trim().toLowerCase();
                      })
                      .map((e) => (
                        <MenuItem key={e.id} value={e.userId ? (e.userId as number) : e.id}>
                          {e.firstName} {e.lastName} ({e.email})
                        </MenuItem>
                      ))
                  ) : (
                    <MenuItem value={0} disabled>No employees available</MenuItem>
                  )}
                </Field>
                {touched.evaluateeID && errors.evaluateeID && (
                  <Typography color="error" variant="caption">{errors.evaluateeID}</Typography>
                )}
              </FormControl>
              <Field
                as={TextField}
                name="evaluationType"
                label="Evaluation Type"
                fullWidth
                error={touched.evaluationType && !!errors.evaluationType}
                helperText={touched.evaluationType && errors.evaluationType}
                sx={{ bgcolor: 'background.paper' }}
              />
              <FormControl fullWidth error={touched.sessionID && !!errors.sessionID}>
                <InputLabel id="session-label">Session</InputLabel>
                <Field as={Select} name="sessionID" labelId="session-label" label="Session" sx={{ bgcolor: 'background.paper' }}>
                  <MenuItem value={0} disabled>Select Session</MenuItem>
                  {(sessions || []).map((s) => (
                    <MenuItem key={s.sessionID} value={s.sessionID}>
                      {s.title}{s.department ? ` - ${s.department}` : ''}
                    </MenuItem>
                  ))}
                </Field>
                {touched.sessionID && errors.sessionID && (
                  <Typography color="error" variant="caption">{errors.sessionID}</Typography>
                )}
              </FormControl>
              <Box sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                {criteria?.map((criterion) => (
                  <Box key={criterion.criteriaID} sx={{ mb: 2 }}>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {criterion.title}
                    </FormLabel>
                    <Field name={`criteriaScores[${criterion.criteriaID}]`}>
                      {({ field }: FieldProps) => (
                        <RadioGroup {...field} row onChange={(e) => setFieldValue(`criteriaScores[${criterion.criteriaID}]`, parseInt(e.target.value))}>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <FormControlLabel
                              key={value}
                              value={value}
                              control={<Radio />}
                              label={value.toString()}
                            />
                          ))}
                        </RadioGroup>
                      )}
                    </Field>
                    <Field name={`criteriaFeedback[${criterion.criteriaID}]`}>
                      {({ field }: FieldProps) => (
                        <TextareaAutosize
                          {...field}
                          minRows={2}
                          placeholder="Add feedback (optional)"
                          style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      )}
                    </Field>
                    {touched.criteriaScores?.[criterion.criteriaID] && errors.criteriaScores && typeof errors.criteriaScores === 'string' && (
                      <Typography color="error" variant="caption">{errors.criteriaScores}</Typography>
                    )}
                  </Box>
                ))}
              </Box>
              {/* <Alert severity="info" sx={{ borderRadius: 2 }}>
                The above criteria are applied the same way for all employees.
              </Alert> */}
              {createEvaluationMutation.isError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  Error creating evaluation: {createEvaluationMutation.error?.message || 'Unknown error'}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || createEvaluationMutation.isPending} // Changed to isPending
                  fullWidth
                  startIcon={isSubmitting || createEvaluationMutation.isPending ? <CircularProgress size={20} /> : null} // Changed to isPending
                >
                  {isSubmitting || createEvaluationMutation.isPending ? 'Creating...' : 'Save'} 
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/evaluations/view')}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>

              <Dialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
                aria-labelledby="confirm-save-title"
              >
                <DialogTitle id="confirm-save-title">Confirm Save</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Are you sure you want to save this evaluation? You can optionally update the employee's performance score after saving.
                  </DialogContentText>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={updatePerformance}
                        onChange={(e) => setUpdatePerformance(e.target.checked)}
                      />
                    }
                    label="Recalculate performance after saving"
                    sx={{ mt: 2 }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenConfirmDialog(false)} disabled={createEvaluationMutation.isPending}>
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (pendingEvaluationData) {
                        createEvaluationMutation.mutate(pendingEvaluationData);
                      }
                      setOpenConfirmDialog(false);
                    }}
                    variant="contained"
                    color="primary"
                    disabled={createEvaluationMutation.isPending}
                    startIcon={createEvaluationMutation.isPending ? <CircularProgress size={20} /> : null}
                  >
                    {createEvaluationMutation.isPending ? 'Saving...' : 'Confirm'}
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default CreateEvaluation;