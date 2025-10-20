import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Typography, Button, Card, IconButton } from '@mui/material';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateUser from './pages/CreateUser';
import ViewUsers from './pages/ViewUsers';
import UserDetail from './pages/UserDetail';
import CreateCriteria from './pages/CreateCriteria';
import ViewCriteria from './pages/ViewCriteria';
import CreateEvaluation from './pages/CreateEvaluation';
import ViewEvaluations from './pages/ViewEvaluations';
import EvaluationDetails from './pages/EvaluationDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Header from './components/Header';
import RightRail from './components/RightRail';
import Sidebar from './Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider, useUser } from './context/UserContext';
import theme from './theme';
import type { User } from './types/interfaces';
import ScheduleMenu from './pages/ScheduleMenu';
import GoalsMenu from './pages/GoalsPage';
import PerformanceMenu from './pages/PerformanceMenu';
import ViewEmployees from './pages/ViewEmployees';
import CreateEmployee from './pages/CreateEmployee';
import EditEmployee from './pages/EditEmployee';
import ChangePassword from './pages/ChangePassword';
import TodoList from './pages/TodoList';

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
    retry: 1,
  });

  const { setUser } = useUser();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    refetch();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
        <Button variant="contained" color="error" onClick={handleLogout} sx={{ mt: 2 }}>
          Log Out
        </Button>
      </Box>
    );
  }

  // Check if user is on first login and needs to change password
  const isFirstLogin = currentUser && String(currentUser.isFirstLogin).toLowerCase() === 'true';
  const showSidebarAndHeader = isAuthenticated && !isFirstLogin;
  
  console.log('App render - currentUser:', currentUser);
  console.log('App render - isFirstLogin:', isFirstLogin);
  console.log('App render - showSidebarAndHeader:', showSidebarAndHeader);

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <CssBaseline />
      {showSidebarAndHeader && <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: showSidebarAndHeader ? `calc(100% - ${sidebarCollapsed ? 72 : 240}px)` : '100%',
          ml: showSidebarAndHeader ? `${sidebarCollapsed ? 72 : 240}px` : 0,
          transition: 'width 0.3s, margin-left 0.3s',
        }}
      >
        {showSidebarAndHeader && <Header collapsed={sidebarCollapsed} onToggle={toggleSidebar} />}
        <Box sx={{ p: 0, minHeight: isFirstLogin ? '100vh' : 'calc(100vh - 64px)' }}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/users/create" element={<ProtectedRoute blockEmployee={true}><CreateUser /></ProtectedRoute>} />
            <Route path="/users/view" element={<ProtectedRoute blockEmployee={true}><ViewUsers /></ProtectedRoute>} />
            <Route path="/users/:id" element={<ProtectedRoute blockEmployee={true}><UserDetail /></ProtectedRoute>} />
            <Route path="/criteria/create" element={<ProtectedRoute blockEmployee={true}><CreateCriteria /></ProtectedRoute>} />
            <Route path="/criteria/view" element={<ProtectedRoute><ViewCriteria /></ProtectedRoute>} />
            <Route path="/evaluations/create" element={<ProtectedRoute blockEmployee={true}><CreateEvaluation /></ProtectedRoute>} />
            <Route path="/evaluations/view" element={<ProtectedRoute><ViewEvaluations /></ProtectedRoute>} />
            <Route path="/evaluations/:id" element={<ProtectedRoute><EvaluationDetails /></ProtectedRoute>} />
            <Route path="/employees/view" element={<ProtectedRoute blockEmployee={true}><ViewEmployees /></ProtectedRoute>} />
            <Route path="/employees/create" element={<ProtectedRoute blockEmployee={true}><CreateEmployee /></ProtectedRoute>} />
            <Route path="/employees/:id/edit" element={<ProtectedRoute blockEmployee={true}><EditEmployee /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><ScheduleMenu /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><GoalsMenu /></ProtectedRoute>} />
            <Route path="/analytics-performance" element={<ProtectedRoute><PerformanceMenu /></ProtectedRoute>} />
            <Route path="/todo" element={<ProtectedRoute><TodoList /></ProtectedRoute>} />
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          </Routes>
        </Box>
      </Box>
      {showSidebarAndHeader && <RightRail />}
    </Box>
  );
};

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