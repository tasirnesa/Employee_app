import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  Box,
  Tooltip,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from './context/UserContext';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import RateReviewIcon from '@mui/icons-material/RateReview';
import FlagIcon from '@mui/icons-material/Flag';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaidIcon from '@mui/icons-material/Paid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DescriptionIcon from '@mui/icons-material/Description';
import DevicesIcon from '@mui/icons-material/Devices';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import InboxIcon from '@mui/icons-material/Inbox';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import BarChartIcon from '@mui/icons-material/BarChart';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { isPeoplePath } from './components/PeopleTabBar';
import { isLifecyclePath } from './components/LifecycleTabBar';
import { isEvaluationPath } from './components/EvaluationTabBar';
import { isPerformancePath } from './components/PerformanceTabBar';
import { isTimePath } from './components/TimeTabBar';
import { isCompensationPath } from './components/CompensationTabBar';
import { isRecruitmentPath } from './components/RecruitmentTabBar';
import { isWorkPath } from './components/WorkTabBar';
import { isDocumentsPath } from './components/DocumentsTabBar';
import { isAnalyticsPath } from './components/AnalyticsTabBar';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  matchStart?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const buildNav = (isEmployee: boolean, _isAdmin: boolean): NavGroup[] => [
];

const TOP_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
];

