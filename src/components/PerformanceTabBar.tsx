import React from 'react';
import AssessmentIcon    from '@mui/icons-material/Assessment';
import FlagIcon          from '@mui/icons-material/Flag';
import BarChartIcon      from '@mui/icons-material/BarChart';
import EventIcon         from '@mui/icons-material/Event';
import WorkIcon          from '@mui/icons-material/Work';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

// ─── Route detection ──────────────────────────────────────────────────────────
const PERF_PREFIXES = ['/goals', '/analytics-performance', '/schedule', '/projects'];

export const isPerformancePath = (pathname: string): boolean =>
  PERF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );

// ─── Tab definitions ──────────────────────────────────────────────────────────
const ADMIN_TABS: SectionTabItem[] = [
  { id: 'goals',       label: 'Goals & OKRs',        icon: <FlagIcon />,        path: '/goals',                 matchStart: true },
  { id: 'analytics',   label: 'Analytics',            icon: <BarChartIcon />,    path: '/analytics-performance', matchStart: true },
  { id: 'schedule',    label: 'Schedule',             icon: <EventIcon />,       path: '/schedule',              matchStart: true },
  { id: 'projects',    label: 'Projects',             icon: <WorkIcon />,        path: '/projects',              matchStart: true },
];

const EMPLOYEE_TABS: SectionTabItem[] = [
  { id: 'goals',     label: 'Goals & OKRs', icon: <FlagIcon />,     path: '/goals',                 matchStart: true },
  { id: 'analytics', label: 'Analytics',    icon: <BarChartIcon />, path: '/analytics-performance', matchStart: true },
  { id: 'schedule',  label: 'Schedule',     icon: <EventIcon />,    path: '/schedule',              matchStart: true },
];

// ─── Component ────────────────────────────────────────────────────────────────
const PerformanceTabBar: React.FC<{ isEmployee: boolean }> = ({ isEmployee }) => (
  <SectionTabBar
    title="Performance"
    subtitle={isEmployee ? 'Your goals & schedule' : 'Team performance & projects'}
    headerIcon={<AssessmentIcon />}
    tabs={isEmployee ? EMPLOYEE_TABS : ADMIN_TABS}
    gradient="linear-gradient(135deg, #0284c7 0%, #0ea5e9 55%, #38bdf8 100%)"
    shadowColor="rgba(14,165,233,0.3)"
    accentColor="#0284c7"
  />
);

export default PerformanceTabBar;
