import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';

interface DepartmentManagementProps {
  open: boolean;
  onClose: () => void;
}

const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    managerId: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch departments
  const { data: departments, isLoading, error: fetchError } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.getDepartments(),
  });

  // Fetch users for manager dropdown
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.getUsers(),
  });

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: (data: { name: string; managerId?: number }) => apiService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      resetForm();
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to create department');
    },
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      resetForm();
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to update department');
    },
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to delete department');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      managerId: '',
    });
    setEditingDepartment(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError('Department name is required');
      return;
    }

    const submitData = {
      name: formData.name,
      managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
    };

    if (editingDepartment) {
      updateDepartmentMutation.mutate({
        id: editingDepartment.id,
        data: submitData,
      });
    } else {
      createDepartmentMutation.mutate(submitData);
    }
  };

  const handleEdit = (department: any) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      managerId: department.managerId?.toString() || '',
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this department? This will fail if there are users assigned to it.')) {
      deleteDepartmentMutation.mutate(id);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {editingDepartment ? 'Edit Department' : 'Manage Departments'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={resetForm}
            size="small"
          >
            Add New
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Department Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          
          <FormControl fullWidth>
            <InputLabel>Manager (Optional)</InputLabel>
            <Select
              value={formData.managerId}
              onChange={(e) => setFormData(prev => ({ ...prev, managerId: e.target.value }))}
              label="Manager"
            >
              <MenuItem value="">No Manager</MenuItem>
              {users?.map((user: any) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.fullName} ({user.userName})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Departments Table */}
        <Typography variant="h6" gutterBottom>
          All Departments
        </Typography>
        
        {isLoading ? (
          <Typography>Loading departments...</Typography>
        ) : fetchError ? (
          <Alert severity="error">
            Error loading departments: {(fetchError as any)?.message}
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Employees</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments?.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon color="primary" />
                        {department.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {department.manager ? (
                        <Chip label={department.manager.fullName} size="small" color="primary" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">No Manager</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${department.users?.length || 0} employees`}
                        size="small"
                        color="default"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(department.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(department)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(department.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
        >
          {editingDepartment ? 'Update' : 'Create'} Department
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentManagement;

