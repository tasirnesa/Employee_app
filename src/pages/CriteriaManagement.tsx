import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button, TextField, Container, Typography } from '@mui/material';
import axios from 'axios';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
}).required();

type CriteriaForm = {
  title: string;
  description: string;
};

function CriteriaManagement() {
  const { register, handleSubmit, formState: { errors } } = useForm<CriteriaForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: CriteriaForm) => {
    try {
      await axios.post('http://localhost:3000/api/criteria', {
        ...data,
        createdBy: 1, // Replace with actual user ID
        createdDate: new Date().toISOString(),
      });
      alert('Criteria added!');
    } catch (error) {
      console.error('Criteria creation failed', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Criteria Management</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Title"
          fullWidth
          margin="normal"
          {...register('title')}
          error={!!errors.title}
          helperText={errors.title?.message}
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          {...register('description')}
          error={!!errors.description}
          helperText={errors.description?.message}
        />
        <Button type="submit" variant="contained" color="primary">
          Add Criteria
        </Button>
      </form>
    </Container>
  );
}

export default CriteriaManagement;