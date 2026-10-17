import React from 'react';
import InboxIcon    from '@mui/icons-material/Inbox';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

const PREFIXES = ['/inbox', '/todo'];
export const isWorkPath = (p: string) =>
  PREFIXES.some((x) => p === x || p.startsWith(x + '/') || p.startsWith(x + '?'));

const TABS: SectionTabItem[] = [
  { id: 'tasks', label: 'My Tasks',  icon: <CheckBoxIcon />,         path: '/inbox', matchStart: true },
  { id: 'todo',  label: 'Todo List', icon: <PlaylistAddCheckIcon />, path: '/todo',  matchStart: true },
];

const WorkTabBar: React.FC = () => (
  <SectionTabBar
    title="Work"
    subtitle="Tasks & to-do lists"
    headerIcon={<InboxIcon />}
    tabs={TABS}
    gradient="linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #2dd4bf 100%)"
    shadowColor="rgba(20,184,166,0.3)"
    accentColor="#0f766e"
  />
);
export default WorkTabBar;
