import React from 'react';
import BarChartIcon      from '@mui/icons-material/BarChart';
import SummarizeIcon     from '@mui/icons-material/Summarize';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

const PREFIXES = ['/reports'];
export const isAnalyticsPath = (p: string) =>
  PREFIXES.some((x) => p === x || p.startsWith(x + '/') || p.startsWith(x + '?'));

const TABS: SectionTabItem[] = [
  { id: 'reports', label: 'Reports', icon: <SummarizeIcon />, path: '/reports', matchStart: true },
];

const AnalyticsTabBar: React.FC = () => (
  <SectionTabBar
    title="Analytics"
    subtitle="Insights & reports"
    headerIcon={<BarChartIcon />}
    tabs={TABS}
    gradient="linear-gradient(135deg, #b45309 0%, #d97706 55%, #f59e0b 100%)"
    shadowColor="rgba(217,119,6,0.3)"
    accentColor="#b45309"
  />
);
export default AnalyticsTabBar;
