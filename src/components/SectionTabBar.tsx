import React, { useState } from 'react';
import {
  Box,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SectionTabAction {
  label: string;
  path: string;
  icon: React.ReactNode;
  matchStart?: boolean;
}

export interface SectionTabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** If set, clicking opens a dropdown with these actions */
  actions?: SectionTabAction[];
  /** If set, clicking navigates directly */
  path?: string;
  matchStart?: boolean;
}

export interface SectionTabBarProps {
  title: string;
  subtitle: string;
  headerIcon: React.ReactNode;
  tabs: SectionTabItem[];
  /** CSS gradient string, e.g. 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' */
  gradient: string;
  /** Shadow color for the banner, e.g. 'rgba(99,102,241,0.3)' */
  shadowColor: string;
  /** Accent color used in the dropdown header and for active items */
  accentColor: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
export const isTabActive = (tab: SectionTabItem, pathname: string): boolean => {
  if (tab.actions) {
    return tab.actions.some((a) =>
      a.matchStart ? pathname.startsWith(a.path) : pathname === a.path
    );
  }
  if (tab.path) {
    return tab.matchStart ? pathname.startsWith(tab.path) : pathname === tab.path;
  }
  return false;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SectionTabBar: React.FC<SectionTabBarProps> = ({
  title,
  subtitle,
  headerIcon,
  tabs,
  gradient,
  shadowColor,
  accentColor,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; tabId: string } | null>(null);

  const handleTabClick = (e: React.MouseEvent<HTMLElement>, tab: SectionTabItem) => {
    if (tab.actions) {
      setMenuAnchor({ el: e.currentTarget, tabId: tab.id });
    } else if (tab.path) {
      navigate(tab.path);
    }
  };

  const closeMenu = () => setMenuAnchor(null);
  const goTo = (path: string) => { navigate(path); closeMenu(); };
  const openTab = tabs.find((t) => t.id === menuAnchor?.tabId);

  return (
    <>
      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, background: gradient, boxShadow: `0 4px 24px ${shadowColor}` }}>
        {/* Decorative blobs — isolated so they don't clip the tab content */}
        <Box
          sx={{
            position: 'absolute', inset: 0,
            overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
            '&::before': {
              content: '""', position: 'absolute',
              top: -50, right: -50, width: 180, height: 180,
              borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
            },
            '&::after': {
              content: '""', position: 'absolute',
              bottom: -25, right: 220, width: 100, height: 100,
              borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
            },
          }}
        />

        {/* Content */}
        <Box
          sx={{
            position: 'relative', zIndex: 1,
            px: { xs: 2, md: 3 }, py: 1.5,
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap',
          }}
        >
          {/* Icon + title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexShrink: 0 }}>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '10px', p: 0.85,
              display: 'flex', alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
            }}>
              <Box sx={{ color: 'white', display: 'flex', alignItems: 'center', '& svg': { fontSize: 20 } }}>
                {headerIcon}
              </Box>
            </Box>
            <Box>
              <Typography fontWeight={800} color="white" fontSize={14} lineHeight={1.2}>{title}</Typography>
              <Typography color="rgba(255,255,255,0.7)" fontSize={11}>{subtitle}</Typography>
            </Box>
          </Box>

          {/* Separator */}
          <Box sx={{ width: '1px', height: 32, bgcolor: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />

          {/* Tabs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
            {tabs.map((tab) => {
              const active = isTabActive(tab, location.pathname);
              return (
                <Box
                  key={tab.id}
                  onClick={(e) => handleTabClick(e, tab)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.75,
                    px: 1.75, py: 0.85, borderRadius: '8px',
                    cursor: 'pointer', userSelect: 'none', transition: 'all 0.18s ease',
                    color: active ? 'white' : 'rgba(255,255,255,0.8)',
                    fontWeight: active ? 700 : 500,
                    background: active ? 'rgba(255,255,255,0.22)' : 'transparent',
                    border: '1px solid',
                    borderColor: active ? 'rgba(255,255,255,0.4)' : 'transparent',
                    '&:hover': {
                      background: active ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.12)',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.25)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit', '& svg': { fontSize: 16 } }}>
                    {tab.icon}
                  </Box>
                  <Typography fontSize={13} fontWeight="inherit" color="inherit" sx={{ whiteSpace: 'nowrap' }}>
                    {tab.label}
                  </Typography>
                  {tab.actions && (
                    <KeyboardArrowDownIcon sx={{ fontSize: 15, color: 'inherit' }} />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* ── Dropdown Menu ────────────────────────────────────────────────── */}
      <Menu
        anchorEl={menuAnchor?.el ?? null}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            elevation: 10,
            sx: {
              mt: 0.5, minWidth: 210,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: `${accentColor}25`,
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
            },
          },
        }}
      >
        <Box sx={{
          px: 2, py: 1.2,
          background: gradient,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <Box sx={{ color: 'rgba(255,255,255,0.85)', display: 'flex', '& svg': { fontSize: 18 } }}>
            {openTab?.icon}
          </Box>
          <Typography fontWeight={800} color="white" fontSize={12} sx={{ letterSpacing: 0.3 }}>
            {openTab?.label}
          </Typography>
        </Box>

        <Divider />

        {openTab?.actions?.map((action) => {
          const active = action.matchStart
            ? location.pathname.startsWith(action.path)
            : location.pathname === action.path;

          return (
            <MenuItem
              key={action.path}
              onClick={() => goTo(action.path)}
              sx={{
                py: 1.2, px: 2, fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? accentColor : 'text.primary',
                '&:hover': { bgcolor: `${accentColor}10` },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28, color: active ? accentColor : 'text.secondary', '& svg': { fontSize: 18 } }}>
                {action.icon}
              </ListItemIcon>
              <ListItemText
                primary={action.label}
                primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500 }}
              />
              {active && <CheckRoundedIcon sx={{ fontSize: 16, color: accentColor, ml: 1, flexShrink: 0 }} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default SectionTabBar;