const SETTINGS_ITEMS = [
  { label: 'Change Password', path: '/change-password', icon: <VpnKeyIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const NavItemButton: React.FC<{
  label: string;
  path: string;
  icon?: React.ReactNode;
  indent?: boolean;
  collapsed?: boolean;
  onClick: () => void;
  selected: boolean;
}> = ({ label, icon, indent, collapsed, onClick, selected }) => {
  const btn = (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        mx: 1,
        my: 0.25,
        pl: indent ? (collapsed ? 1 : 4) : 1,
        minHeight: 40,
        '&.Mui-selected': {
          bgcolor: 'primary.main',
          color: 'white',
          '& .MuiListItemIcon-root': { color: 'white' },
          '&:hover': { bgcolor: 'primary.dark' },
        },
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {icon && <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{icon}</ListItemIcon>}
      {!collapsed && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{ fontSize: 13, fontWeight: selected ? 700 : 500 }}
        />
      )}
    </ListItemButton>
  );

  return collapsed ? (
    <Tooltip title={label} placement="right">
      <ListItem disablePadding>{btn}</ListItem>
    </Tooltip>
  ) : (
    <ListItem disablePadding>{btn}</ListItem>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const userRole = (() => {
    try { return JSON.parse(localStorage.getItem('userProfile') || '{}').role || ''; } catch { return ''; }
  })();

  const isEmployee = userRole === 'Employee';
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

  const [recent, setRecent] = useState<Array<{ label: string; path: string }>>([]);
  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem('recentActions') || '[]')); } catch { /**/ }
  }, []);

  const go = (label: string, path: string) => {
    navigate(path);
    const next = [{ label, path }, ...recent.filter((x) => x.path !== path)].slice(0, 3);
    setRecent(next);
    localStorage.setItem('recentActions', JSON.stringify(next));
  };

  const isSelected = (path: string, matchStart?: boolean) =>
    matchStart ? location.pathname.startsWith(path) : location.pathname === path;

  const isPeopleActive = isPeoplePath(location.pathname);
  const isLifecycleActive = isLifecyclePath(location.pathname);
  const isEvaluationActive = isEvaluationPath(location.pathname);
  const isPerformanceActive = isPerformancePath(location.pathname);
  const isTimeActive         = isTimePath(location.pathname);
  const isCompensationActive = isCompensationPath(location.pathname);
  const isRecruitmentActive  = isRecruitmentPath(location.pathname);
  const isWorkActive         = isWorkPath(location.pathname);
  const isDocumentsActive    = isDocumentsPath(location.pathname);
  const isAnalyticsActive    = isAnalyticsPath(location.pathname);

  const navGroups = buildNav(isEmployee, isAdmin);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const d: Record<string, boolean> = {};
    navGroups.forEach((g) => (d[g.label] = false));
    return d;
  });

  useEffect(() => {
    const next = { ...openGroups };
    navGroups.forEach((group) => {
      if (group.items.some((item) => isSelected(item.path, item.matchStart))) {
        next[group.label] = true;
      }
    });
    setOpenGroups(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  // Default People landing route
  const peopleDefaultPath = isEmployee ? '/employees/view' : '/employees/view';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        transition: 'width 0.3s',
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          overflowX: 'hidden',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 2,
          cursor: 'pointer',
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 64,
        }}
      >
        <Box
          component="img"
          src="/images/sidebar.jpeg"
          alt="EES"
          sx={{ width: 36, height: 36, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
        />
        {!collapsed && (
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="#1e293b" lineHeight={1.2}>
              EES
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.userName || 'HR System'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Nav body */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        <List disablePadding>
          {TOP_ITEMS.map((item) => (
            <NavItemButton
              key={item.path}
              label={item.label}
              path={item.path}
              icon={item.icon}
              collapsed={collapsed}
              selected={isSelected(item.path)}
              onClick={() => go(item.label, item.path)}
            />
          ))}

          <Divider sx={{ my: 1, mx: 2 }} />

          {/* ── People button ─────────────────────────────────── */}
          <Tooltip title={collapsed ? 'People' : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => go('People', peopleDefaultPath)}
                sx={{
                  borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                  background: isPeopleActive ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
                  boxShadow: isPeopleActive ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                  '& .MuiListItemIcon-root': { color: isPeopleActive ? 'white' : 'text.secondary' },
                  '&:hover': { background: isPeopleActive ? 'linear-gradient(135deg, #5a5de8 0%, #7c4ee8 100%)' : 'rgba(99,102,241,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}><PeopleIcon /></ListItemIcon>
                {!collapsed && (
                  <ListItemText primary="People" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isPeopleActive ? 'white' : 'text.secondary' }} />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>

          {/* ── Lifecycle button ───────────────────────────────── */}
          {!isEmployee && (
            <Tooltip title={collapsed ? 'Lifecycle' : ''} placement="right">
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => go('Lifecycle', '/onboarding')}
                  sx={{
                    borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                    background: isLifecycleActive ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
                    boxShadow: isLifecycleActive ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                    '& .MuiListItemIcon-root': { color: isLifecycleActive ? 'white' : 'text.secondary' },
                    '&:hover': { background: isLifecycleActive ? 'linear-gradient(135deg, #047857 0%, #059669 100%)' : 'rgba(16,185,129,0.08)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}><BadgeIcon /></ListItemIcon>
                  {!collapsed && (
                    <ListItemText primary="Lifecycle" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isLifecycleActive ? 'white' : 'text.secondary' }} />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          )}

          {/* ── Evaluation button ───────────────────────────────── */}
          <Tooltip title={collapsed ? 'Evaluation' : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => go('Evaluation', isEmployee ? '/evaluations/view' : '/evaluations/view')}
                sx={{
                  borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                  background: isEvaluationActive ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' : 'transparent',
                  boxShadow: isEvaluationActive ? '0 4px 12px rgba(245,158,11,0.3)' : 'none',
                  '& .MuiListItemIcon-root': { color: isEvaluationActive ? 'white' : 'text.secondary' },
                  '&:hover': { background: isEvaluationActive ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' : 'rgba(245,158,11,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}><RateReviewIcon /></ListItemIcon>
                {!collapsed && (
                  <ListItemText primary="Evaluation" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isEvaluationActive ? 'white' : 'text.secondary' }} />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
          {/* ── Performance button ──────────────────────────────── */}
          <Tooltip title={collapsed ? 'Performance' : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => go('Performance', '/goals')}
                sx={{
                  borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                  background: isPerformanceActive ? 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)' : 'transparent',
                  boxShadow: isPerformanceActive ? '0 4px 12px rgba(14,165,233,0.3)' : 'none',
                  '& .MuiListItemIcon-root': { color: isPerformanceActive ? 'white' : 'text.secondary' },
                  '&:hover': { background: isPerformanceActive ? 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)' : 'rgba(14,165,233,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}><AssessmentIcon /></ListItemIcon>
                {!collapsed && (
                  <ListItemText primary="Performance" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isPerformanceActive ? 'white' : 'text.secondary' }} />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
          {/* ── Time & Attendance button ─────────────────────────── */}
          <Tooltip title={collapsed ? 'Time & Attendance' : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => go('Time & Attendance', '/attendance')}
                sx={{
                  borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                  background: isTimeActive ? 'linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)' : 'transparent',
                  boxShadow: isTimeActive ? '0 4px 12px rgba(244,63,94,0.3)' : 'none',
                  '& .MuiListItemIcon-root': { color: isTimeActive ? 'white' : 'text.secondary' },
                  '&:hover': { background: isTimeActive ? 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)' : 'rgba(244,63,94,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}><AccessTimeIcon /></ListItemIcon>
                {!collapsed && (
                  <ListItemText primary="Time & Attendance" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isTimeActive ? 'white' : 'text.secondary' }} />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>

          {/* ── Compensation button ──────────────────────────────── */}
          <Tooltip title={collapsed ? 'Compensation' : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => go('Compensation', '/payroll')}
                sx={{
                  borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                  background: isCompensationActive ? 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)' : 'transparent',
                  boxShadow: isCompensationActive ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
                  '& .MuiListItemIcon-root': { color: isCompensationActive ? 'white' : 'text.secondary' },
                  '&:hover': { background: isCompensationActive ? 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)' : 'rgba(139,92,246,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}><PaidIcon /></ListItemIcon>
                {!collapsed && (
                  <ListItemText primary="Compensation" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isCompensationActive ? 'white' : 'text.secondary' }} />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>

          {/* ── Recruitment button (admin only) ──────────────────── */}
          {!isEmployee && (
            <Tooltip title={collapsed ? 'Recruitment' : ''} placement="right">
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => go('Recruitment', '/recruitment')}
                  sx={{
                    borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                    background: isRecruitmentActive ? 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)' : 'transparent',
                    boxShadow: isRecruitmentActive ? '0 4px 12px rgba(236,72,153,0.3)' : 'none',
                    '& .MuiListItemIcon-root': { color: isRecruitmentActive ? 'white' : 'text.secondary' },
                    '&:hover': { background: isRecruitmentActive ? 'linear-gradient(135deg, #be185d 0%, #db2777 100%)' : 'rgba(236,72,153,0.08)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}><GroupAddIcon /></ListItemIcon>
                  {!collapsed && (
                    <ListItemText primary="Recruitment" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isRecruitmentActive ? 'white' : 'text.secondary' }} />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          )}

          {/* ── Work button ──────────────────────────────────────── */}
          <Tooltip title={collapsed ? 'Work' : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => go('Work', '/inbox')}
                sx={{
                  borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                  background: isWorkActive ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' : 'transparent',
                  boxShadow: isWorkActive ? '0 4px 12px rgba(20,184,166,0.3)' : 'none',
                  '& .MuiListItemIcon-root': { color: isWorkActive ? 'white' : 'text.secondary' },
                  '&:hover': { background: isWorkActive ? 'linear-gradient(135deg, #0d6b64 0%, #0f766e 100%)' : 'rgba(20,184,166,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}><InboxIcon /></ListItemIcon>
                {!collapsed && (
                  <ListItemText primary="Work" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isWorkActive ? 'white' : 'text.secondary' }} />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>

          {/* ── Documents button ─────────────────────────────────── */}
          <Tooltip title={collapsed ? 'Documents' : ''} placement="right">
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => go('Documents', '/document-management')}
                sx={{
                  borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                  background: isDocumentsActive ? 'linear-gradient(135deg, #475569 0%, #64748b 100%)' : 'transparent',
                  boxShadow: isDocumentsActive ? '0 4px 12px rgba(100,116,139,0.3)' : 'none',
                  '& .MuiListItemIcon-root': { color: isDocumentsActive ? 'white' : 'text.secondary' },
                  '&:hover': { background: isDocumentsActive ? 'linear-gradient(135deg, #334155 0%, #475569 100%)' : 'rgba(100,116,139,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}><DescriptionIcon /></ListItemIcon>
                {!collapsed && (
                  <ListItemText primary="Documents" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isDocumentsActive ? 'white' : 'text.secondary' }} />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>

          {/* ── Analytics button (admin only) ────────────────────── */}
          {!isEmployee && (
            <Tooltip title={collapsed ? 'Analytics' : ''} placement="right">
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => go('Analytics', '/reports')}
                  sx={{
                    borderRadius: 2, mx: 1, my: 0.25, minHeight: 40, transition: 'all 0.2s ease',
                    background: isAnalyticsActive ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' : 'transparent',
                    boxShadow: isAnalyticsActive ? '0 4px 12px rgba(217,119,6,0.3)' : 'none',
                    '& .MuiListItemIcon-root': { color: isAnalyticsActive ? 'white' : 'text.secondary' },
                    '&:hover': { background: isAnalyticsActive ? 'linear-gradient(135deg, #92400e 0%, #b45309 100%)' : 'rgba(217,119,6,0.08)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}><BarChartIcon /></ListItemIcon>
                  {!collapsed && (
                    <ListItemText primary="Analytics" primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: isAnalyticsActive ? 'white' : 'text.secondary' }} />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          )}

          {/* Other nav groups */}
          {navGroups.map((group) => (
            <React.Fragment key={group.label}>
              <Tooltip title={collapsed ? group.label : ''} placement="right">
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => toggleGroup(group.label)}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      my: 0.25,
                      minHeight: 40,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                      {group.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <>
                        <ListItemText
                          primary={group.label}
                          primaryTypographyProps={{ fontSize: 13, fontWeight: 700, color: 'text.secondary' }}
                        />
                        {openGroups[group.label]
                          ? <ExpandLess sx={{ fontSize: 18, color: 'text.disabled' }} />
                          : <ExpandMore sx={{ fontSize: 18, color: 'text.disabled' }} />}
                      </>
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              <Collapse in={!collapsed && openGroups[group.label]} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {group.items.map((item) => (
                    <NavItemButton
                      key={item.path}
                      label={item.label}
                      path={item.path}
                      icon={item.icon}
                      indent
                      collapsed={false}
                      selected={isSelected(item.path, item.matchStart)}
                      onClick={() => go(item.label, item.path)}
                    />
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}

          {/* Recent actions */}
          {recent.length > 0 && !collapsed && (
            <>
              <Divider sx={{ my: 1, mx: 2 }} />
              <Box sx={{ px: 2, pb: 0.5 }}>
                <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
                  RECENT
                </Typography>
              </Box>
              <List disablePadding>
                {recent.map((r) => (
                  <NavItemButton
                    key={r.path}
                    label={r.label}
                    path={r.path}
                    indent
                    collapsed={false}
                    selected={isSelected(r.path)}
                    onClick={() => go(r.label, r.path)}
                  />
                ))}
              </List>
            </>
          )}
        </List>
      </Box>

      {/* Settings */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1 }}>
        <List disablePadding>
          {SETTINGS_ITEMS.map((item) => (
            <NavItemButton
              key={item.path}
              label={item.label}
              path={item.path}
              icon={item.icon}
              collapsed={collapsed}
              selected={isSelected(item.path)}
              onClick={() => go(item.label, item.path)}
            />
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
