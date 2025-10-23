import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  IconButton,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import * as todoApi from '../api/todoApi';
import type { Todo } from '../types/interfaces';

const TodoList: React.FC = () => {
  const { user } = useUser();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(true);

  // Load todos from API on component mount
  useEffect(() => {
    loadTodos();
  }, [user?.id]);

  const loadTodos = async () => {
    try {
      if (user?.id) {
        setLoading(true);
        const userTodos = await todoApi.getTodos(user.id);
        setTodos(userTodos);
      }
    } catch (error) {
      showSnackbar('Error loading todos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddTodo = async () => {
    if (newTodo.title.trim() === '' || !user?.id) return;
    
    try {
      const todo = await todoApi.createTodo({
        title: newTodo.title,
        description: newTodo.description,
        completed: false,
        userId: user.id,
      });
      
      setTodos([todo, ...todos]);
      setNewTodo({ title: '', description: '' });
      showSnackbar('Todo added successfully', 'success');
    } catch (error) {
      showSnackbar('Error adding todo', 'error');
    }
  };

  const handleToggleComplete = async (id: number) => {
    try {
      const updatedTodo = await todoApi.toggleTodo(id);
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
    } catch (error) {
      showSnackbar('Error updating todo', 'error');
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await todoApi.deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
      showSnackbar('Todo deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Error deleting todo', 'error');
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setOpenDialog(true);
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo || editingTodo.title.trim() === '' || !user?.id) return;
    
    try {
      const updatedTodo = await todoApi.updateTodo(editingTodo.id, {
        title: editingTodo.title,
        description: editingTodo.description,
      });
      
      setTodos(todos.map(todo => todo.id === editingTodo.id ? updatedTodo : todo));
      setEditingTodo(null);
      setOpenDialog(false);
      showSnackbar('Todo updated successfully', 'success');
    } catch (error) {
      showSnackbar('Error updating todo', 'error');
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingTodo(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Todo List
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add New Task
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Task Title"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description (Optional)"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTodo}
              disabled={newTodo.title.trim() === '' || loading}
            >
              Add Task
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Tasks
          </Typography>
          {loading ? (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
              Loading tasks...
            </Typography>
          ) : todos.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
              No tasks yet. Add a new task to get started!
            </Typography>
          ) : (
            <List>
              {todos.map((todo) => (
                <React.Fragment key={todo.id}>
                  <ListItem>
                    <Checkbox
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo.id)}
                      edge="start"
                    />
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {todo.title}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? 'text.secondary' : 'text.secondary',
                          }}
                        >
                          {todo.description}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditTodo(todo)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteTodo(todo.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          setNewTodo({ title: '', description: '' });
          document.querySelector('input')?.focus();
        }}
      >
        <AddIcon />
      </Fab>

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          {editingTodo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Task Title"
                value={editingTodo.title}
                onChange={(e) =>
                  setEditingTodo({ ...editingTodo, title: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Description (Optional)"
                value={editingTodo.description || ''}
                onChange={(e) =>
                  setEditingTodo({ ...editingTodo, description: e.target.value })
                }
                multiline
                rows={2}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleUpdateTodo} variant="contained" disabled={loading}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TodoList;