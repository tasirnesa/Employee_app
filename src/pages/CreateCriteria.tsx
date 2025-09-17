import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from '@mui/material';
import type { EvaluationCriteria } from '../types/interfaces';

const CreateCriteria: React.FC = () => {
  console.log('CreateCriteria rendering');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createCriteriaMutation = useMutation({
    mutationFn: async (criteriaData: Partial<EvaluationCriteria>) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const response = await axios.post('http://localhost:3000/api/criteria', {
        ...criteriaData,
        createdBy: 1, // Replace with actual user ID logic
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
      navigate('/criteria/view');
    },
    onError: (error: any) => {
      console.error('Create criteria error:', error.response?.data || error.message);
    },
  });

  const validationSchema = Yup.object({
    title: Yup.string().required('Criteria Title is required'),
    description: Yup.string().nullable(),
  });

  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Create Criteria
      </Typography>
      <Formik
        initialValues={{
          title: '',
          description: '',
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          createCriteriaMutation.mutate(values);
          setSubmitting(false);
        }}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Field
                as={TextField}
                name="title"
                label="Criteria Title"
                fullWidth
                error={touched.title && !!errors.title}
                helperText={touched.title && errors.title}
              />
              <Field
                as={TextField}
                name="description"
                label="Description"
                multiline
                rows={4}
                fullWidth
                error={touched.description && !!errors.description}
                helperText={touched.description && errors.description}
              />
              {createCriteriaMutation.isError && (
                <Alert severity="error">
                  Error creating criteria: {createCriteriaMutation.error?.message || 'Unknown error'}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  Create
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/criteria/view')}
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

export default CreateCriteria;