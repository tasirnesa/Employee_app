import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Typography, Button, Card } from '@mui/material';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import React, { useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateUser from './pages/CreateUser';
import ViewUsers from './pages/ViewUsers';
import UserDetail from './pages/UserDetail';
import CreateCriteria from './pages/CreateCriteria';
import ViewCriteria from './pages/ViewCriteria';
import CreateEvaluation from './pages/CreateEvaluation';
import ViewEvaluations from './pages/ViewEvaluations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Header from './components/Header';
import Sidebar from './Sidebar';
import { UserProvider, useUser } from './context/UserContext';
import theme from './theme';
import type { User } from './types/interfaces';
import ScheduleMenu from './pages/ScheduleMenu';
import GoalsMenu from './pages/GoalsPage'; // Ensure this matches your file name

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const AppContent: React.FC = () => {
  console.log('App component rendering');
  const isAuthenticated = !!localStorage.getItem('token');
  console.log('isAuthenticated:', isAuthenticated);

  const { data: currentUser, isLoading, error, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('Token for /api/users/me:', token);
      if (!token) {
        console.error('No token found');
        throw new Error('No authentication token');
      }
      const response = await axios.get('http://localhost:3000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched current user from API:', response.data);
      return response.data as User;
    },
    enabled: isAuthenticated,
    retry: 1, // Limit retries to avoid repeated 403 attempts
  });

  const { setUser } = useUser();
  const navigate = useNavigate(); // Add navigation for logout

  useEffect(() => {
    if (currentUser) {
      console.log('Setting user in context:', currentUser);
      setUser(currentUser);
      localStorage.setItem('userProfile', JSON.stringify(currentUser));
    } else if (!isAuthenticated) {
      setUser(null);
      localStorage.removeItem('userProfile');
    }
  }, [currentUser, isAuthenticated, setUser]);

  const handleLogout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setUser(null);
    refetch(); // Clear query cache
    navigate('/login');
  };

  if (isLoading) {
    console.log('Loading user data...');
    return (
      <Box sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography>Loading user data...</Typography>
      </Box>
    );
  }

  if (error) {
    console.log('Current user fetch error:', (error as any).message);
    return (
      <Box sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography color="error">Error loading user data: {(error as any).message}</Typography>
        <Typography>
          Please try logging out and logging in again, or check the backend logs.
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={handleLogout}
          sx={{ mt: 2 }}
        >
          Log Out
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <CssBaseline />
      {isAuthenticated && <Sidebar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${240}px)`,
          ml: `${240}px`,
        }}
      >
        {isAuthenticated && <Header />}
        <Card sx={{ p: 3, minHeight: 'calc(100vh - 120px)' }}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route
              path="/dashboard"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/users/create"
              element={isAuthenticated ? <CreateUser /> : <Navigate to="/login" />}
            />
            <Route
              path="/users/view"
              element={isAuthenticated ? <ViewUsers /> : <Navigate to="/login" />}
            />
            <Route
              path="/users/:id"
              element={isAuthenticated ? <UserDetail /> : <Navigate to="/login" />}
            />
            <Route
              path="/criteria/create"
              element={isAuthenticated ? <CreateCriteria /> : <Navigate to="/login" />}
            />
            <Route
              path="/criteria/view"
              element={isAuthenticated ? <ViewCriteria /> : <Navigate to="/login" />}
            />
            <Route
              path="/evaluations/create"
              element={isAuthenticated ? <CreateEvaluation /> : <Navigate to="/login" />}
            />
            <Route
              path="/evaluations/view"
              element={isAuthenticated ? <ViewEvaluations /> : <Navigate to="/login" />}
            />
            <Route
              path="/reports"
              element={isAuthenticated ? <Reports /> : <Navigate to="/login" />}
            />
            <Route
              path="/settings"
              element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
            />
            <Route
              path="/schedule"
              element={isAuthenticated ? <ScheduleMenu /> : <Navigate to="/login" />}
            />
            <Route
              path="/goals" 
              element={isAuthenticated ? <GoalsMenu /> : <Navigate to="/login" />}
            />
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
            />
          </Routes>
        </Card>
      </Box>
    </Box>
  );
};


import { useNavigate } from 'react-router-dom';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <UserProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;