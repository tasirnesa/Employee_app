import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import {
    Container,
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Divider,
    Button,
    Stack,
    Chip,
    Avatar,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Fade,
    Badge,
    Alert,
    Snackbar,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import CommentIcon from '@mui/icons-material/Comment';
import { format, formatDistanceToNow } from 'date-fns';

/* ─── helpers ─── */

const fmtDate = (d?: string | null) =>
    d ? format(new Date(d), 'MMM d, yyyy') : '—';

const fmtTime = (d?: string | null) =>
    d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '';

/* ─── tab panel ─── */

interface TabPanelProps { children: React.ReactNode; value: number; index: number }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
        {value === index && children}
    </Box>
);

/* ───────────────────────────────────────────── */
/*              MAIN COMPONENT                   */
/* ───────────────────────────────────────────── */

const MyTasks: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState(0);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; type: 'leave' | 'timesheet'; id: number | null }>({ open: false, type: 'leave', id: null });
    const [rejectComment, setRejectComment] = useState('');

    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const isManager = ['Admin', 'Manager', 'SuperAdmin'].includes(userProfile.role);

    /* ── data queries ── */

    const { data: pendingLeaves = [], isLoading: leavesLoading } = useQuery({
        queryKey: ['myTasks-leaves'],
        queryFn: async () => {
            const res = await api.get('/api/leaves');
            return (res.data || []).filter((l: any) => l.status === 'Pending');
        },
        enabled: isManager,
    });

    const { data: pendingTimesheets = [], isLoading: tsLoading } = useQuery({
        queryKey: ['myTasks-timesheets'],
        queryFn: async () => {
            const res = await api.get('/api/timesheets');
            return (res.data || []).filter((t: any) => t.status === 'Pending');
        },
        enabled: isManager,
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/api/notifications');
            return res.data || [];
        },
    });

    const unreadNotifications = notifications.filter((n: any) => !n.isRead);

    /* ── mutations ── */

    const approveLeave = useMutation({
        mutationFn: async (id: number) => {
            await api.patch(`/api/leaves/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myTasks-leaves'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setSnackbar({ open: true, message: 'Leave request approved successfully!', severity: 'success' });
        },
        onError: (err: any) => {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to approve leave', severity: 'error' });
        },
    });

    const rejectLeave = useMutation({
        mutationFn: async ({ id, comments }: { id: number; comments: string }) => {
            await api.patch(`/api/leaves/${id}/reject`, { comments });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myTasks-leaves'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setSnackbar({ open: true, message: 'Leave request rejected.', severity: 'success' });
            setRejectDialog({ open: false, type: 'leave', id: null });
            setRejectComment('');
        },
        onError: (err: any) => {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to reject leave', severity: 'error' });
        },
    });

    const approveTimesheet = useMutation({
        mutationFn: async (id: number) => {
            await api.patch(`/api/timesheets/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myTasks-timesheets'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setSnackbar({ open: true, message: 'Timesheet approved successfully!', severity: 'success' });
        },
        onError: (err: any) => {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to approve timesheet', severity: 'error' });
        },
    });

    const rejectTimesheet = useMutation({
        mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
            await api.patch(`/api/timesheets/${id}/reject`, { notes });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myTasks-timesheets'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            setSnackbar({ open: true, message: 'Timesheet rejected.', severity: 'success' });
            setRejectDialog({ open: false, type: 'timesheet', id: null });
            setRejectComment('');
        },
        onError: (err: any) => {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to reject timesheet', severity: 'error' });
        },
    });

    const handleRejectConfirm = () => {
        if (!rejectDialog.id) return;
        if (rejectDialog.type === 'leave') {
            rejectLeave.mutate({ id: rejectDialog.id, comments: rejectComment });
        } else {
            rejectTimesheet.mutate({ id: rejectDialog.id, notes: rejectComment });
        }
    };

    const totalPending = pendingLeaves.length + pendingTimesheets.length;

    return (
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
            <Fade in timeout={600}>
                <Box>
                    {/* ── HEADER BANNER ── */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 3,
                            background: 'linear-gradient(135deg, #1e3a5f 0%, #0d7377 40%, #14919b 100%)',
                            p: 4,
                            borderRadius: 4,
                            color: 'white',
                            boxShadow: '0 8px 32px rgba(30, 58, 95, 0.25)',
                        }}
                    >
                        <Box>
                            <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <InboxIcon fontSize="large" />
                                My Tasks
                            </Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 1 }}>
                                {totalPending > 0
                                    ? `You have ${totalPending} pending item${totalPending === 1 ? '' : 's'} awaiting your action`
                                    : 'All caught up — no pending tasks!'}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={2}>
                            <Box sx={{ textAlign: 'center', px: 3, py: 1, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 }}>
                                <Typography variant="h4" fontWeight={800}>{pendingLeaves.length}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Leave Requests</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', px: 3, py: 1, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 }}>
                                <Typography variant="h4" fontWeight={800}>{pendingTimesheets.length}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Timesheets</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', px: 3, py: 1, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 }}>
                                <Typography variant="h4" fontWeight={800}>{unreadNotifications.length}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Notifications</Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* ── TABS ── */}
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <Tabs
                            value={tab}
                            onChange={(_, v) => setTab(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                px: 2,
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem', minHeight: 56 },
                                '& .Mui-selected': { color: '#1e3a5f' },
                                '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f', height: 3, borderRadius: '3px 3px 0 0' },
                            }}
                        >
                            <Tab
                                icon={<Badge badgeContent={pendingLeaves.length} color="error"><EventNoteIcon /></Badge>}
                                iconPosition="start"
                                label="Leave Requests"
                            />
                            <Tab
                                icon={<Badge badgeContent={pendingTimesheets.length} color="warning"><AccessTimeIcon /></Badge>}
                                iconPosition="start"
                                label="Timesheets"
                            />
                            <Tab
                                icon={<Badge badgeContent={unreadNotifications.length} color="info"><InboxIcon /></Badge>}
                                iconPosition="start"
                                label="Recent Activity"
                            />
                        </Tabs>
                        <Divider />

                        <Box sx={{ p: 3 }}>
                            {/* ── TAB 0: LEAVE REQUESTS ── */}
                            <TabPanel value={tab} index={0}>
                                {!isManager ? (
                                    <Alert severity="info">Only Admins and Managers can approve leave requests.</Alert>
                                ) : pendingLeaves.length === 0 ? (
                                    <EmptyState icon={<DoneAllIcon sx={{ fontSize: 64 }} />} title="No Pending Leave Requests" subtitle="All leave requests have been processed." />
                                ) : (
                                    <Stack spacing={2}>
                                        {pendingLeaves.map((leave: any) => (
                                            <Card
                                                key={leave.id}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 3,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
                                                }}
                                            >
                                                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                                        {/* Left: Employee & Leave Details */}
                                                        <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 300 }}>
                                                            <Avatar sx={{ bgcolor: '#6366f1', width: 48, height: 48, fontWeight: 700 }}>
                                                                {(leave.employee?.fullName?.[0] || 'U').toUpperCase()}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle1" fontWeight={700}>
                                                                    {leave.employee?.fullName || `Employee #${leave.employeeId}`}
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                                    <Chip
                                                                        size="small"
                                                                        icon={<EventNoteIcon sx={{ fontSize: 14 }} />}
                                                                        label={leave.leaveType?.name || 'Leave'}
                                                                        color="primary"
                                                                        variant="outlined"
                                                                    />
                                                                    <Chip
                                                                        size="small"
                                                                        label={`${leave.days} day${leave.days !== 1 ? 's' : ''}`}
                                                                        variant="outlined"
                                                                    />
                                                                </Stack>

                                                                <Box sx={{ mt: 1.5, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {fmtDate(leave.startDate)} — {fmtDate(leave.endDate)}
                                                                        </Typography>
                                                                    </Box>
                                                                    {leave.appliedDate && (
                                                                        <Typography variant="caption" color="text.disabled">
                                                                            Submitted {fmtTime(leave.appliedDate)}
                                                                        </Typography>
                                                                    )}
                                                                </Box>

                                                                {leave.reason && (
                                                                    <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <CommentIcon sx={{ fontSize: 14 }} /> Reason:
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ mt: 0.5 }}>{leave.reason}</Typography>
                                                                    </Paper>
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        {/* Right: Action Buttons */}
                                                        <Stack direction="row" spacing={1} sx={{ mt: { xs: 2, md: 0 } }}>
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={<ThumbUpIcon />}
                                                                onClick={() => approveLeave.mutate(leave.id)}
                                                                disabled={approveLeave.isPending}
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    textTransform: 'none',
                                                                    fontWeight: 600,
                                                                    px: 3,
                                                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                                                }}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                startIcon={<ThumbDownIcon />}
                                                                onClick={() => setRejectDialog({ open: true, type: 'leave', id: leave.id })}
                                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                )}
                            </TabPanel>

                            {/* ── TAB 1: TIMESHEETS ── */}
                            <TabPanel value={tab} index={1}>
                                {!isManager ? (
                                    <Alert severity="info">Only Admins and Managers can approve timesheets.</Alert>
                                ) : pendingTimesheets.length === 0 ? (
                                    <EmptyState icon={<DoneAllIcon sx={{ fontSize: 64 }} />} title="No Pending Timesheets" subtitle="All timesheets have been reviewed." />
                                ) : (
                                    <Stack spacing={2}>
                                        {pendingTimesheets.map((ts: any) => (
                                            <Card
                                                key={ts.id}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 3,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transform: 'translateY(-1px)' },
                                                }}
                                            >
                                                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                                        <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 300 }}>
                                                            <Avatar sx={{ bgcolor: '#0ea5e9', width: 48, height: 48, fontWeight: 700 }}>
                                                                {(ts.employee?.fullName?.[0] || 'U').toUpperCase()}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle1" fontWeight={700}>
                                                                    {ts.employee?.fullName || `Employee #${ts.employeeId}`}
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                                    {ts.project?.name && (
                                                                        <Chip size="small" icon={<AssignmentIcon sx={{ fontSize: 14 }} />} label={ts.project.name} color="info" variant="outlined" />
                                                                    )}
                                                                    <Chip size="small" label={`${ts.hoursWorked}h worked`} variant="outlined" />
                                                                    {ts.overtimeHours > 0 && (
                                                                        <Chip size="small" label={`+${ts.overtimeHours}h OT`} color="warning" variant="outlined" />
                                                                    )}
                                                                </Stack>

                                                                <Box sx={{ mt: 1.5, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {fmtDate(ts.date)}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {ts.startTime} — {ts.endTime}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                {ts.taskDescription && (
                                                                    <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#f8fafc' }}>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                            <AssignmentIcon sx={{ fontSize: 14 }} /> Task:
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{ mt: 0.5 }}>{ts.taskDescription}</Typography>
                                                                    </Paper>
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        <Stack direction="row" spacing={1} sx={{ mt: { xs: 2, md: 0 } }}>
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={<ThumbUpIcon />}
                                                                onClick={() => approveTimesheet.mutate(ts.id)}
                                                                disabled={approveTimesheet.isPending}
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    textTransform: 'none',
                                                                    fontWeight: 600,
                                                                    px: 3,
                                                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                                                }}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="error"
                                                                startIcon={<ThumbDownIcon />}
                                                                onClick={() => setRejectDialog({ open: true, type: 'timesheet', id: ts.id })}
                                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Stack>
                                )}
                            </TabPanel>

                            {/* ── TAB 2: RECENT ACTIVITY ── */}
                            <TabPanel value={tab} index={2}>
                                {notifications.length === 0 ? (
                                    <EmptyState icon={<InboxIcon sx={{ fontSize: 64 }} />} title="No Recent Activity" subtitle="Your activity feed will appear here." />
                                ) : (
                                    <Stack spacing={1}>
                                        {notifications.slice(0, 15).map((n: any) => (
                                            <Paper
                                                key={n.id}
                                                variant="outlined"
                                                onClick={() => n.link && navigate(n.link)}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    cursor: n.link ? 'pointer' : 'default',
                                                    bgcolor: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
                                                    transition: 'all 0.2s',
                                                    '&:hover': n.link ? { bgcolor: 'rgba(99, 102, 241, 0.08)', transform: 'translateX(4px)' } : {},
                                                }}
                                            >
                                                <Box sx={{
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: n.type === 'SUCCESS' ? '#10b98115' : n.type === 'WARNING' ? '#f59e0b15' : n.type === 'ERROR' ? '#ef444415' : '#6366f115',
                                                    display: 'flex',
                                                }}>
                                                    {n.type === 'SUCCESS' ? <CheckCircleIcon sx={{ color: '#10b981' }} />
                                                        : n.type === 'WARNING' ? <HourglassEmptyIcon sx={{ color: '#f59e0b' }} />
                                                            : n.type === 'ERROR' ? <CancelIcon sx={{ color: '#ef4444' }} />
                                                                : <InboxIcon sx={{ color: '#6366f1' }} />}
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" fontWeight={n.isRead ? 500 : 700}>{n.title}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{n.message}</Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap' }}>
                                                    {fmtTime(n.createdAt)}
                                                </Typography>
                                                {!n.isRead && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366f1' }} />}
                                            </Paper>
                                        ))}
                                        <Box sx={{ textAlign: 'center', pt: 2 }}>
                                            <Button variant="text" onClick={() => navigate('/notifications')}>
                                                View All Notifications →
                                            </Button>
                                        </Box>
                                    </Stack>
                                )}
                            </TabPanel>
                        </Box>
                    </Paper>
                </Box>
            </Fade>

            {/* ── REJECT DIALOG ── */}
            <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ ...rejectDialog, open: false })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Reject {rejectDialog.type === 'leave' ? 'Leave Request' : 'Timesheet'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Please provide a reason for the rejection. This will be visible to the employee.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Reason for Rejection"
                        placeholder="e.g. Insufficient team coverage during this period..."
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setRejectDialog({ ...rejectDialog, open: false }); setRejectComment(''); }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleRejectConfirm}
                        disabled={rejectLeave.isPending || rejectTimesheet.isPending}
                    >
                        Confirm Rejection
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── SNACKBAR ── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

/* ── empty state component ── */

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
    <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
        <Box sx={{ opacity: 0.3, mb: 2 }}>{icon}</Box>
        <Typography variant="h6" fontWeight={600} color="text.secondary">{title}</Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>{subtitle}</Typography>
    </Box>
);

export default MyTasks;
