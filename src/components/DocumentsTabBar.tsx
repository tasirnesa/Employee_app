import React from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderOpenIcon  from '@mui/icons-material/FolderOpen';
import DevicesIcon     from '@mui/icons-material/Devices';
import SectionTabBar, { type SectionTabItem } from './SectionTabBar';

const PREFIXES = ['/document-management', '/asset-management'];
export const isDocumentsPath = (p: string) =>
  PREFIXES.some((x) => p === x || p.startsWith(x + '/') || p.startsWith(x + '?'));

const ADMIN_TABS: SectionTabItem[] = [
  { id: 'docs',   label: 'Documents', icon: <FolderOpenIcon />, path: '/document-management', matchStart: true },
  { id: 'assets', label: 'Assets',    icon: <DevicesIcon />,    path: '/asset-management',    matchStart: true },
];

const EMPLOYEE_TABS: SectionTabItem[] = [
  { id: 'docs', label: 'Documents', icon: <FolderOpenIcon />, path: '/document-management', matchStart: true },
];

const DocumentsTabBar: React.FC<{ isEmployee: boolean }> = ({ isEmployee }) => (
  <SectionTabBar
    title="Documents"
    subtitle={isEmployee ? 'Your documents' : 'Documents & asset management'}
    headerIcon={<DescriptionIcon />}
    tabs={isEmployee ? EMPLOYEE_TABS : ADMIN_TABS}
    gradient="linear-gradient(135deg, #475569 0%, #64748b 55%, #94a3b8 100%)"
    shadowColor="rgba(100,116,139,0.3)"
    accentColor="#475569"
  />
);
export default DocumentsTabBar;
