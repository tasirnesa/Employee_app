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
import MenuIcon from '@mui/icons-material/Menu';
import  DashboardCustomizeIcon  from '@mui/icons-material/ChevronLeft';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const drawerWidth = 240; // Define drawerWidth as a constant

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
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
    navigate('/analytics-performance');
  };

  const handleSchedule = () => {
    console.log('Navigating to schedule');
    navigate('/schedule');
  };

  const handleToggle = () => {
    console.log('Toggling sidebar');
    if (onToggle) onToggle();
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? 60 : drawerWidth,
          flexShrink: 0,
          transition: 'width 0.3s',
          [`& .MuiDrawer-paper`]: {
            width: collapsed ? 60 : drawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s',
            overflowX: 'hidden',
          },
        }}
      >
        <List>
          <ListItem disablePadding sx={{ justifyContent: 'center', py: 1 }}>
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              onClick={handleToggle}
              edge="start"
            >
              {collapsed ? <MenuIcon /> : < DashboardCustomizeIcon  />}
            </IconButton>
          </ListItem>
          {userProfile && (
            <ListItem disablePadding sx={{ justifyContent: collapsed ? 'center' : 'flex-start', py: 1 }}>
              <ListItemText
                primary={`Logged in as: ${userProfile.fullName || 'Unknown User'}`}
                sx={{ pl: collapsed ? 0 : 2, opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }}
              />
            </ListItem>
          )}
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/dashboard'}
              onClick={() => navigate('/dashboard')}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith('/users')}
              onClick={handleUserManagementMenuOpen}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && <ArrowDropDownIcon />}
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith('/criteria')}
              onClick={handleCriteriaManagementMenuOpen}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="Criteria Management" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && <ArrowDropDownIcon />}
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith('/evaluations')}
              onClick={handleEvaluationsMenuOpen}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <RateReviewIcon />
              </ListItemIcon>
              <ListItemText primary="Evaluations" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && <ArrowDropDownIcon />}
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/goals'}
              onClick={handleGoals}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <FlagIcon />
              </ListItemIcon>
              <ListItemText primary="Goals" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/analytics-performance'}
              onClick={handleAnalyticsPerformance}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Analytics Performance" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/schedule'}
              onClick={handleSchedule}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <EventIcon />
              </ListItemIcon>
              <ListItemText primary="Schedule" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/reports'}
              onClick={() => navigate('/reports')}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="Reports" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
              sx={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 56, justifyContent: 'center' }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
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