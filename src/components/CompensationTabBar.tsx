import React from 'react';
import PaidIcon       from '@mui/icons-material/Paid';
import PaymentsIcon   from '@mui/icons-material/Payments';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

const PREFIXES = ['/payroll', '/benefits'];
export const isCompensationPath = (p: string) =>
  PREFIXES.some((x) => p === x || p.startsWith(x + '/') || p.startsWith(x + '?'));

const TABS: SectionTabItem[] = [
  { id: 'payroll',  label: 'Payroll',        icon: <PaymentsIcon />,    path: '/payroll',  matchStart: true },
  { id: 'benefits', label: 'Benefits & Perks',icon: <CardGiftcardIcon />, path: '/benefits', matchStart: true },
];

const CompensationTabBar: React.FC = () => (
  <SectionTabBar
    title="Compensation"
    subtitle="Payroll & employee benefits"
    headerIcon={<PaidIcon />}
    tabs={TABS}
    gradient="linear-gradient(135deg, #7c3aed 0%, #8b5cf6 55%, #a78bfa 100%)"
    shadowColor="rgba(139,92,246,0.3)"
    accentColor="#7c3aed"
  />
);
export default CompensationTabBar;
