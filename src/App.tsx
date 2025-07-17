import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Typography, Button } from '@mui/material';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
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
import type { User } from './types/interfaces.ts';

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

  const { data: currentUser, isLoading, error } = useQuery({
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
      console.log('Fetched current user:', response.data);
      return response.data as User;
    },
    enabled: isAuthenticated,
  });

  if (isAuthenticated && isLoading) {
    console.log('Loading user data...');
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading user data...</Typography>
      </Box>
    );
  }

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
          Log Out
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
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
      </Box>
    </Box>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;