import React, { useState } from 'react';
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
  Input,
} from '@mui/material';
import type { EvaluationCriteria } from '../types/interfaces';
import Papa from 'papaparse'; // For CSV parsing

const CreateCriteria: React.FC = () => {
  console.log('CreateCriteria rendering');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fileError, setFileError] = useState<string | null>(null);

  const createCriteriaMutation = useMutation({
    mutationFn: async (criteriaData: Partial<EvaluationCriteria> | EvaluationCriteria[]) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const requestData = Array.isArray(criteriaData)
        ? criteriaData.map(item => ({
            ...item,
            criteriaID: 0, // Placeholder, to be set by backend
            createdBy: 1, // Replace with actual user ID logic (e.g., from token)
            createdDate: new Date().toISOString(), // Current date as string
          }))
        : {
            ...criteriaData,
            criteriaID: 0, // Placeholder, to be set by backend
            createdBy: 1, // Replace with actual user ID logic
            createdDate: new Date().toISOString(), // Current date as string
          };
      console.log('Sending data to backend:', requestData);
      const response = await axios.post(
        Array.isArray(criteriaData) ? 'http://localhost:3000/api/criteria/bulk' : 'http://localhost:3000/api/criteria',
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Backend response:', response.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
      navigate('/criteria/view');
    },
    onError: (error: any) => {
      console.error('Create criteria error:', error.response?.data || error.message);
      setFileError(error.response?.data?.message || 'Unknown error during upload');
    },
  });

  const validationSchema = Yup.object({
    title: Yup.string().required('Criteria Title is required'),
    description: Yup.string().nullable(),
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setFieldValue: (field: string, value: any) => void) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileError('No file selected');
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (result: any) => { // Temporarily use 'any' until typings are fully resolved
        console.log('Parse result:', result);
        const data = result.data as { title: string; description?: string }[];
        if (!Array.isArray(data)) {
          setFileError('Invalid file format: Data is not an array');
          return;
        }
        const validData = data
          .filter(item => item.title && item.title.trim() !== '')
          .map(item => ({
            criteriaID: 0,
            title: item.title,
            description: item.description,
            createdBy: 1,
            createdDate: new Date().toISOString(),
          } as EvaluationCriteria));
        console.log('Valid data:', validData);
        if (validData.length === 0) {
          setFileError('No valid criteria found in the file');
          return;
        }
        setFieldValue('bulkCriteria', validData);
        setFileError(null);
      },
      error: (error: any) => {
        console.error('Parse error:', error);
        setFileError(`Error parsing file: ${error.message}`);
      },
    } as any); // Type assertion to bypass overload issues
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create Criteria
      </Typography>
      <Formik
        initialValues={{
          title: '',
          description: '',
          bulkCriteria: [] as EvaluationCriteria[],
        }}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          console.log('Form values:', values);
          if (values.bulkCriteria.length > 0) {
            createCriteriaMutation.mutate(values.bulkCriteria);
          } else {
            createCriteriaMutation.mutate({
              criteriaID: 0,
              title: values.title,
              description: values.description,
              createdBy: 1,
              createdDate: new Date().toISOString(),
            });
          }
          setSubmitting(false);
          resetForm();
        }}
      >
        {({ errors, touched, isSubmitting, setFieldValue, values }) => (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Field
                as={TextField}
                name="title"
                label="Criteria Title"
                fullWidth
                error={touched.title && !!errors.title}
                helperText={touched.title && errors.title}
                sx={{ bgcolor: 'background.paper' }}
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
                sx={{ bgcolor: 'background.paper' }}
              />
              <Box>
                <Input
                  type="file"
                  inputProps={{ accept: '.csv' }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, setFieldValue)}
                  sx={{ mb: 1 }}
                />
                {fileError && <Alert severity="error" sx={{ borderRadius: 2 }}>{fileError}</Alert>}
                {values.bulkCriteria.length > 0 && (
                  <Typography>Ready to upload {values.bulkCriteria.length} criteria.</Typography>
                )}
              </Box>
              {createCriteriaMutation.isError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  Error creating criteria: {createCriteriaMutation.error?.message || 'Unknown error'}
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
                  onClick={() => navigate('/criteria/view')}
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

export default CreateCriteria;