import React from 'react';
import GroupAddIcon  from '@mui/icons-material/GroupAdd';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

const PREFIXES = ['/recruitment'];
export const isRecruitmentPath = (p: string) =>
  PREFIXES.some((x) => p === x || p.startsWith(x + '/') || p.startsWith(x + '?'));

const TABS: SectionTabItem[] = [
  { id: 'candidates', label: 'Candidates', icon: <PeopleOutlineIcon />, path: '/recruitment', matchStart: true },
];

const RecruitmentTabBar: React.FC = () => (
  <SectionTabBar
    title="Recruitment"
    subtitle="Talent acquisition & candidates"
    headerIcon={<GroupAddIcon />}
    tabs={TABS}
    gradient="linear-gradient(135deg, #db2777 0%, #ec4899 55%, #f472b6 100%)"
    shadowColor="rgba(236,72,153,0.3)"
    accentColor="#db2777"
  />
);
export default RecruitmentTabBar;
