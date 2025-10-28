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
import BadgeIcon from '@mui/icons-material/Badge';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface PositionManagementProps {
  open: boolean;
  onClose: () => void;
}

const PositionManagement: React.FC<PositionManagementProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    reportsTo: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch positions
  const { data: positions, isLoading, error: fetchError } = useQuery({
    queryKey: ['positions'],
    queryFn: () => apiService.getPositions(),
  });

  // Create position mutation
  const createPositionMutation = useMutation({
    mutationFn: (data: { name: string; level: number; reportsTo?: number }) => apiService.createPosition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      resetForm();
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to create position');
    },
  });

  // Update position mutation
  const updatePositionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiService.updatePosition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      resetForm();
      setError(null);
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to update position');
    },
  });

  // Delete position mutation
  const deletePositionMutation = useMutation({
    mutationFn: (id: number) => apiService.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: (error: any) => {
      setError(error?.response?.data?.error || 'Failed to delete position');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      level: '',
      reportsTo: '',
    });
    setEditingPosition(null);
    setError(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.level) {
      setError('Position name and level are required');
      return;
    }

    const submitData = {
      name: formData.name,
      level: parseInt(formData.level),
      reportsTo: formData.reportsTo ? parseInt(formData.reportsTo) : undefined,
    };

    if (editingPosition) {
      updatePositionMutation.mutate({
        id: editingPosition.id,
        data: submitData,
      });
    } else {
      createPositionMutation.mutate(submitData);
    }
  };

  const handleEdit = (position: any) => {
    setEditingPosition(position);
    setFormData({
      name: position.name,
      level: position.level.toString(),
      reportsTo: position.reportsTo?.toString() || '',
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this position? This will fail if there are users or subordinate positions.')) {
      deletePositionMutation.mutate(id);
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
            {editingPosition ? 'Edit Position' : 'Manage Positions'}
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
            label="Position Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Senior Developer, Marketing Manager"
            required
          />
          
          <TextField
            fullWidth
            label="Hierarchy Level"
            type="number"
            value={formData.level}
            onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
            placeholder="1 = Highest (e.g., President), 2 = Vice President, etc."
            required
            inputProps={{ min: 1 }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Reports To (Optional)</InputLabel>
            <Select
              value={formData.reportsTo}
              onChange={(e) => setFormData(prev => ({ ...prev, reportsTo: e.target.value }))}
              label="Reports To"
            >
              <MenuItem value="">No Higher Position</MenuItem>
              {positions?.map((pos: any) => {
                if (editingPosition && pos.id === editingPosition.id) return null;
                return (
                  <MenuItem key={pos.id} value={pos.id}>
                    {pos.name} (Level {pos.level})
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        {/* Positions Table */}
        <Typography variant="h6" gutterBottom>
          All Positions
        </Typography>
        
        {isLoading ? (
          <Typography>Loading positions...</Typography>
        ) : fetchError ? (
          <Alert severity="error">
            Error loading positions: {(fetchError as any)?.message}
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Reports To</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positions?.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BadgeIcon color="primary" />
                        {position.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={<TrendingUpIcon />}
                        label={`Level ${position.level}`}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      {position.reportsToPosition ? (
                        <Chip label={position.reportsToPosition.name} size="small" color="info" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">Top Level</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${position.users?.length || 0} users`}
                        size="small"
                        color="default"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(position.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(position)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(position.id)}
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
          disabled={createPositionMutation.isPending || updatePositionMutation.isPending}
        >
          {editingPosition ? 'Update' : 'Create'} Position
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PositionManagement;

