import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import type { LeaveType } from '../types/interfaces';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Switch,
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
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface LeaveTypeManagementProps {
  open: boolean;
  onClose: () => void;
}

const LeaveTypeManagement: React.FC<LeaveTypeManagementProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxDays: '',
    isPaid: true,
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch leave types
  const { data: leaveTypes, isLoading, error: fetchError } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => apiService.getLeaveTypes(),
  });

  // Create leave type mutation
  const createLeaveTypeMutation = useMutation({
    mutationFn: (data: Partial<LeaveType>) => apiService.createLeaveType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
      resetForm();
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to create leave type');
    },
  });

  // Update leave type mutation
  const updateLeaveTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LeaveType> }) => 
      apiService.updateLeaveType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
      resetForm();
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to update leave type');
    },
  });

  // Delete leave type mutation
  const deleteLeaveTypeMutation = useMutation({
    mutationFn: (id: number) => apiService.deleteLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to delete leave type');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      maxDays: '',
      isPaid: true,
      isActive: true,
    });
    setEditingLeaveType(null);
    setError(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    const submitData = {
      ...formData,
      maxDays: formData.maxDays ? parseInt(formData.maxDays) : null,
    };

    if (editingLeaveType) {
      updateLeaveTypeMutation.mutate({
        id: editingLeaveType.id,
        data: submitData,
      });
    } else {
      createLeaveTypeMutation.mutate(submitData);
    }
  };

  const handleEdit = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    setFormData({
      name: leaveType.name,
      description: leaveType.description || '',
      maxDays: leaveType.maxDays?.toString() || '',
      isPaid: leaveType.isPaid,
      isActive: leaveType.isActive,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this leave type?')) {
      deleteLeaveTypeMutation.mutate(id);
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
            {editingLeaveType ? 'Edit Leave Type' : 'Manage Leave Types'}
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
            label="Leave Type Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          
          <TextField
            fullWidth
            label="Maximum Days (Optional)"
            type="number"
            value={formData.maxDays}
            onChange={(e) => handleInputChange('maxDays', e.target.value)}
            inputProps={{ min: 0 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPaid}
                  onChange={(e) => handleInputChange('isPaid', e.target.checked)}
                />
              }
              label="Paid Leave"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="Active"
            />
          </Box>
        </Box>

        {/* Leave Types Table */}
        <Typography variant="h6" gutterBottom>
          Existing Leave Types
        </Typography>
        
        {isLoading ? (
          <Typography>Loading leave types...</Typography>
        ) : fetchError ? (
          <Alert severity="error">
            Error loading leave types: {(fetchError as any)?.message}
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Max Days</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaveTypes?.map((leaveType) => (
                  <TableRow key={leaveType.id}>
                    <TableCell>{leaveType.name}</TableCell>
                    <TableCell>{leaveType.description || '-'}</TableCell>
                    <TableCell>{leaveType.maxDays || 'Unlimited'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={leaveType.isPaid ? <CheckCircleIcon /> : <CancelIcon />}
                        label={leaveType.isPaid ? 'Paid' : 'Unpaid'}
                        color={leaveType.isPaid ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={leaveType.isActive ? 'Active' : 'Inactive'}
                        color={leaveType.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(leaveType)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(leaveType.id)}
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
          disabled={createLeaveTypeMutation.isPending || updateLeaveTypeMutation.isPending}
        >
          {editingLeaveType ? 'Update' : 'Create'} Leave Type
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveTypeManagement;
