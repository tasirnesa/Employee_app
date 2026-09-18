import React, { useState, useMemo } from 'react';
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  alpha,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonIcon from '@mui/icons-material/Person';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getThreads } from '../api/messageApi';
import NotificationCenter from './NotificationCenter';

// ── Route → label map ──────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users/view': 'Users',
  '/users/create': 'Create User',
  '/employees/view': 'Employees',
  '/employees/create': 'Create Employee',
  '/departments': 'Departments',
  '/positions': 'Positions',
  '/evaluations/view': 'Evaluations',
  '/evaluations/create': 'Create Evaluation',
  '/criteria/view': 'Criteria',
  '/criteria/create': 'Create Criteria',
  '/goals': 'Goals & OKRs',
  '/analytics-performance': 'Performance',
  '/schedule': 'Schedule',
  '/projects': 'Projects',
  '/attendance': 'Attendance',
  '/timesheets': 'Timesheets',
  '/leave-management': 'Leave Management',
  '/payroll': 'Payroll',
  '/benefits': 'Benefits & Perks',
  '/recruitment': 'Recruitment',
  '/document-management': 'Documents',
  '/asset-management': 'Assets',
  '/onboarding': 'Onboarding',
  '/onboarding/wizard': 'New Hire Wizard',
  '/onboarding/me': 'My Onboarding',
  '/probation': 'Probation Reviews',
  '/offboarding': 'Offboarding',
  '/notifications': 'Notifications',
  '/inbox': 'My Tasks',
  '/todo': 'Todo List',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/change-password': 'Change Password',
};

const resolvePageTitle = (pathname: string): string => {
  // Exact match first
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  // Prefix match for dynamic routes (e.g. /employees/5/profile)
  const matched = Object.keys(ROUTE_LABELS)
    .filter((k) => pathname.startsWith(k) && k !== '/')
    .sort((a, b) => b.length - a.length)[0];
  return matched ? ROUTE_LABELS[matched] : 'EES';
};

// ── Role badge colour ──────────────────────────────────────────────────────
const roleBadge = (role?: string) => {
  switch (role) {
    case 'SuperAdmin': return { bg: '#fef3c7', color: '#d97706' };
    case 'Admin':      return { bg: '#ede9fe', color: '#7c3aed' };
    case 'Manager':    return { bg: '#dbeafe', color: '#2563eb' };
    case 'Employee':   return { bg: '#dcfce7', color: '#16a34a' };
    default:           return { bg: '#f1f5f9', color: '#64748b' };
  }
};

