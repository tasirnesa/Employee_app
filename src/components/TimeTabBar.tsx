import React from 'react';
import AccessTimeIcon    from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import TableChartIcon    from '@mui/icons-material/TableChart';
import BeachAccessIcon   from '@mui/icons-material/BeachAccess';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

// ─── Route detection ──────────────────────────────────────────────────────────
const TIME_PREFIXES = ['/attendance', '/timesheets', '/leave-management'];

export const isTimePath = (pathname: string): boolean =>
  TIME_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS: SectionTabItem[] = [
  { id: 'attendance',      label: 'Attendance',      icon: <EventAvailableIcon />, path: '/attendance',       matchStart: true },
  { id: 'timesheets',      label: 'Timesheets',      icon: <TableChartIcon />,     path: '/timesheets',       matchStart: true },
  { id: 'leave',           label: 'Leave Management',icon: <BeachAccessIcon />,    path: '/leave-management', matchStart: true },
];

// ─── Component ────────────────────────────────────────────────────────────────
const TimeTabBar: React.FC = () => (
  <SectionTabBar
    title="Time & Attendance"
    subtitle="Attendance, timesheets & leave"
    headerIcon={<AccessTimeIcon />}
    tabs={TABS}
    gradient="linear-gradient(135deg, #e11d48 0%, #f43f5e 55%, #fb7185 100%)"
    shadowColor="rgba(244,63,94,0.3)"
    accentColor="#e11d48"
  />
);

export default TimeTabBar;
