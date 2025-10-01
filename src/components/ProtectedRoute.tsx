import React from 'react';
import { Navigate } from 'react-router-dom';
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

  // Check authentication
  if (requireAuth && !token) {
    return <Navigate to="/login" replace />;
  }

  if (blockEmployee && user && user.role === 'Employee') {

    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