// ── Props ──────────────────────────────────────────────────────────────────
interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────
const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [msgAnchor, setMsgAnchor] = useState<null | HTMLElement>(null);

  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = resolvePageTitle(location.pathname);
  const badge = roleBadge(user?.role);

  // Profile image resolution
  const avatarSrc = useMemo(() => {
    const raw = user?.profileImageUrl?.trim();
    if (!raw) return undefined;
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    return raw.startsWith('/') ? `${base}${raw}` : `${base}/uploads/${raw}`;
  }, [user?.profileImageUrl]);

  // Unread message count + thread list
  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: getThreads,
    enabled: !!user,
    refetchInterval: 30 * 1000,
  });

  const totalUnread = useMemo(
    () => threads.reduce((s: number, t: any) => s + (t.unreadCount || 0), 0),
    [threads]
  );

  // Threads sorted: unread first, then by latest message
  const sortedThreads = useMemo(() =>
    [...threads].sort((a: any, b: any) => {
      if ((b.unreadCount || 0) !== (a.unreadCount || 0)) return (b.unreadCount || 0) - (a.unreadCount || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }),
    [threads]
  );

  const openChat = (thread: any) => {
    setMsgAnchor(null);
    window.dispatchEvent(new CustomEvent('open-chat', {
      detail: {
        user: {
          id: thread.otherId,
          fullName: thread.otherName || `User ${thread.otherId}`,
          profileImageUrl: thread.otherAvatar || null,
        },
      },
    }));
  };

  const handleLogout = () => {
    setMenuAnchor(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setUser(null);
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          bgcolor: 'white',
          borderBottom: '1px solid #eef2ff',
          color: '#1e293b',
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ minHeight: '60px !important', px: { xs: 2, md: 3 }, gap: 1 }}>

          {/* ── Sidebar toggle ── */}
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton onClick={onToggle} size="small" sx={{ color: '#64748b', mr: 0.5 }}>
              {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>
          </Tooltip>

          {/* ── Page title / breadcrumb ── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              noWrap
              sx={{ color: '#1e293b', lineHeight: 1, fontSize: { xs: '1rem', md: '1.1rem' } }}
            >
              {pageTitle}
            </Typography>
          </Box>

          {/* ── Global search ── */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, width: 280 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) navigate(`/employees/view?q=${encodeURIComponent(val)}`);
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 3,
                  bgcolor: '#f8faff',
                  '& fieldset': { borderColor: '#eef2ff' },
                  '&:hover fieldset': { borderColor: '#c7d2fe' },
                },
              }}
            />
          </Box>

          {/* ── Action icons ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

            {/* Messages */}
            <Tooltip title={totalUnread > 0 ? `${totalUnread} unread messages` : 'Messages'}>
              <IconButton
                size="small"
                onClick={(e) => setMsgAnchor(e.currentTarget)}
                sx={{ color: '#64748b' }}
              >
                <Badge badgeContent={totalUnread || null} color="error" max={99}>
                  <ForumIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <NotificationCenter />

            {/* Help */}
            <Tooltip title="Help">
              <IconButton
                size="small"
                onClick={() => setHelpOpen(true)}
                sx={{ color: '#64748b' }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />

            {/* Profile avatar + menu trigger */}
            <Tooltip title={`${user?.fullName || 'Profile'} · ${user?.role || ''}`}>
              <Box
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  pl: 1,
                  pr: 1.5,
                  py: 0.5,
                  borderRadius: 3,
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: '#f8faff' },
                }}
              >
                <Avatar
                  src={avatarSrc}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#1e293b',
                    fontSize: 13,
                    fontWeight: 700,
                    border: '2px solid #eef2ff',
                  }}
                >
                  {!avatarSrc && initials}
                </Avatar>
                <Box sx={{ display: { xs: 'none', lg: 'block' }, minWidth: 0 }}>
                  <Typography variant="caption" fontWeight={700} noWrap display="block" lineHeight={1.2} color="#1e293b">
                    {user?.fullName?.split(' ')[0] || 'User'}
                  </Typography>
                  <Chip
                    label={user?.role || '—'}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: 10,
                      fontWeight: 700,
                      bgcolor: badge.bg,
                      color: badge.color,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Messages popover ── */}
      <Popover
        open={Boolean(msgAnchor)}
        anchorEl={msgAnchor}
        onClose={() => setMsgAnchor(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        PaperProps={{
          elevation: 2,
          sx: { mt: 1, width: 340, borderRadius: 3, border: '1px solid #eef2ff', overflow: 'hidden' },
        }}
      >
        {/* Popover header */}
        <Box sx={{
          px: 2, py: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} color="#1e293b">Messages</Typography>
            {totalUnread > 0 && (
              <Chip
                label={`${totalUnread} unread`}
                size="small"
                color="error"
                sx={{ height: 18, fontSize: 10, fontWeight: 700, '& .MuiChip-label': { px: 0.75 } }}
              />
            )}
          </Box>
          <Tooltip title="Open full chat">
            <IconButton size="small" onClick={() => { setMsgAnchor(null); navigate('/todo'); }}
              sx={{ color: '#6366f1' }}>
              <DoneAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Thread list */}
        {sortedThreads.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <ForumIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No conversations yet</Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {sortedThreads.slice(0, 10).map((thread: any) => {
              const hasUnread = (thread.unreadCount || 0) > 0;
              const initials = (thread.otherName || 'U').charAt(0).toUpperCase();
              const timeStr = thread.createdAt
                ? new Date(thread.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <ListItemButton
                  key={thread.otherId}
                  onClick={() => openChat(thread)}
                  sx={{
                    px: 2, py: 1.25,
                    borderBottom: '1px solid #f8fafc',
                    bgcolor: hasUnread ? alpha('#6366f1', 0.04) : 'transparent',
                    '&:hover': { bgcolor: '#f8faff' },
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 44 }}>
                    <Badge
                      badgeContent={thread.unreadCount || null}
                      color="error"
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                      <Avatar
                        src={thread.otherAvatar || undefined}
                        sx={{
                          width: 36, height: 36,
                          bgcolor: '#1e293b',
                          fontSize: 14, fontWeight: 700,
                        }}
                      >
                        {initials}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={hasUnread ? 700 : 500}
                        noWrap
                        color="#1e293b"
                      >
                        {thread.otherName || `User ${thread.otherId}`}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color={hasUnread ? 'primary.main' : 'text.secondary'}
                        fontWeight={hasUnread ? 600 : 400}
                        noWrap
                        sx={{ display: 'block' }}
                      >
                        {thread.text || 'No messages yet'}
                      </Typography>
                    }
                  />
                  {timeStr && (
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 1, flexShrink: 0 }}>
                      {timeStr}
                    </Typography>
                  )}
                </ListItemButton>
              );
            })}
          </List>
        )}

        {/* Footer */}
        <Box sx={{ px: 2, py: 1, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <Button
            size="small"
            fullWidth
            onClick={() => { setMsgAnchor(null); navigate('/todo'); }}
            sx={{ borderRadius: 2, fontWeight: 600, color: '#6366f1' }}
          >
            View all in Todo / Chat
          </Button>
        </Box>
      </Popover>

      {/* ── Profile dropdown menu ── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 3,
            border: '1px solid #eef2ff',
            overflow: 'visible',
          },
        }}
      >
        {/* User info header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={avatarSrc}
              sx={{ width: 40, height: 40, bgcolor: '#1e293b', fontWeight: 700 }}
            >
              {!avatarSrc && initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>{user?.fullName || 'Unknown'}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                @{user?.userName || '—'}
              </Typography>
              <Chip
                label={user?.role}
                size="small"
                sx={{
                  mt: 0.25,
                  height: 18,
                  fontSize: 10,
                  fontWeight: 700,
                  bgcolor: badge.bg,
                  color: badge.color,
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            </Box>
          </Box>
        </Box>

        <MenuItem
          onClick={() => { setMenuAnchor(null); setProfileOpen(true); }}
          sx={{ mx: 1, borderRadius: 2, my: 0.25 }}
        >
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="My Account" />
        </MenuItem>

        <MenuItem
          onClick={() => { setMenuAnchor(null); navigate('/settings'); }}
          sx={{ mx: 1, borderRadius: 2, my: 0.25 }}
        >
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>

        <MenuItem
          onClick={() => { setMenuAnchor(null); navigate('/change-password'); }}
          sx={{ mx: 1, borderRadius: 2, my: 0.25 }}
        >
          <ListItemIcon><VpnKeyIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="Change Password" />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleLogout}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: 2,
            color: 'error.main',
            '&:hover': { bgcolor: alpha('#ef4444', 0.06) },
          }}
        >
          <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Sign Out" />
        </MenuItem>
      </Menu>

      {/* ── My Account dialog ── */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>My Account</DialogTitle>
        <DialogContent sx={{ pt: '4px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              src={avatarSrc}
              sx={{ width: 64, height: 64, bgcolor: '#1e293b', fontSize: 22, fontWeight: 700 }}
            >
              {!avatarSrc && initials}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800}>{user?.fullName}</Typography>
              <Chip
                label={user?.role}
                size="small"
                sx={{ bgcolor: badge.bg, color: badge.color, fontWeight: 700 }}
              />
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {[
            { label: 'Username', value: user?.userName },
            { label: 'Email', value: (user as any)?.email || '—' },
            { label: 'Status', value: user?.activeStatus === 'Active' || user?.activeStatus === 'true' ? 'Active' : 'Inactive' },
            { label: 'Member since', value: user?.createdDate ? new Date(user.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—' },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={600}>{value}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => { setProfileOpen(false); navigate('/change-password'); }}
            variant="outlined"
            startIcon={<VpnKeyIcon />}
            sx={{ borderRadius: 2 }}
          >
            Change Password
          </Button>
          <Button
            onClick={() => setProfileOpen(false)}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Help dialog ── */}
      <Dialog
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>About EES</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The Employee Evaluation System (EES) is a full-suite HR platform for managing your workforce
            from hire to retire — covering evaluations, payroll, leave, attendance, goals, and more.
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {[
            { title: '📋 Evaluation', desc: 'Define criteria, run sessions, score and review performance across your organisation.' },
            { title: '👥 People', desc: 'Manage users, employees, departments, positions, and the full employee lifecycle.' },
            { title: '💰 Compensation', desc: 'Run payroll, manage benefits and perks, and track compensation history.' },
            { title: '⏱ Time & Attendance', desc: 'Track attendance, approve timesheets, and manage leave requests.' },
            { title: '🎯 Goals & OKRs', desc: 'Set objectives, track key results, and monitor progress across teams.' },
            { title: '📁 Documents & Assets', desc: 'Store and verify employee documents, and manage assigned company assets.' },
          ].map(({ title, desc }) => (
            <Box key={title} sx={{ mb: 1.5 }}>
              <Typography variant="body2" fontWeight={700}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">{desc}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setHelpOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>Got it</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;
