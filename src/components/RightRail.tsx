import React from 'react';
import { Box, Typography, Avatar, IconButton, Divider, TextField, InputAdornment, List, ListItem, ListItemAvatar, ListItemText, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CallIcon from '@mui/icons-material/Call';
import EmailIcon from '@mui/icons-material/Email';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useQuery } from '@tanstack/react-query';
import { listEmployees } from '../api/employeeApi';
import type { Employee } from '../types/interfaces';

const RightRail: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['employees', 'right-rail'],
    queryFn: async () => await listEmployees(true),
  });
  const employees: Employee[] = data || [];
  const filtered = React.useMemo(() => {
    if (!query) return employees;
    const q = query.toLowerCase();
    return employees.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q));
  }, [employees, query]);
  return (
    <Box
      component="aside"
      sx={{
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
        width: 320,
        minWidth: 320,
        height: '100vh',
        px: 2,
        py: 2,
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: { xs: 'none', lg: 'block' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          All Contacts
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isLoading ? '—' : filtered.length}
        </Typography>
      </Box>
      <TextField
        size="small"
        fullWidth
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ my: 2 }}>
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            background: (theme) => theme.palette.grey[100],
            height: 120,
            mb: 1.5,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Quick Connects
        </Typography>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress size={20} />
        </Box>
      ) : (
      <List dense sx={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto', pr: 1 }}>
        {filtered.map((e) => (
          <ListItem
            key={e.id}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton size="small" aria-label="call"><CallIcon fontSize="small" /></IconButton>
                <IconButton size="small" aria-label="email"><EmailIcon fontSize="small" /></IconButton>
                <IconButton size="small" aria-label="chat"><ChatBubbleOutlineIcon fontSize="small" /></IconButton>
              </Box>
            }
            sx={{ px: 0.5 }}
          >
            <ListItemAvatar>
              <Avatar src={e.profileImageUrl || undefined}>{(!e.profileImageUrl && e.firstName) ? e.firstName.charAt(0) : undefined}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={`${e.firstName} ${e.lastName}`}
              secondary={
                <Box component="span" sx={{ display: 'inline-flex', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">{e.position || '—'}</Typography>
                  <Typography variant="caption">{e.department || '—'}</Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
      )}
    </Box>
  );
};

export default RightRail;


