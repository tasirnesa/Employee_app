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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';

interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

const TodoList: React.FC = () => {
  const { user } = useUser();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem(`todos_${user?.id}`);
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, [user?.id]);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`todos_${user.id}`, JSON.stringify(todos));
    }
  }, [todos, user?.id]);

  const handleAddTodo = () => {
    if (newTodo.title.trim() === '') return;
    
    const todo: Todo = {
      id: Date.now(),
      title: newTodo.title,
      description: newTodo.description,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.id || 0,
    };
    
    setTodos([...todos, todo]);
    setNewTodo({ title: '', description: '' });
  };

  const handleToggleComplete = (id: number) => {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() } : todo
      )
    );
  };

  const handleDeleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setOpenDialog(true);
  };

  const handleUpdateTodo = () => {
    if (!editingTodo || editingTodo.title.trim() === '') return;
    
    setTodos(
      todos.map(todo =>
        todo.id === editingTodo.id
          ? { ...editingTodo, updatedAt: new Date().toISOString() }
          : todo
      )
    );
    
    setEditingTodo(null);
    setOpenDialog(false);
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
              disabled={newTodo.title.trim() === ''}
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
          {todos.length === 0 ? (
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
          <Button onClick={handleUpdateTodo} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TodoList;