<<<<<<< HEAD
import React from 'react';
=======
import React, { useState } from 'react';
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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
<<<<<<< HEAD
} from '@mui/material';
import type { EvaluationCriteria } from '../types/interfaces';
=======
  Input,
} from '@mui/material';
import type { EvaluationCriteria } from '../types/interfaces';
import Papa from 'papaparse'; 
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed

const CreateCriteria: React.FC = () => {
  console.log('CreateCriteria rendering');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
<<<<<<< HEAD

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
=======
  const [fileError, setFileError] = useState<string | null>(null);

  const createCriteriaMutation = useMutation({
    mutationFn: async (criteriaData: Partial<EvaluationCriteria> | EvaluationCriteria[]) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      const requestData = Array.isArray(criteriaData)
        ? criteriaData.map(item => ({
            ...item,
            criteriaID: 0, 
            createdBy: 1, 
            createdDate: new Date().toISOString(),
          }))
        : {
            ...criteriaData,
            criteriaID: 0, 
            createdBy: 1, 
            createdDate: new Date().toISOString(), 
          };
      console.log('Sending data to backend:', requestData);
      const response = await axios.post(
        Array.isArray(criteriaData) ? 'http://localhost:3000/api/criteria/bulk' : 'http://localhost:3000/api/criteria',
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Backend response:', response.data);
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['criteria'] });
      navigate('/criteria/view');
    },
    onError: (error: any) => {
      console.error('Create criteria error:', error.response?.data || error.message);
<<<<<<< HEAD
=======
      setFileError(error.response?.data?.message || 'Unknown error during upload');
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    },
  });

  const validationSchema = Yup.object({
    title: Yup.string().required('Criteria Title is required'),
    description: Yup.string().nullable(),
  });

<<<<<<< HEAD
  return (
    <Container sx={{ mt: 8 }}>
=======
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setFieldValue: (field: string, value: any) => void) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileError('No file selected');
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (result: any) => { 
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
    } as any); 
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
      <Typography variant="h4" gutterBottom>
        Create Criteria
      </Typography>
      <Formik
        initialValues={{
          title: '',
          description: '',
<<<<<<< HEAD
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
=======
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
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
              <Field
                as={TextField}
                name="title"
                label="Criteria Title"
                fullWidth
                error={touched.title && !!errors.title}
                helperText={touched.title && errors.title}
<<<<<<< HEAD
=======
                sx={{ bgcolor: 'background.paper' }}
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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
<<<<<<< HEAD
              />
              {createCriteriaMutation.isError && (
                <Alert severity="error">
                  Error creating criteria: {createCriteriaMutation.error?.message || 'Unknown error'}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2 }}>
=======
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
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
<<<<<<< HEAD
=======
                  fullWidth
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
                >
                  Create
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/criteria/view')}
<<<<<<< HEAD
=======
                  fullWidth
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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