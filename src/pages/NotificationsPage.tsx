import React from 'react';
import {
    Container,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Tooltip,
    Box,
    Divider,
    Chip,
    Button,
    Fade,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Delete as DeleteIcon,
    DoneAll as DoneAllIcon,
    ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from '../api/notificationApi';
import type { Notification } from '../api/notificationApi';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
    });

    const markReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const clearAllMutation = useMutation({
        mutationFn: clearAllNotifications,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'SUCCESS':
                return <CheckCircleIcon sx={{ color: 'success.main' }} />;
            case 'WARNING':
                return <WarningIcon sx={{ color: 'warning.main' }} />;
            case 'ERROR':
                return <ErrorIcon sx={{ color: 'error.main' }} />;
            default:
                return <InfoIcon sx={{ color: 'info.main' }} />;
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markReadMutation.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    if (isLoading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>Loading your notifications...</Typography>
            </Container>
        );
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
            <Fade in={true} timeout={800}>
                <Box>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 4,
                        background: 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)',
                        p: 4,
                        borderRadius: 4,
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(25, 118, 210, 0.2)'
                    }}>
                        <Box>
                            <Typography variant="h4" component="h1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <NotificationsIcon fontSize="large" />
                                Notifications
                            </Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
                                {unreadCount > 0 
                                    ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                                    : 'You\'re all caught up!'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {unreadCount > 0 && (
                                <Button
                                    variant="contained"
                                    color="inherit"
                                    startIcon={<DoneAllIcon />}
                                    onClick={() => markAllReadMutation.mutate()}
                                    sx={{ color: 'primary.main', bgcolor: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
                                >
                                    Mark All Read
                                </Button>
                            )}
                            {notifications.length > 0 && (
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<ClearAllIcon />}
                                    onClick={() => clearAllMutation.mutate()}
                                    sx={{ borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                                >
                                    Clear All
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Paper 
                        elevation={0} 
                        sx={{ 
                            borderRadius: 4, 
                            overflow: 'hidden', 
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                        }}
                    >
                        {notifications.length === 0 ? (
                            <Box sx={{ p: 12, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <NotificationsIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.3, mb: 3 }} />
                                <Typography variant="h5" color="text.secondary" fontWeight={500}>
                                    No notifications yet
                                </Typography>
                                <Typography variant="body1" color="text.disabled" sx={{ mt: 1 }}>
                                    Stay tuned! We'll notify you when something important happens.
                                </Typography>
                            </Box>
                        ) : (
                            <List sx={{ p: 0 }}>
                                {notifications.map((notification, index) => (
                                    <React.Fragment key={notification.id}>
                                        {index > 0 && <Divider />}
                                        <ListItem
                                            onClick={() => handleNotificationClick(notification)}
                                            sx={{
                                                bgcolor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.03)',
                                                p: 3,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: 'rgba(25, 118, 210, 0.06)',
                                                    transform: 'translateX(4px)'
                                                },
                                            }}
                                            secondaryAction={
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {!notification.isRead && (
                                                        <Tooltip title="Mark as read">
                                                            <IconButton 
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markReadMutation.mutate(notification.id);
                                                                }}
                                                            >
                                                                <DoneAllIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Delete">
                                                        <IconButton 
                                                            size="small"
                                                            onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteMutation.mutate(notification.id);
                                                                }} 
                                                            color="error"
                                                            sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 56 }}>
                                                <Box sx={{ 
                                                    p: 1.5, 
                                                    borderRadius: '50%', 
                                                    bgcolor: 'rgba(0,0,0,0.03)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {getTypeIcon(notification.type)}
                                                </Box>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                                        <Typography 
                                                            variant="subtitle1" 
                                                            fontWeight={notification.isRead ? 600 : 800}
                                                            color="text.primary"
                                                        >
                                                            {notification.title}
                                                        </Typography>
                                                        {!notification.isRead && (
                                                            <Chip 
                                                                label="NEW" 
                                                                color="primary" 
                                                                size="small" 
                                                                sx={{ 
                                                                    height: 18, 
                                                                    fontSize: '0.65rem', 
                                                                    fontWeight: 900,
                                                                    borderRadius: 1
                                                                }} 
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.6 }}>
                                                            {notification.message}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <Box component="span" sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'currentColor' }} />
                                                            {format(new Date(notification.createdAt), 'PPP p')}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Box>
            </Fade>
        </Container>
    );
};

export default NotificationsPage;
