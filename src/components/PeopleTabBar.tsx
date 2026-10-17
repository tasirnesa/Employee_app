import React from 'react';
import PeopleIcon           from '@mui/icons-material/People';
import ManageAccountsIcon   from '@mui/icons-material/ManageAccounts';
import PersonAddIcon        from '@mui/icons-material/PersonAdd';
import PersonIcon           from '@mui/icons-material/Person';
import BusinessIcon         from '@mui/icons-material/Business';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AccountCircleIcon    from '@mui/icons-material/AccountCircle';
import AssignmentIcon       from '@mui/icons-material/Assignment';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

// ─── Route detection ──────────────────────────────────────────────────────────
const PEOPLE_PREFIXES = ['/users', '/employees', '/departments', '/positions', '/onboarding/me'];

export const isPeoplePath = (pathname: string): boolean =>
  PEOPLE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );

// ─── Tab definitions ──────────────────────────────────────────────────────────
const ADMIN_TABS: SectionTabItem[] = [
  {
    id: 'users',
    label: 'Users',
    icon: <ManageAccountsIcon />,
    actions: [
      { label: 'View Users',  path: '/users/view',   icon: <ManageAccountsIcon />, matchStart: true },
      { label: 'Create User', path: '/users/create', icon: <PersonAddIcon /> },
    ],
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: <PersonIcon />,
    actions: [
      { label: 'View Employees',  path: '/employees/view',   icon: <PersonIcon />,    matchStart: true },
      { label: 'Create Employee', path: '/employees/create', icon: <PersonAddIcon /> },
    ],
  },
  { id: 'departments', label: 'Departments', icon: <BusinessIcon />,       path: '/departments' },
  { id: 'positions',   label: 'Positions',   icon: <WorkspacePremiumIcon />, path: '/positions' },
];

const EMPLOYEE_TABS: SectionTabItem[] = [
  { id: 'profile',    label: 'My Profile',    icon: <AccountCircleIcon />, path: '/employees/view' },
  { id: 'onboarding', label: 'My Onboarding', icon: <AssignmentIcon />,    path: '/onboarding/me' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const PeopleTabBar: React.FC<{ isEmployee: boolean }> = ({ isEmployee }) => (
  <SectionTabBar
    title="People"
    subtitle={isEmployee ? 'Your profile & onboarding' : 'Workforce management'}
    headerIcon={<PeopleIcon />}
    tabs={isEmployee ? EMPLOYEE_TABS : ADMIN_TABS}
    gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a78bfa 100%)"
    shadowColor="rgba(99,102,241,0.3)"
    accentColor="#6366f1"
  />
);

export default PeopleTabBar;
