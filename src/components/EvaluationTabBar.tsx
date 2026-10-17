import React from 'react';
import RateReviewIcon       from '@mui/icons-material/RateReview';
import AddTaskIcon          from '@mui/icons-material/AddTask';
import ListAltIcon          from '@mui/icons-material/ListAlt';
import TuneIcon             from '@mui/icons-material/Tune';
import PlaylistAddIcon      from '@mui/icons-material/PlaylistAdd';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

// ─── Route detection ──────────────────────────────────────────────────────────
const EVAL_PREFIXES = ['/evaluations', '/criteria'];

export const isEvaluationPath = (pathname: string): boolean =>
  EVAL_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );

// ─── Tab definitions ──────────────────────────────────────────────────────────
const ADMIN_TABS: SectionTabItem[] = [
  {
    id: 'evaluations',
    label: 'Evaluations',
    icon: <RateReviewIcon />,
    actions: [
      { label: 'Create Session',    path: '/evaluations/create', icon: <AddTaskIcon />,  matchStart: false },
      { label: 'View Evaluations',  path: '/evaluations/view',   icon: <ListAltIcon />,  matchStart: true  },
    ],
  },
  {
    id: 'criteria',
    label: 'Criteria',
    icon: <TuneIcon />,
    actions: [
      { label: 'View Criteria',   path: '/criteria/view',   icon: <TuneIcon />,       matchStart: true  },
      { label: 'Create Criteria', path: '/criteria/create', icon: <PlaylistAddIcon />, matchStart: false },
    ],
  },
];

const EMPLOYEE_TABS: SectionTabItem[] = [
  { id: 'evaluations', label: 'My Evaluations', icon: <ListAltIcon />, path: '/evaluations/view', matchStart: true },
];

// ─── Component ────────────────────────────────────────────────────────────────
const EvaluationTabBar: React.FC<{ isEmployee: boolean }> = ({ isEmployee }) => (
  <SectionTabBar
    title="Evaluation"
    subtitle={isEmployee ? 'Your evaluations & reviews' : 'Performance review management'}
    headerIcon={<RateReviewIcon />}
    tabs={isEmployee ? EMPLOYEE_TABS : ADMIN_TABS}
    gradient="linear-gradient(135deg, #d97706 0%, #f59e0b 55%, #fbbf24 100%)"
    shadowColor="rgba(245,158,11,0.3)"
    accentColor="#d97706"
  />
);

export default EvaluationTabBar;
