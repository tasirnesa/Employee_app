import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import { useAuth } from '../utils/auth'; // Assuming there's an auth context or hook

const Routes: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();

  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/dashboard">
          {isAuthenticated ? (
            <Dashboard />
          ) : (
            <Redirect to="/login" />
          )}
        </Route>
        <Redirect from="/" to="/dashboard" />
      </Switch>
    </Router>
  );
};

export default Routes;