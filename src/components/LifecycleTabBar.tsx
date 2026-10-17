import React from 'react';
import BadgeIcon              from '@mui/icons-material/Badge';
import PersonAddAltIcon       from '@mui/icons-material/PersonAddAlt';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import HourglassTopIcon       from '@mui/icons-material/HourglassTop';
import DirectionsRunIcon      from '@mui/icons-material/DirectionsRun';
import ManageSearchIcon       from '@mui/icons-material/ManageSearch';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

// ─── Route detection ──────────────────────────────────────────────────────────
const LIFECYCLE_PREFIXES = ['/onboarding', '/probation', '/offboarding'];

export const isLifecyclePath = (pathname: string): boolean =>
  LIFECYCLE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );

// ─── Tab definitions ──────────────────────────────────────────────────────────
const LIFECYCLE_TABS: SectionTabItem[] = [
  {
    id: 'onboarding',
    label: 'Onboarding',
    icon: <AssignmentTurnedInIcon />,
    actions: [
      { label: 'New Hire Wizard', path: '/onboarding/wizard', icon: <PersonAddAltIcon />,  matchStart: false },
      { label: 'View Onboarding', path: '/onboarding',        icon: <ManageSearchIcon />,  matchStart: false },
    ],
  },
  { id: 'probation',   label: 'Probation',   icon: <HourglassTopIcon />,  path: '/probation' },
  { id: 'offboarding', label: 'Offboarding', icon: <DirectionsRunIcon />, path: '/offboarding' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const LifecycleTabBar: React.FC = () => (
  <SectionTabBar
    title="Lifecycle"
    subtitle="Employee journey management"
    headerIcon={<BadgeIcon />}
    tabs={LIFECYCLE_TABS}
    gradient="linear-gradient(135deg, #059669 0%, #10b981 55%, #34d399 100%)"
    shadowColor="rgba(16,185,129,0.3)"
    accentColor="#059669"
  />
);

export default LifecycleTabBar;
