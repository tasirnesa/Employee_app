import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Avatar, Menu, MenuItem, IconButton, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types/interfaces';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  console.log('Header rendering, user:', user);
  const navigate = useNavigate();
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const profileOpen = Boolean(profileAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Opening profile menu');
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    console.log('Closing profile menu');
    setProfileAnchorEl(null);
  };

  const handleSettings = () => {
    console.log('Navigating to settings');
    setProfileAnchorEl(null);
    navigate('/settings');
  };

  const handleLogout = () => {
    console.log('Logging out');
    setProfileAnchorEl(null);
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <AppBar
      position="static"
      sx={{ width: `calc(100% - ${240}px)`, ml: `${240}px`, mb: 3 }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Employee Evaluation
        </Typography>
        {user && (
          <>
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
              aria-label="profile menu"
            >
              <Avatar sx={{ bgcolor: '#1976d2' }}>
                {user.fullName ? getInitials(user.fullName) : 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={profileAnchorEl}
              open={profileOpen}
              onClose={handleProfileMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="subtitle1">{user.fullName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {user.role}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleSettings}>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;