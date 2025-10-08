import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  blockEmployee?: boolean;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  blockEmployee = false, 
  requireAuth = true 
}) => {
  const { user } = useUser();
  const token = localStorage.getItem('token');
  const location = useLocation();

  // Check authentication
  if (requireAuth && !token) {
    return <Navigate to="/login" replace />;
  }

  // Force first-time users to change password, but allow the change-password page itself
  console.log('ProtectedRoute - user:', user);
  console.log('ProtectedRoute - user.isFirstLogin:', user?.isFirstLogin);
  console.log('ProtectedRoute - location.pathname:', location.pathname);
  
  if (user && String(user.isFirstLogin).toLowerCase() === 'true' && location.pathname !== '/change-password') {
    console.log('ProtectedRoute - Redirecting to change-password');
    return <Navigate to="/change-password" replace />;
  }

  if (blockEmployee && user && user.role === 'Employee') {

    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
