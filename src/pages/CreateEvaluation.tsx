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
} from '@mui/material';
import type { Evaluation, User, Criteria } from '../types/interfaces';

const CreateEvaluation: React.FC = () => {
  console.log('CreateEvaluation rendering');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEvaluator, setSelectedEvaluator] = useState<number | null>(null);

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched users:', response.data);
      return response.data as User[];
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
      return response.data as Criteria[];
    },
  });

  const createEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: Partial<Evaluation>) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.post('http://localhost:3000/api/evaluations', evaluationData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      navigate('/evaluations/view');
    },
    onError: (error: any) => {
      console.error('Create evaluation error:', error.response?.data || error.message);
    },
  });

  const validationSchema = Yup.object({
    evaluatorID: Yup.number().required('Evaluator is required'),
    evaluateeID: Yup.number().required('Evaluatee is required').test(
      'not-same-as-evaluator',
      'Evaluatee cannot be the same as evaluator',
      (value, context) => value !== context.parent.evaluatorID
    ),
    evaluationType: Yup.string().required('Evaluation type is required'),
    sessionID: Yup.number().required('Session ID is required').positive().integer(),
    criteriaScores: Yup.object().test(
      'criteria-required',
      'At least one criterion score is required',
      (value) => Object.values(value || {}).some(score => score !== undefined && score !== 0)
    ),
  });

  if (usersLoading || criteriaLoading) return <Typography>Loading data...</Typography>;
  if (usersError) return <Typography color="error">Error: {(usersError as Error).message}</Typography>;
  if (criteriaError) return <Typography color="error">Error: {(criteriaError as Error).message}</Typography>;

  return (
    <Container maxWidth="sm" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create Evaluation
      </Typography>
      <Formik
        initialValues={{
          evaluatorID: 0,
          evaluateeID: 0,
          evaluationType: '',
          sessionID: 0,
          criteriaScores: {} as { [key: number]: number },
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          createEvaluationMutation.mutate(values);
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting, setFieldValue, values }) => (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth error={touched.evaluatorID && !!errors.evaluatorID}>
                <InputLabel id="evaluator-label">Evaluator</InputLabel>
                <Field
                  as={Select}
                  name="evaluatorID"
                  labelId="evaluator-label"
                  label="Evaluator"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = parseInt(e.target.value);
                    setFieldValue('evaluatorID', value);
                    setSelectedEvaluator(value);
                    if (value === parseInt(values.evaluateeID.toString())) {
                      setFieldValue('evaluateeID', 0);
                    }
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MenuItem value={0} disabled>Select Evaluator</MenuItem>
                  {users?.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.fullName} ({user.userName})
                    </MenuItem>
                  ))}
                </Field>
                {touched.evaluatorID && errors.evaluatorID && (
                  <Typography color="error" variant="caption">{errors.evaluatorID}</Typography>
                )}
              </FormControl>
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
                  {users
                    ?.filter((user) => user.id !== selectedEvaluator)
                    .map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.fullName} ({user.userName})
                      </MenuItem>
                    ))}
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
              <Field
                as={TextField}
                name="sessionID"
                label="Session ID"
                type="number"
                fullWidth
                error={touched.sessionID && !!errors.sessionID}
                helperText={touched.sessionID && errors.sessionID}
                sx={{ bgcolor: 'background.paper' }}
              />
              <Box sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                {criteria?.map((criterion) => (
                  <Box key={criterion.id} sx={{ mb: 2 }}>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {criterion.title}
                    </FormLabel>
                    <Field name={`criteriaScores[${criterion.id}]`}>
                      {({ field }: FieldProps) => (
                        <RadioGroup {...field} row onChange={(e) => setFieldValue(`criteriaScores[${criterion.id}]`, parseInt(e.target.value))}>
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
                    {touched.criteriaScores?.[criterion.id] && errors.criteriaScores && typeof errors.criteriaScores === 'string' && (
                      <Typography color="error" variant="caption">{errors.criteriaScores}</Typography>
                    )}
                  </Box>
                ))}
              </Box>
              {createEvaluationMutation.isError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  Error creating evaluation: {createEvaluationMutation.error?.message || 'Unknown error'}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  fullWidth
                >
                  Create
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/evaluations/view')}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

export default CreateEvaluation;