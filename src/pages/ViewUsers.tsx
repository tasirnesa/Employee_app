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
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        View Users
      </Typography>
      {users && users.length > 0 ? (
        <TableContainer component={Paper} sx={{ maxHeight: 400, maxWidth: '100%', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
<<<<<<< HEAD
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Full Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Age</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Locked</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>First Login</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Action</TableCell>
=======
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Full Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Age</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Locked</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>First Login</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Created Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#197bdcff' }}>Action</TableCell>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.userName}</TableCell>
                  <TableCell>{user.gender}</TableCell>
                  <TableCell>{user.age}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.status ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>{user.locked ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{user.isFirstLogin ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{user.activeStatus ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{new Date(user.createdDate).toLocaleDateString()}</TableCell>
                  <TableCell>{user.createdBy}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditOpen(user)} aria-label="edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteOpen(user)} aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                    <IconButton onClick={() => navigate(`/users/${user.id}`)} aria-label="detail">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton onClick={() => handleAuthorizeOpen(user)} aria-label="authorize">
                      <CheckCircleIcon />
                    </IconButton>
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
      <Dialog open={openEditDialog} onClose={handleEditClose}>
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
      <Dialog open={openDeleteDialog} onClose={handleDeleteClose}>
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
      <Dialog open={openAuthorizeDialog} onClose={handleAuthorizeClose}>
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