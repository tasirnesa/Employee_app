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
  Avatar,
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
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import DescriptionIcon from '@mui/icons-material/Description';
import DevicesIcon from '@mui/icons-material/Devices';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import InboxIcon from '@mui/icons-material/Inbox';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import ChecklistIcon from '@mui/icons-material/Checklist';
import BarChartIcon from '@mui/icons-material/BarChart';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import RuleIcon from '@mui/icons-material/Rule';
import AssignmentIcon from '@mui/icons-material/Assignment';

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

// ── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  adminOnly?: boolean;
  employeeOnly?: boolean;
  matchStart?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  adminOnly?: boolean;       // entire group hidden from employees
  employeeVisible?: boolean; // group shown to all roles (default: shown to all)
}

// ── Navigation structure ─────────────────────────────────────────────────────
const buildNav = (isEmployee: boolean, isAdmin: boolean): NavGroup[] => [
  // ── People ────────────────────────────────────────────────────────────────
  {
    label: 'People',
    icon: <PeopleIcon />,
    items: [
      // Admin/Manager only
      ...(!isEmployee ? [
        { label: 'Users', path: '/users/view', matchStart: true },
        { label: 'Create User', path: '/users/create' },
        { label: 'Employees', path: '/employees/view', matchStart: true },
        { label: 'Create Employee', path: '/employees/create' },
        { label: 'Departments', path: '/departments' },
        { label: 'Positions', path: '/positions' },
      ] : [
        // Employee only
        { label: 'My Profile', path: '/employees/view' },
        { label: 'My Onboarding', path: '/onboarding/me' },
      ]),
    ],
  },

  // ── Lifecycle (admin/manager only) ────────────────────────────────────────
  ...(!isEmployee ? [{
    label: 'Lifecycle',
    icon: <BadgeIcon />,
    items: [
      { label: 'New Hire Wizard', path: '/onboarding/wizard' },
      { label: 'Onboarding', path: '/onboarding' },
      { label: 'Probation Reviews', path: '/probation' },
      { label: 'Offboarding', path: '/offboarding' },
    ],
  }] : []),

  // ── Evaluation ────────────────────────────────────────────────────────────
  {
    label: 'Evaluation',
    icon: <RateReviewIcon />,
    items: [
      ...(!isEmployee ? [{ label: 'Create Session', path: '/evaluations/create' }] : []),
      { label: 'View Evaluations', path: '/evaluations/view', matchStart: true },
      ...(!isEmployee ? [{ label: 'Criteria', path: '/criteria/view', matchStart: true }] : []),
      ...(!isEmployee ? [{ label: 'Create Criteria', path: '/criteria/create' }] : []),
    ],
  },

  // ── Performance & Goals ───────────────────────────────────────────────────
  {
    label: 'Performance',
    icon: <AssessmentIcon />,
    items: [
      { label: 'Goals & OKRs', path: '/goals', icon: <FlagIcon /> },
      { label: 'Performance Analytics', path: '/analytics-performance', icon: <AssessmentIcon /> },
      { label: 'Schedule', path: '/schedule', icon: <EventIcon /> },
      ...(!isEmployee ? [{ label: 'Projects', path: '/projects', icon: <WorkIcon /> }] : []),
    ],
  },

  // ── Time & Attendance ─────────────────────────────────────────────────────
  {
    label: 'Time & Attendance',
    icon: <AccessTimeIcon />,
    items: [
      { label: 'Attendance', path: '/attendance' },
      { label: 'Timesheets', path: '/timesheets' },
      { label: 'Leave Management', path: '/leave-management' },
    ],
  },

  // ── Compensation ──────────────────────────────────────────────────────────
  {
    label: 'Compensation',
    icon: <PaidIcon />,
    items: [
      { label: 'Payroll', path: '/payroll' },
      { label: 'Benefits & Perks', path: '/benefits' },
    ],
  },

  // ── Recruitment (admin/manager only) ──────────────────────────────────────
  ...(!isEmployee ? [{
    label: 'Recruitment',
    icon: <GroupAddIcon />,
    items: [
      { label: 'Candidates', path: '/recruitment' },
    ],
  }] : []),

  // ── Work ─────────────────────────────────────────────────────────────────
  {
    label: 'Work',
    icon: <InboxIcon />,
    items: [
      { label: 'My Tasks', path: '/inbox' },
      { label: 'Todo List', path: '/todo' },
    ],
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  {
    label: 'Documents',
    icon: <DescriptionIcon />,
    items: [
      { label: 'Documents', path: '/document-management' },
      ...(!isEmployee ? [{ label: 'Assets', path: '/asset-management', icon: <DevicesIcon /> }] : []),
    ],
  },

  // ── Analytics (admin/manager only) ────────────────────────────────────────
  ...(!isEmployee ? [{
    label: 'Analytics',
    icon: <BarChartIcon />,
    items: [
      { label: 'Reports', path: '/reports' },
    ],
  }] : []),
];

// ── Flat top-level items (always visible) ────────────────────────────────────
const TOP_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
];

// ── Bottom settings items ─────────────────────────────────────────────────────
const SETTINGS_ITEMS = [
  { label: 'Change Password', path: '/change-password', icon: <VpnKeyIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

// ── NavItem component ─────────────────────────────────────────────────────────
const NavItemButton: React.FC<{
  label: string;
  path: string;
  icon?: React.ReactNode;
  indent?: boolean;
  collapsed?: boolean;
  onClick: () => void;
  selected: boolean;
}> = ({ label, path, icon, indent, collapsed, onClick, selected }) => {
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
      {icon && (
        <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
          {icon}
        </ListItemIcon>
      )}
      {!collapsed && <ListItemText primary={label} primaryTypographyProps={{ fontSize: 13, fontWeight: selected ? 700 : 500 }} />}
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

// ── Main component ────────────────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const userRole = (() => {
    try { return JSON.parse(localStorage.getItem('userProfile') || '{}').role || ''; } catch { return ''; }
  })();

  const isEmployee = userRole === 'Employee';
  const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';

  // Recent actions
  const [recent, setRecent] = useState<Array<{ label: string; path: string }>>([]);
  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem('recentActions') || '[]')); } catch { /* ignore */ }
  }, []);

  const go = (label: string, path: string) => {
    navigate(path);
    const next = [{ label, path }, ...recent.filter((x) => x.path !== path)].slice(0, 3);
    setRecent(next);
    localStorage.setItem('recentActions', JSON.stringify(next));
  };

  const isSelected = (path: string, matchStart?: boolean) =>
    matchStart ? location.pathname.startsWith(path) : location.pathname === path;

  // Track which groups are open — default only the most-used ones open
  const navGroups = buildNav(isEmployee, isAdmin);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    navGroups.forEach((g) => { defaults[g.label] = false; });
    // Open the active group by default
    return defaults;
  });

  // Auto-open the group containing the current route on mount
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

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
      {/* ── Header ─────────────────────────────────────────────── */}
      <Box
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
        onClick={onToggle}
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

      {/* ── Scrollable nav body ─────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        <List disablePadding>

          {/* Top flat items: Dashboard + Notifications */}
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

          {/* Grouped nav sections */}
          {navGroups.map((group) => (
            <React.Fragment key={group.label}>
              {/* Group header */}
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
                        {openGroups[group.label] ? (
                          <ExpandLess sx={{ fontSize: 18, color: 'text.disabled' }} />
                        ) : (
                          <ExpandMore sx={{ fontSize: 18, color: 'text.disabled' }} />
                        )}
                      </>
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              {/* Group items */}
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

      {/* ── Bottom: Settings items ──────────────────────────────── */}
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
