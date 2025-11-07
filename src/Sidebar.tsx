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
  Button,
  Collapse,
  Divider,
  Typography,
  Box,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from './context/UserContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import WorkIcon from '@mui/icons-material/Work';
import PaidIcon from '@mui/icons-material/Paid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import FlagIcon from '@mui/icons-material/Flag';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EventIcon from '@mui/icons-material/Event';
import BadgeIcon from '@mui/icons-material/Badge';
import ChecklistIcon from '@mui/icons-material/Checklist';
// removed toggle icons in favor of text label "EES"

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const drawerWidth = 240; // Define drawerWidth as a constant

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Legacy menu anchor states removed in favor of collapsible groups
  const { user } = useUser();
  // const userManagementOpen = false;
  // const criteriaManagementOpen = false;
  // const evaluationsOpen = false;
const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;

const isEmployee = userRole === 'Employee';

const menuItems = [
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  !isEmployee && { text: 'User Management', path: '/users', icon: <PeopleIcon /> },
  { text: 'Evaluations', path: '/evaluations/view', icon: <AssignmentIcon /> },
  !isEmployee && { text: 'Create Evaluation', path: '/evaluations/create', icon: <AssignmentIcon /> },
  { text: 'Criteria Management', path: '/criteria/view', icon: <SettingsIcon /> },
  !isEmployee && { text: 'Create Criteria', path: '/criteria/create', icon: <SettingsIcon /> },
  { text: 'Goals', path: '/goals', icon: <FlagIcon /> },
  { text: 'Performance', path: '/analytics-performance', icon: <AssessmentIcon /> },
  { text: 'Schedule', path: '/schedule', icon: <EventIcon /> },
  { text: 'Reports', path: '/reports', icon: <BarChartIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
].filter(Boolean);
  // Recent actions (last 3)
  const [recent, setRecent] = useState<Array<{ label: string; path: string }>>([]);

  useEffect(() => {
    const r = localStorage.getItem('recentActions');
    if (r) setRecent(JSON.parse(r));
  }, []);

  const recordRecent = (label: string, path: string) => {
    const next = [{ label, path }, ...recent.filter((x) => x.path !== path)].slice(0, 3);
    setRecent(next);
    localStorage.setItem('recentActions', JSON.stringify(next));
  };

  // Legacy MUI Menus removed

  const handleCreateUser = () => {
    console.log('Navigating to create user');
    navigate('/users/create');
    recordRecent('Create User', '/users/create');
  };

  const handleViewUsers = () => {
    console.log('Navigating to view users');
    navigate('/users/view');
    recordRecent('View Users', '/users/view');
  };

  const handleCreateCriteria = () => {
    console.log('Navigating to create criteria');
    navigate('/criteria/create');
    recordRecent('Create Criteria', '/criteria/create');
  };

  const handleViewCriteria = () => {
    console.log('Navigating to view criteria');
    navigate('/criteria/view');
    recordRecent('View Criteria', '/criteria/view');
  };

  const handleCreateEvaluation = () => {
    console.log('Navigating to create evaluation');
    navigate('/evaluations/create');
    recordRecent('Create Evaluation', '/evaluations/create');
  };

  const handleViewEvaluations = () => {
    console.log('Navigating to view evaluations');
    navigate('/evaluations/view');
    recordRecent('View Evaluations', '/evaluations/view');
  };

  const handleGoals = () => {
    console.log('Navigating to goals');
    navigate('/goals');
    recordRecent('Goals', '/goals');
  };

  const handleAnalyticsPerformance = () => {
    console.log('Navigating to analytics performance');
    navigate('/analytics-performance');
    recordRecent('Performance', '/analytics-performance');
  };

  const handleSchedule = () => {
    console.log('Navigating to schedule');
    navigate('/schedule');
    recordRecent('Schedule', '/schedule');
  };

  const handleTodoList = () => {
    console.log('Navigating to todo list');
    navigate('/todo');
    recordRecent('Todo List', '/todo');
  };

  const handleAttendance = () => {
    console.log('Navigating to attendance');
    navigate('/attendance');
    recordRecent('Attendance', '/attendance');
  };

  // Collapsible groups state
  const [openUserMgmt, setOpenUserMgmt] = useState<boolean>(true);
  const [openEmployeeMgmt, setOpenEmployeeMgmt] = useState<boolean>(true);
  const [openPayroll, setOpenPayroll] = useState<boolean>(false);
  const [openAttendance, setOpenAttendance] = useState<boolean>(false);
  const [openRecruitment, setOpenRecruitment] = useState<boolean>(false);
  const [openBenefit, setOpenBenefit] = useState<boolean>(false);
  const [openTaskProject, setOpenTaskProject] = useState<boolean>(false);
  const [openEvaluation, setOpenEvaluation] = useState<boolean>(true);
  const [openSettings, setOpenSettings] = useState<boolean>(false);


  const handleToggle = () => {
    console.log('Toggling sidebar');
    if (onToggle) onToggle();
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? 72 : drawerWidth,
          flexShrink: 0,
          transition: 'width 0.3s',
          [`& .MuiDrawer-paper`]: {
            width: collapsed ? 72 : drawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s',
            overflowX: 'hidden',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            borderRight: '1px solid',
            borderColor: 'divider',
            pr: 0,
            mr: 0,
          },
        }}
      >
        <List>
            {!collapsed && (
              <ListItem disablePadding sx={{ justifyContent: collapsed ? 'center' : 'flex-start', py: 1 }}>
                <ListItemText
                  primary={`Logged in as: ${user?.userName || 'Unknown User'}`}
                  sx={{ pl: collapsed ? 0 : 2, opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }}
                />
              </ListItem>
            )}
          <ListItem disablePadding sx={{ justifyContent: 'center', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="img"
                src="/images/sidebar.jpeg"
                alt="Sidebar"
                sx={{ width: 100, height: 80, borderRadius: '50%', objectFit: 'cover' }}
              />
              <Button
                onClick={handleToggle}
                color="inherit"
                aria-label={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
                sx={{ fontWeight: 700, letterSpacing: 1, minWidth: 0, p: 0.5 }}
              >
                EES
              </Button>
            </Box>
          </ListItem>
         
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/dashboard'}
              onClick={() => { navigate('/dashboard'); recordRecent('Dashboard', '/dashboard'); }}
              sx={{ justifyContent: 'flex-start', borderRadius: 2, mx: 1, my: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
            </ListItemButton>
          </ListItem>

          {/* User Management */}
          {!isEmployee && (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setOpenUserMgmt(!openUserMgmt)} sx={{ justifyContent: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="User Management" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
                {!collapsed && (openUserMgmt ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>
            </ListItem>
            <Collapse in={openUserMgmt} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={handleCreateUser} selected={location.pathname === '/users/create'}>
                  <ListItemText primary="Create User" />
                </ListItemButton>
                <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={handleViewUsers} selected={location.pathname.startsWith('/users/view')}>
                  <ListItemText primary="View Users" />
                </ListItemButton>
              </List>
            </Collapse>
          </>)}

          {/* Employee Management */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenEmployeeMgmt(!openEmployeeMgmt)} sx={{ justifyContent: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <BadgeIcon />
              </ListItemIcon>
              <ListItemText primary="Employee Management" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && (openEmployeeMgmt ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={openEmployeeMgmt} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/employees/view'); recordRecent('View Employees', '/employees/view'); }} selected={location.pathname.startsWith('/employees/view')}>
                <ListItemText primary="View Employees" />
              </ListItemButton>
              {!isEmployee && (
                <>
                  <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/employees/create'); recordRecent('Create Employee', '/employees/create'); }} selected={location.pathname === '/employees/create'}>
                    <ListItemText primary="Create Employee" />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/departments'); recordRecent('Departments', '/departments'); }} selected={location.pathname === '/departments'}>
                    <ListItemText primary="Departments" />
                  </ListItemButton>
                  <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/positions'); recordRecent('Positions', '/positions'); }} selected={location.pathname === '/positions'}>
                    <ListItemText primary="Positions" />
                  </ListItemButton>
                </>
              )}
            </List>
          </Collapse>

          {/* Evaluation */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenEvaluation(!openEvaluation)} sx={{ justifyContent: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <RateReviewIcon />
              </ListItemIcon>
              <ListItemText primary="Evaluation" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && (openEvaluation ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={openEvaluation} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {!isEmployee && (
                <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={handleCreateEvaluation} selected={location.pathname === '/evaluations/create'}>
                  <ListItemText primary="Create Evaluation" />
                </ListItemButton>
              )}
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={handleViewEvaluations} selected={location.pathname.startsWith('/evaluations/view')}>
                <ListItemText primary="View Evaluations" />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Payroll */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenPayroll(!openPayroll)} sx={{ justifyContent: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <PaidIcon />
              </ListItemIcon>
              <ListItemText primary="Payroll" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && (openPayroll ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={openPayroll} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/payroll'); recordRecent('Payroll', '/payroll'); }} selected={location.pathname === '/payroll'}>
                <ListItemText primary="Payroll Management" />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Attendance */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenAttendance(!openAttendance)} sx={{ justifyContent: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <AccessTimeIcon />
              </ListItemIcon>
              <ListItemText primary="Attendance" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && (openAttendance ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={openAttendance} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton 
                sx={{ pl: collapsed ? 2 : 7 }} 
                onClick={handleAttendance} 
                selected={location.pathname === '/attendance'}
              >
                <ListItemText primary="Attendance Records" />
              </ListItemButton>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/timesheets'); recordRecent('Timesheets', '/timesheets'); }} selected={location.pathname === '/timesheets'}>
                <ListItemText primary="Timesheets" />
              </ListItemButton>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/leave-management'); recordRecent('Leave Management', '/leave-management'); }} selected={location.pathname === '/leave-management'}>
                <ListItemText primary="Leave Management" />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Recruitment */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenRecruitment(!openRecruitment)} sx={{ justifyContent: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <GroupAddIcon />
              </ListItemIcon>
              <ListItemText primary="Recruitment" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && (openRecruitment ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={openRecruitment} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/recruitment'); recordRecent('Recruitment', '/recruitment'); }} selected={location.pathname === '/recruitment'}>
                <ListItemText primary="Candidates Management" />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Benefit */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenBenefit(!openBenefit)} sx={{ justifyContent: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <CardGiftcardIcon />
              </ListItemIcon>
              <ListItemText primary="Benefit" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && (openBenefit ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={openBenefit} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/benefits'); recordRecent('Benefits', '/benefits'); }} selected={location.pathname === '/benefits'}>
                <ListItemText primary="Benefits & Perks" />
              </ListItemButton>
            </List>
          </Collapse>

          {/* Task & Project */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenTaskProject(!openTaskProject)} sx={{ justifyContent: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <AssignmentTurnedInIcon />
              </ListItemIcon>
              <ListItemText primary="Task & Project" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && (openTaskProject ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={openTaskProject} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={handleGoals} selected={location.pathname === '/goals'}>
                <ListItemText primary="Goals & OKRs" />
              </ListItemButton>
              {!isEmployee && (
                <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => { navigate('/projects'); recordRecent('Projects', '/projects'); }} selected={location.pathname === '/projects'}>
                  <ListItemText primary="Projects" />
                </ListItemButton>
              )}
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={handleAnalyticsPerformance} selected={location.pathname === '/analytics-performance'}>
                <ListItemText primary="Performance" />
              </ListItemButton>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={handleSchedule} selected={location.pathname === '/schedule'}>
                <ListItemText primary="Schedule" />
              </ListItemButton>
              <ListItemButton 
                sx={{ pl: collapsed ? 2 : 7 }} 
                onClick={handleTodoList} 
                selected={location.pathname === '/todo'}
              >
                <ListItemText primary="Todo List" />
              </ListItemButton>
            </List>
          </Collapse>

          <Divider sx={{ my: 1 }} />

          {/* Recent Actions */}
          <Box sx={{ px: collapsed ? 0 : 2, pb: 1, opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }}>
            {!collapsed && <Typography variant="caption" color="text.secondary">Recent</Typography>}
            <List dense>
              {recent.map((r) => (
                <ListItemButton key={r.path} sx={{ borderRadius: 2 }} onClick={() => navigate(r.path)}>
                  <ListItemText primary={r.label} />
                </ListItemButton>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Settings (Tabs in settings page) */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => setOpenSettings(!openSettings)} sx={{ justifyContent: 'flex-start' }}>
              <ListItemIcon sx={{ minWidth: 56, justifyContent: 'center' }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" sx={{ opacity: collapsed ? 0 : 1, transition: 'opacity 0.3s' }} />
              {!collapsed && (openSettings ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </ListItem>
          <Collapse in={openSettings} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => navigate('/criteria/view')} selected={location.pathname.startsWith('/criteria')}>
                <ListItemText primary="Criteria Management" />
              </ListItemButton>
              {/* <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => navigate('/goals')} selected={location.pathname === '/goals'}>
                <ListItemText primary="Goals" />
              </ListItemButton>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => navigate('/analytics-performance')} selected={location.pathname === '/analytics-performance'}>
                <ListItemText primary="Performance" />
              </ListItemButton>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => navigate('/schedule')} selected={location.pathname === '/schedule'}>
                <ListItemText primary="Schedule" />
              </ListItemButton>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={handleTodoList} selected={location.pathname === '/todo'}>
                <ListItemText primary="Todo List" />
              </ListItemButton> */}
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => navigate('/reports')} selected={location.pathname === '/reports'}>
                <ListItemText primary="Reports" />
              </ListItemButton>
              <ListItemButton sx={{ pl: collapsed ? 2 : 7 }} onClick={() => navigate('/change-password')} selected={location.pathname === '/change-password'}>
                <ListItemText primary="Change Password" />
              </ListItemButton>
            </List>
          </Collapse>
          
          
          
          
          
          
          
          
          
        </List>
      </Drawer>
      
    </>
  );
};

export default Sidebar;