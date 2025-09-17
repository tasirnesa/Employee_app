import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
<<<<<<< HEAD
import { Box, CssBaseline, Typography, Button } from '@mui/material';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
=======
import { Box, CssBaseline, Typography, Button, Card, IconButton } from '@mui/material';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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
<<<<<<< HEAD
import type { User } from './types/interfaces.ts';
=======
import { UserProvider, useUser } from './context/UserContext';
import theme from './theme';
import type { User } from './types/interfaces';
import ScheduleMenu from './pages/ScheduleMenu';
import GoalsMenu from './pages/GoalsPage';
import PerformanceMenu from './pages/PerformanceMenu';
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed

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

<<<<<<< HEAD
  const { data: currentUser, isLoading, error } = useQuery({
=======
  const { data: currentUser, isLoading, error, refetch } = useQuery({
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
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
<<<<<<< HEAD
      console.log('Fetched current user:', response.data);
      return response.data as User;
    },
    enabled: isAuthenticated,
  });

  if (isAuthenticated && isLoading) {
    console.log('Loading user data...');
    return (
      <Box sx={{ p: 3 }}>
=======
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
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
        <Typography>Loading user data...</Typography>
      </Box>
    );
  }

<<<<<<< HEAD
  if (isAuthenticated && error) {
    console.log('Current user fetch error:', (error as Error).message);
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading user data: {(error as Error).message}</Typography>
        <Typography>
          Please try logging out and logging in again, or check the backend logs.
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            console.log('Logging out due to error');
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          sx={{ mt: 2 }}
        >
=======
  if (error) {
    console.log('Current user fetch error:', (error as any).message);
    return (
      <Box sx={{ p: 3, bgcolor: 'background.default' }}>
        <Typography color="error">Error loading user data: {(error as any).message}</Typography>
        <Typography>
          Please try logging out and logging in again, or check the backend logs.
        </Typography>
        <Button variant="contained" color="error" onClick={handleLogout} sx={{ mt: 2 }}>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
          Log Out
        </Button>
      </Box>
    );
  }

  return (
<<<<<<< HEAD
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {isAuthenticated && <Sidebar />}
=======
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <CssBaseline />
      {isAuthenticated && <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />}
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
<<<<<<< HEAD
          width: `calc(100% - ${240}px)`,
          ml: `${240}px`,
        }}
      >
        {isAuthenticated && <Header user={currentUser ?? null} />}
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
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
        </Routes>
=======
          width: `calc(100% - ${sidebarCollapsed ? 60 : 120}px)`,
          ml: `${sidebarCollapsed ? 60 : 120}px`,
          transition: 'width 0.3s, margin-left 0.3s',
        }}
      >
        {isAuthenticated && <Header collapsed={sidebarCollapsed} onToggle={toggleSidebar} />}
        <Card sx={{ p: 3, minHeight: 'calc(100vh - 120px)' }}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/users/create" element={isAuthenticated ? <CreateUser /> : <Navigate to="/login" />} />
            <Route path="/users/view" element={isAuthenticated ? <ViewUsers /> : <Navigate to="/login" />} />
            <Route path="/users/:id" element={isAuthenticated ? <UserDetail /> : <Navigate to="/login" />} />
            <Route path="/criteria/create" element={isAuthenticated ? <CreateCriteria /> : <Navigate to="/login" />} />
            <Route path="/criteria/view" element={isAuthenticated ? <ViewCriteria /> : <Navigate to="/login" />} />
            <Route path="/evaluations/create" element={isAuthenticated ? <CreateEvaluation /> : <Navigate to="/login" />} />
            <Route path="/evaluations/view" element={isAuthenticated ? <ViewEvaluations /> : <Navigate to="/login" />} />
            <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
            <Route path="/schedule" element={isAuthenticated ? <ScheduleMenu /> : <Navigate to="/login" />} />
            <Route path="/goals" element={isAuthenticated ? <GoalsMenu /> : <Navigate to="/login" />} />
            <Route
              path="/analytics-performance"
              element={isAuthenticated ? <PerformanceMenu /> : <Navigate to="/login" />}
            />
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          </Routes>
        </Card>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
      </Box>
    </Box>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
<<<<<<< HEAD
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
=======
      <ThemeProvider theme={theme}>
        <UserProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </UserProvider>
      </ThemeProvider>
>>>>>>> 52ad83bc437906e8444f927e1b189def214b11ed
    </QueryClientProvider>
  );
}

export default App;