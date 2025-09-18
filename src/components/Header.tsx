// src/components/Header.tsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Tooltip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const [openHelp, setOpenHelp] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [openProfile, setOpenProfile] = React.useState(false);
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => setAnchorEl(null);
  const handleOpenProfile = () => {
    setOpenProfile(true);
    handleCloseMenu();
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setUser(null);
    handleCloseMenu();
    navigate('/login');
  };

  return (
    <Box sx={{ mb: 2 }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar sx={{ gap: 1 }}>
          <Tooltip title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}>
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={onToggle}>
              <MenuIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              Employee Performance Evaluation
            </Typography>
            {/* <Typography variant="body2" sx={{ opacity: 0.9 }} noWrap>
              Assess, coach, and recognize employees to drive continuous improvement
            </Typography> */}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="What is employee performance evaluation?">
              <IconButton color="inherit" onClick={() => setOpenHelp(true)} aria-label="help">
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={user ? `${user.fullName} (${user.role})` : 'Profile'}>
              <IconButton color="inherit" onClick={handleOpenMenu} aria-label="profile">
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile/Settings Menu */}
      {anchorEl && (
        <Box
          sx={{
            position: 'absolute',
            right: 16,
            mt: 1,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 1,
            minWidth: 220,
            zIndex: (theme) => theme.zIndex.modal - 1,
          }}
          onMouseLeave={handleCloseMenu}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" noWrap>{user?.fullName || 'Unknown User'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user?.role || 'Role'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Button startIcon={<SettingsIcon />} sx={{ justifyContent: 'flex-start', borderRadius: 0 }} onClick={handleOpenProfile}>
              About / Settings
            </Button>
            <Button startIcon={<LogoutIcon />} sx={{ justifyContent: 'flex-start', color: 'error.main', borderRadius: 0 }} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Box>
      )}

      <Dialog open={openHelp} onClose={() => setOpenHelp(false)} maxWidth="sm" fullWidth>
        <DialogTitle>About Employee Performance Evaluation</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            Employee performance evaluation is a structured process used to measure how well an employee is
            meeting role expectations and organizational goals. It helps identify strengths, surface skill gaps,
            and align development plans with business priorities.
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle1" gutterBottom>
            Core elements
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            <li>
              <Typography variant="body2">
                Clear criteria: role-relevant competencies and objectives with unambiguous definitions
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Scoring and feedback: quantitative ratings supported by specific, actionable comments
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Multiple perspectives: input from managers, peers, and self-assessments where appropriate
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Development actions: targeted goals, coaching, and timelines to improve outcomes
              </Typography>
            </li>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">
            In this app, you can define criteria, run evaluations, record scores and feedback, and review
            progress over time to support continuous performance improvement.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHelp(false)} variant="contained">Got it</Button>
        </DialogActions>
      </Dialog>

      {/* About / Settings Dialog */}
      <Dialog open={openProfile} onClose={() => setOpenProfile(false)} maxWidth="sm" fullWidth>
        <DialogTitle>About this Account</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1"><strong>Full name:</strong> {user?.fullName || '—'}</Typography>
            <Typography variant="body1"><strong>Username:</strong> {user?.userName || '—'}</Typography>
            <Typography variant="body1"><strong>Role:</strong> {user?.role || '—'}</Typography>
            <Typography variant="body1"><strong>Status:</strong> {user?.status || '—'}</Typography>
            <Typography variant="body1"><strong>Active:</strong> {String(user?.activeStatus ?? '')}</Typography>
            <Typography variant="body1"><strong>Created:</strong> {user?.createdDate ? new Date(user.createdDate).toLocaleString() : '—'}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProfile(false)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Header;