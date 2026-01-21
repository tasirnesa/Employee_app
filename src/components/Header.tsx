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
  TextField,
  InputAdornment,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Avatar from '@mui/material/Avatar';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import TuneIcon from '@mui/icons-material/Tune';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';

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

  // Resolve profile image URL (supports absolute URLs or backend /uploads paths)
  const resolvedProfileImageUrl = React.useMemo(() => {
    const raw = user?.profileImageUrl?.trim();
    if (!raw) return undefined;
    const isAbsolute = /^https?:\/\//i.test(raw);
    if (isAbsolute) return raw;
    const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
    if (raw.startsWith('/')) return `${base}${raw}`;
    return `${base}/uploads/${raw}`;
  }, [user?.profileImageUrl]);

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
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ gap: 1, py: 1.5 }}>
          <Tooltip title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}>
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={onToggle}>
              <MenuIcon />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              Employee Performance Evaluation System
            </Typography>
            <Box sx={{ flexGrow: 1, minWidth: 200, maxWidth: 520 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Filters">
              <IconButton color="inherit" aria-label="filters">
                <TuneIcon />
              </IconButton>
            </Tooltip>
            <NotificationCenter />
            <Tooltip title="What is employee performance evaluation?">
              <IconButton color="inherit" onClick={() => setOpenHelp(true)} aria-label="help">
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={user ? `${user.fullName} (${user.role})` : 'Profile'}>
              <IconButton color="inherit" onClick={handleOpenMenu} aria-label="profile" sx={{ p: 0.5 }}>
                {resolvedProfileImageUrl ? (
                  <Avatar
                    src={resolvedProfileImageUrl}
                    alt={user?.fullName || 'Profile'}
                    sx={{ width: 34, height: 34, border: '2px solid rgba(255,255,255,0.6)' }}
                  />
                ) : (
                  <AccountCircleIcon />
                )}
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
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={resolvedProfileImageUrl} sx={{ width: 36, height: 36 }}>
              {!resolvedProfileImageUrl && (user?.fullName ? user.fullName.charAt(0).toUpperCase() : undefined)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>{user?.fullName || 'Unknown User'}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{user?.role || 'Role'}</Typography>
            </Box>
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