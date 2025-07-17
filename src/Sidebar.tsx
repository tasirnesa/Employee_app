import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
  console.log('Sidebar rendering');
  const navigate = useNavigate();
  const [userManagementAnchorEl, setUserManagementAnchorEl] = useState<null | HTMLElement>(null);
  const [criteriaManagementAnchorEl, setCriteriaManagementAnchorEl] = useState<null | HTMLElement>(null);
  const [evaluationsAnchorEl, setEvaluationsAnchorEl] = useState<null | HTMLElement>(null);
  const userManagementOpen = Boolean(userManagementAnchorEl);
  const criteriaManagementOpen = Boolean(criteriaManagementAnchorEl);
  const evaluationsOpen = Boolean(evaluationsAnchorEl);

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
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/dashboard')}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleUserManagementMenuOpen}>
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
              <ArrowDropDownIcon />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleCriteriaManagementMenuOpen}>
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="Criteria Management" />
              <ArrowDropDownIcon />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleEvaluationsMenuOpen}>
              <ListItemIcon>
                <RateReviewIcon />
              </ListItemIcon>
              <ListItemText primary="Evaluations" />
              <ArrowDropDownIcon />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/reports')}>
              <ListItemIcon>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="Reports" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/settings')}>
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
        <MenuItem onClick={handleCreateUser}>Create User</MenuItem>
        <MenuItem onClick={handleViewUsers}>View Users</MenuItem>
      </Menu>
      <Menu
        anchorEl={criteriaManagementAnchorEl}
        open={criteriaManagementOpen}
        onClose={handleCriteriaManagementMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={handleCreateCriteria}>Create Criteria</MenuItem>
        <MenuItem onClick={handleViewCriteria}>View Criteria</MenuItem>
      </Menu>
      <Menu
        anchorEl={evaluationsAnchorEl}
        open={evaluationsOpen}
        onClose={handleEvaluationsMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <MenuItem onClick={handleCreateEvaluation}>Create Evaluation</MenuItem>
        <MenuItem onClick={handleViewEvaluations}>View Evaluations</MenuItem>
      </Menu>
    </>
  );
};

export default Sidebar;