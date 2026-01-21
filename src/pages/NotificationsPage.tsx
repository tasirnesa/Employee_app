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
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Delete as DeleteIcon,
    DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../api/notificationApi';
import type { Notification } from '../api/notificationApi';
import { format } from 'date-fns';

const NotificationsPage: React.FC = () => {
    const queryClient = useQueryClient();

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

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'SUCCESS':
                return <CheckCircleIcon color="success" />;
            case 'WARNING':
                return <WarningIcon color="warning" />;
            case 'ERROR':
                return <ErrorIcon color="error" />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    if (isLoading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>Loading notifications...</Typography>
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <NotificationsIcon color="primary" fontSize="large" />
                    Notifications
                </Typography>
                {notifications.some((n) => !n.isRead) && (
                    <Button
                        variant="outlined"
                        startIcon={<DoneAllIcon />}
                        onClick={() => markAllReadMutation.mutate()}
                    >
                        Mark all as read
                    </Button>
                )}
            </Box>

            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <List sx={{ p: 0 }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 10, textAlign: 'center' }}>
                            <NotificationsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                No notifications to show
                            </Typography>
                        </Box>
                    ) : (
                        notifications.map((notification, index) => (
                            <React.Fragment key={notification.id}>
                                {index > 0 && <Divider />}
                                <ListItem
                                    sx={{
                                        bgcolor: notification.isRead ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                                        p: 2,
                                        '&:hover': {
                                            bgcolor: 'action.hover',
                                        },
                                    }}
                                    secondaryAction={
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {!notification.isRead && (
                                                <Tooltip title="Mark as read">
                                                    <IconButton onClick={() => markReadMutation.mutate(notification.id)}>
                                                        <DoneAllIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Delete">
                                                <IconButton onClick={() => deleteMutation.mutate(notification.id)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                >
                                    <ListItemIcon sx={{ minWidth: 45 }}>
                                        {getTypeIcon(notification.type)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="subtitle1" fontWeight={notification.isRead ? 500 : 700}>
                                                    {notification.title}
                                                </Typography>
                                                {!notification.isRead && (
                                                    <Chip label="New" color="primary" size="small" sx={{ height: 20 }} />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                                                    {notification.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(new Date(notification.createdAt), 'PPP p')}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Paper>
        </Container>
    );
};

export default NotificationsPage;
