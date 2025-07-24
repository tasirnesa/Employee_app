import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FlagIcon from '@mui/icons-material/Flag';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EventIcon from '@mui/icons-material/Event';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userManagementAnchorEl, setUserManagementAnchorEl] = useState<null | HTMLElement>(null);
  const [criteriaManagementAnchorEl, setCriteriaManagementAnchorEl] = useState<null | HTMLElement>(null);
  const [evaluationsAnchorEl, setEvaluationsAnchorEl] = useState<null | HTMLElement>(null);
  const [userProfile, setUserProfile] = useState<{ fullName?: string } | null>(null);
  const userManagementOpen = Boolean(userManagementAnchorEl);
  const criteriaManagementOpen = Boolean(criteriaManagementAnchorEl);
  const evaluationsOpen = Boolean(evaluationsAnchorEl);

  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    }
  }, []);

  const handleUserManagementMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Opening user management menu');
    setUserManagementAnchorEl(event.currentTarget);
  };

  const handleUserManagementMenuClose = () => {
    console.log('Closing user management menu');
    setUserManagementAnchorEl(null);
  };

  const handleCriteriaManagementMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Opening criteria management menu');
    setCriteriaManagementAnchorEl(event.currentTarget);
  };

  const handleCriteriaManagementMenuClose = () => {
    console.log('Closing criteria management menu');
    setCriteriaManagementAnchorEl(null);
  };

  const handleEvaluationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Opening evaluations menu');
    setEvaluationsAnchorEl(event.currentTarget);
  };

  const handleEvaluationsMenuClose = () => {
    console.log('Closing evaluations menu');
    setEvaluationsAnchorEl(null);
  };

  const handleCreateUser = () => {
    console.log('Navigating to create user');
    setUserManagementAnchorEl(null);
    navigate('/users/create');
  };

  const handleViewUsers = () => {
    console.log('Navigating to view users');
    setUserManagementAnchorEl(null);
    navigate('/users/view');
  };

  const handleCreateCriteria = () => {
    console.log('Navigating to create criteria');
    setCriteriaManagementAnchorEl(null);
    navigate('/criteria/create');
  };

  const handleViewCriteria = () => {
    console.log('Navigating to view criteria');
    setCriteriaManagementAnchorEl(null);
    navigate('/criteria/view');
  };

  const handleCreateEvaluation = () => {
    console.log('Navigating to create evaluation');
    setEvaluationsAnchorEl(null);
    navigate('/evaluations/create');
  };

  const handleViewEvaluations = () => {
    console.log('Navigating to view evaluations');
    setEvaluationsAnchorEl(null);
    navigate('/evaluations/view');
  };

  const handleGoals = () => {
    console.log('Navigating to goals');
    navigate('/goals');
  };

  const handleAnalyticsPerformance = () => {
    console.log('Navigating to analytics performance');
    navigate('/analytics/performance');
  };

  const handleSchedule = () => {
    console.log('Navigating to schedule');
    navigate('/schedule');
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <List>
          {userProfile && (
            <ListItem disablePadding>
              <ListItemText
                primary={`Logged in as: ${userProfile.fullName || 'Unknown User'}`}
                sx={{ pl: 2, py: 1, fontWeight: 'bold', color: '#0288d1' }}
              />
            </ListItem>
          )}
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/dashboard'}
              onClick={() => navigate('/dashboard')}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith('/users')}
              onClick={handleUserManagementMenuOpen}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
              <ArrowDropDownIcon />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith('/criteria')}
              onClick={handleCriteriaManagementMenuOpen}
            >
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="Criteria Management" />
              <ArrowDropDownIcon />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith('/evaluations')}
              onClick={handleEvaluationsMenuOpen}
            >
              <ListItemIcon>
                <RateReviewIcon />
              </ListItemIcon>
              <ListItemText primary="Evaluations" />
              <ArrowDropDownIcon />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/goals'}
              onClick={handleGoals}
            >
              <ListItemIcon>
                <FlagIcon />
              </ListItemIcon>
              <ListItemText primary="Goals" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/analytics/performance'}
              onClick={handleAnalyticsPerformance}
            >
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Analytics Performance" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/schedule'}
              onClick={handleSchedule}
            >
              <ListItemIcon>
                <EventIcon />
              </ListItemIcon>
              <ListItemText primary="Schedule" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/reports'}
              onClick={() => navigate('/reports')}
            >
              <ListItemIcon>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="Reports" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Menu
        anchorEl={userManagementAnchorEl}
        open={userManagementOpen}
        onClose={handleUserManagementMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={handleCreateUser} selected={location.pathname === '/users/create'}>Create User</MenuItem>
        <MenuItem onClick={handleViewUsers} selected={location.pathname === '/users/view'}>View Users</MenuItem>
      </Menu>
      <Menu
        anchorEl={criteriaManagementAnchorEl}
        open={criteriaManagementOpen}
        onClose={handleCriteriaManagementMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={handleCreateCriteria} selected={location.pathname === '/criteria/create'}>Create Criteria</MenuItem>
        <MenuItem onClick={handleViewCriteria} selected={location.pathname === '/criteria/view'}>View Criteria</MenuItem>
      </Menu>
      <Menu
        anchorEl={evaluationsAnchorEl}
        open={evaluationsOpen}
        onClose={handleEvaluationsMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={handleCreateEvaluation} selected={location.pathname === '/evaluations/create'}>Create Evaluation</MenuItem>
        <MenuItem onClick={handleViewEvaluations} selected={location.pathname === '/evaluations/view'}>View Evaluations</MenuItem>
      </Menu>
    </>
  );
};

export default Sidebar;