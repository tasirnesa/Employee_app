import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { User } from '../types/interfaces.ts';

const ViewUsers: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openAuthorizeDialog, setOpenAuthorizeDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Token:', token);
      if (!token) throw new Error('No authentication token');
      try {
        const response = await axios.get('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched users:', response.data);
        return response.data as User[];
      } catch (err: any) {
        console.error('Fetch users error:', err.response?.data || err.message);
        throw err;
      }
    },
  });

  const toBool = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      await axios.delete(`http://localhost:3000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpenDeleteDialog(false);
    },
    onError: (error: any) => {
      console.error('Delete error:', error.response?.data || error.message);
    },
  });

  const authorizeMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      await axios.put(`http://localhost:3000/api/users/${userId}/authorize`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpenAuthorizeDialog(false);
    },
    onError: (error: any) => {
      console.error('Authorize error:', error.response?.data || error.message);
    },
  });

  const handleEditOpen = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      userName: user.userName,
      gender: user.gender,
      age: user.age,
      role: user.role,
    });
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
    setEditForm({});
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');
    try {
      await axios.put(`http://localhost:3000/api/users/${selectedUser.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleEditClose();
    } catch (error: any) {
      console.error('Edit error:', error.response?.data || error.message);
    }
  };

  const handleDeleteOpen = (user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
    setSelectedUser(null);
  };

  const handleAuthorizeOpen = (user: User) => {
    setSelectedUser(user);
    setOpenAuthorizeDialog(true);
  };

  const handleAuthorizeClose = () => {
    setOpenAuthorizeDialog(false);
    setSelectedUser(null);
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {(error as Error).message}</Typography>;

  return (
    <Container sx={{ mt: 8 }} className="users-container">
      <Typography variant="h4" gutterBottom>
        View Users
      </Typography>
      {users && users.length > 0 ? (
        <TableContainer component={Paper} className="users-table-container">
          <Table stickyHeader className="users-table">
            <TableHead>
              <TableRow>
                <TableCell className="users-th">ID</TableCell>
                <TableCell className="users-th">Full Name</TableCell>
                <TableCell className="users-th">Username</TableCell>
                <TableCell className="users-th">Gender</TableCell>
                <TableCell className="users-th">Age</TableCell>
                <TableCell className="users-th">Role</TableCell>
                <TableCell className="users-th">Status</TableCell>
                <TableCell className="users-th">Locked</TableCell>
                <TableCell className="users-th">First Login</TableCell>
                <TableCell className="users-th">Active</TableCell>
                <TableCell className="users-th">Created Date</TableCell>
                <TableCell className="users-th">Created By</TableCell>
                <TableCell className="users-th">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="users-tr">
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="users-name">{user.fullName}</TableCell>
                  <TableCell>{user.userName}</TableCell>
                  <TableCell>{user.gender}</TableCell>
                  <TableCell>{user.age}</TableCell>
                  <TableCell>
                    <span className={`role-badge role-${String(user.role).toLowerCase()}`}>{user.role}</span>
                  </TableCell>
                  <TableCell>
                    <span className={toBool(user.status) ? 'chip chip-success' : 'chip chip-warning'}>
                      {toBool(user.status) ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={toBool(user.locked) ? 'chip chip-error' : 'chip chip-neutral'}>
                      {toBool(user.locked) ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={toBool(user.isFirstLogin) ? 'chip chip-info' : 'chip chip-neutral'}>
                      {toBool(user.isFirstLogin) ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={toBool(user.activeStatus) ? 'chip chip-success' : 'chip chip-warning'}>
                      {toBool(user.activeStatus) ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.createdDate).toLocaleDateString()}</TableCell>
                  <TableCell>{user.createdBy}</TableCell>
                  <TableCell className="users-actions">
                    <div className="users-actions-row">
                      <Tooltip title="Edit" arrow>
                        <IconButton size="small" className="action-btn action-edit" onClick={() => handleEditOpen(user)} aria-label="edit">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <IconButton size="small" className="action-btn action-delete" onClick={() => handleDeleteOpen(user)} aria-label="delete">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Detail" arrow>
                        <IconButton size="small" className="action-btn action-detail" onClick={() => navigate(`/users/${user.id}`)} aria-label="detail">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Authorize" arrow>
                        <IconButton size="small" className="action-btn action-authorize" onClick={() => handleAuthorizeOpen(user)} aria-label="authorize">
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No users available.</Typography>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleEditClose} className="users-dialog">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name"
            value={editForm.fullName || ''}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Username"
            value={editForm.userName || ''}
            onChange={(e) => setEditForm({ ...editForm, userName: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Gender"
            value={editForm.gender || ''}
            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Age"
            type="number"
            value={editForm.age || ''}
            onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Role"
            value={editForm.role || ''}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteClose} className="users-dialog">
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete user {selectedUser?.fullName}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>Cancel</Button>
          <Button
            onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Authorize Dialog */}
      <Dialog open={openAuthorizeDialog} onClose={handleAuthorizeClose} className="users-dialog">
        <DialogTitle>Authorize User</DialogTitle>
        <DialogContent>
          <Typography>Authorize user {selectedUser?.fullName}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAuthorizeClose}>Cancel</Button>
          <Button
            onClick={() => selectedUser && authorizeMutation.mutate(selectedUser.id)}
            variant="contained"
            color="success"
          >
            Authorize
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ViewUsers;