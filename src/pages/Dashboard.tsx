import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Button,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Employee } from '../types/interfaces';
import { listEmployees } from '../api/employeeApi';
import { getThreads } from '../api/messageApi';
import api from '../lib/axios';
import {
  Info as InfoIcon,
  Assignment as EvalIcon,
  FlightTakeoff as LeaveIcon,
  Flag as GoalIcon,
  ArrowForward as ArrowIcon,
  Notifications as NotifIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material';
import HrStats from '../components/HrStats';
import DashboardQuickActions from '../components/DashboardQuickActions';
import DashboardCharts from '../components/DashboardCharts';

interface DashboardAction {
  id: number;
  type: 'LEAVE' | 'EVALUATION' | 'GOAL';
  title: string;
  subtitle: string;
  link: string;
}

interface DashboardActions {
  pendingLeaves: DashboardAction[];
  activeSessions: DashboardAction[];
  pendingGoals: DashboardAction[];
  unreadCount: number;
}

const Dashboard: React.FC = () => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [helpdeskOpen, setHelpdeskOpen] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch {
      return {} as any;
    }
  })();

  const role = currentUser?.role || 'Employee';
  const isAdmin = role === 'Admin' || role === 'SuperAdmin';
  const isEmployee = role === 'Employee';
  const showOrgAnalytics = isAdmin || role === 'Manager';

  const { data: employeesForTime } = useQuery({
    queryKey: ['employees-for-timeoff'],
    queryFn: async () => await listEmployees(true),
    staleTime: 5 * 60 * 1000,
  });

  const { data: actions } = useQuery({
    queryKey: ['dashboard-actions'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/actions');
      return response.data as DashboardActions;
    },
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    },
  });

  const employeeCacheKey = currentUser?.id ? `meEmployee_${currentUser.id}` : undefined;
  const cachedMe = (() => {
    if (!employeeCacheKey) return null;
    try { return JSON.parse(localStorage.getItem(employeeCacheKey) || 'null'); } catch { return null; }
  })();
  const normalize = (s?: string | null) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const liveMe = (() => {
    const list = employeesForTime || [];
    const byUserId = list.find((e) => e.userId === currentUser?.id);
    if (byUserId) return byUserId;
    const userName = normalize(currentUser?.fullName as any);
    const byName = list.find((e) => `${normalize(e.firstName)} ${normalize(e.lastName)}` === userName);
    if (byName) return byName;
    return undefined;
  })();
  const meEmployee: Employee | undefined = liveMe || cachedMe || undefined;

  const computeEntitlement = (hireDate?: string | null) => {
    if (!hireDate) return 0;
    const start = new Date(hireDate);
    if (Number.isNaN(start.getTime())) return 16;
    const years = new Date().getFullYear() - start.getFullYear();
    if (years <= 0) return 16;
    if (years === 1) return 18;
    return 20 + (years - 2) * 2;
  };
  const entitlementDays = computeEntitlement(meEmployee?.hireDate || null);

  const { data: leaveUsage } = useQuery({
    queryKey: ['leave-usage', currentUser?.id],
    queryFn: async () => {
      if (!token || !currentUser?.id) return { usedDaysYear: 0 };
      const res = await api.get(`/api/leaves/usage/${currentUser.id}`);
      return res.data;
    },
    enabled: !!token && !!currentUser?.id,
  });

  const usedDays = Number(leaveUsage?.usedDaysYear ?? 0);
  const remainingDays = Math.max(0, entitlementDays - usedDays);

  const { data: sessionsList } = useQuery({
    queryKey: ['sessions-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/sessions');
      return res.data;
    },
  });

  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: getThreads,
  });

  const chatThreads = React.useMemo(() => {
    return threads
      .map((t: any) => {
        const emp = (employeesForTime || []).find((x: any) => x.userId === t.otherId);
        return {
          withId: t.otherId,
          withName: t.otherName || (emp ? `${emp.firstName} ${emp.lastName}` : `User ${t.otherId}`),
          lastText: t.text || '',
          lastAt: t.createdAt,
          avatar: t.otherAvatar || emp?.profileImageUrl,
          unreadCount: t.unreadCount || 0,
        };
      })
      .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
  }, [threads, employeesForTime]);

  const totalActionItems =
    (actions?.pendingLeaves?.length || 0) +
    (actions?.pendingGoals?.length || 0) +
    (actions?.activeSessions?.length || 0) +
    (actions?.unreadCount || 0);

  const dashboardTitle = isAdmin
    ? 'Enterprise HR Dashboard'
    : role === 'Manager'
      ? 'Manager Dashboard'
      : 'My HR Dashboard';

  const greeting = currentUser?.fullName
    ? `Welcome back, ${currentUser.fullName}. Here's what's happening today.`
    : "Welcome back. Here's what's happening today.";

  const renderActionList = (
    items: DashboardAction[] | undefined,
    emptyMessage: string
  ) =>
    items?.length ? (
      items.map((action) => (
        <ListItem
          key={`${action.type}-${action.id}`}
          sx={{
            px: 1.5,
            py: 1.5,
            borderRadius: 3,
            cursor: 'pointer',
            mb: 1,
            border: '1px solid transparent',
            '&:hover': { bgcolor: '#f1f5f9', borderColor: 'divider' },
          }}
          onClick={() => navigate(action.link)}
        >
          <ListItemText
            primary={<Typography variant="body2" fontWeight={700}>{action.title}</Typography>}
            secondary={action.subtitle}
          />
          <ArrowIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
        </ListItem>
      ))
    ) : (
      <Box sx={{ py: 2, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 3 }}>
        <Typography variant="body2" color="text.disabled">{emptyMessage}</Typography>
      </Box>
    );

  return (
    <Container disableGutters maxWidth={false} sx={{ mt: 0, px: 0, width: '100%', minHeight: '100vh', bgcolor: '#f8faff' }}>
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ mb: 0.5 }}>
            {dashboardTitle}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {greeting}
          </Typography>
        </Box>

        <DashboardQuickActions role={role} />
        <HrStats stats={dashboardStats} />

        {showOrgAnalytics && (
          <DashboardCharts
            headcountByDepartment={dashboardStats?.headcountByDepartment}
            evaluationCompletionRate={dashboardStats?.evaluationCompletionRate}
            attendanceRate={dashboardStats?.attendanceRate}
            openCandidates={dashboardStats?.openCandidates}
            showOrgAnalytics={showOrgAnalytics}
          />
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
          <Box sx={{ gridColumn: { xs: 'span 12', lg: 'span 8' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b' }}>
                        Action Center
                      </Typography>
                      {totalActionItems > 0 && (
                        <Chip label={totalActionItems} size="small" color="error" sx={{ fontWeight: 700, height: 22 }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Tasks requiring immediate attention
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ borderRadius: 2 }}
                    onClick={() => navigate('/notifications')}
                  >
                    View All
                  </Button>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LeaveIcon fontSize="small" />
                      {isEmployee ? 'My Requests' : 'Pending Approvals'}
                    </Typography>
                    <List dense disablePadding>
                      {renderActionList(actions?.pendingLeaves, 'All clear!')}
                    </List>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="secondary" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EvalIcon fontSize="small" /> Active Evaluations
                    </Typography>
                    <List dense disablePadding>
                      {renderActionList(actions?.activeSessions, 'No active evaluations')}
                    </List>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#10b981', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }} fontWeight={700}>
                      <GoalIcon fontSize="small" /> Goals & Alerts
                    </Typography>
                    <List dense disablePadding>
                      {actions?.pendingGoals?.length ? (
                        actions.pendingGoals.map((action) => (
                          <ListItem
                            key={`${action.type}-${action.id}`}
                            sx={{ px: 1.5, py: 1.5, borderRadius: 3, cursor: 'pointer', mb: 1, '&:hover': { bgcolor: '#f1f5f9' } }}
                            onClick={() => navigate(action.link)}
                          >
                            <ListItemText
                              primary={<Typography variant="body2" fontWeight={700}>{action.title}</Typography>}
                              secondary={action.subtitle}
                            />
                            <ArrowIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                          </ListItem>
                        ))
                      ) : null}
                      {(actions?.unreadCount ?? 0) > 0 && (
                        <ListItem
                          sx={{ px: 1.5, py: 1.5, borderRadius: 3, cursor: 'pointer', mb: 1, bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}
                          onClick={() => navigate('/notifications')}
                        >
                          <ListItemAvatar sx={{ minWidth: 36 }}>
                            <NotifIcon color="error" fontSize="small" />
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body2" fontWeight={700}>{actions?.unreadCount} unread notifications</Typography>}
                            secondary="Tap to review"
                          />
                          <ArrowIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </ListItem>
                      )}
                      {!actions?.pendingGoals?.length && !(actions?.unreadCount ?? 0) && (
                        <Box sx={{ py: 2, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 3 }}>
                          <Typography variant="body2" color="text.disabled">No pending goals or alerts</Typography>
                        </Box>
                      )}
                    </List>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Card sx={{ borderRadius: 4, border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b' }}>
                        Internal Communications
                      </Typography>
                      {chatThreads.some((t) => t.unreadCount > 0) && (
                        <Chip
                          label={`${chatThreads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)} New`}
                          size="small"
                          color="error"
                          sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                    <Button size="small" onClick={() => navigate('/todo')}>Open Chat</Button>
                  </Box>
                  <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                    {chatThreads.map((t) => (
                      <ListItem
                        key={t.withId}
                        sx={{ px: 0, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' }, cursor: 'pointer' }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('open-chat', {
                            detail: { user: { id: t.withId, fullName: t.withName, profileImageUrl: t.avatar } },
                          }));
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            badgeContent={t.unreadCount}
                            color="error"
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            invisible={!t.unreadCount}
                          >
                            <Avatar src={t.avatar || undefined} sx={{ bgcolor: 'primary.light' }}>
                              {t.withName.charAt(0)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={700} noWrap>{t.withName}</Typography>}
                          secondary={
                            <Typography
                              variant="caption"
                              color={t.unreadCount ? 'primary.main' : 'text.secondary'}
                              fontWeight={t.unreadCount ? 700 : 400}
                              noWrap
                            >
                              {t.lastText}
                            </Typography>
                          }
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                          {new Date(t.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </ListItem>
                    ))}
                    {chatThreads.length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No messages found.
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 4, border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b' }}>Upcoming Events</Typography>
                    <Button size="small" onClick={() => navigate('/schedule')}>Calendar</Button>
                  </Box>
                  <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                    {(sessionsList || []).slice(0, 4).map((s: any) => (
                      <ListItem key={s.sessionID} sx={{ px: 0, py: 1.5 }}>
                        <Box sx={{ mr: 2, p: 1, borderRadius: 2, bgcolor: '#f1f5f9', textAlign: 'center', minWidth: 50 }}>
                          <Typography variant="caption" fontWeight={800} display="block" color="primary">
                            {new Date(s.startDate).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                          </Typography>
                          <Typography variant="h6" fontWeight={800} display="block" sx={{ lineHeight: 1 }}>
                            {new Date(s.startDate).getDate()}
                          </Typography>
                        </Box>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={700}>{s.title}</Typography>}
                          secondary={`${new Date(s.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${s.type || 'Meeting'}`}
                        />
                      </ListItem>
                    ))}
                    {(!sessionsList || !sessionsList.length) && (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No upcoming events.
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Box>

          <Box sx={{ gridColumn: { xs: 'span 12', lg: 'span 4' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={{ borderRadius: 4, bgcolor: 'background.paper', border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={800}>Leave Balance</Typography>
                  <IconButton size="small" onClick={() => navigate('/leave-management')}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ position: 'relative', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <svg viewBox="0 0 36 36" style={{ width: '140px', height: '140px' }}>
                    <path d="M18 2 a16 16 0 1 1 0 32 a16 16 0 1 1 0 -32" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <path
                      d="M18 2 a16 16 0 1 1 0 32"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray={`${Math.round((remainingDays / Math.max(1, entitlementDays)) * 100)}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={900} color="#1e293b">{remainingDays}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>DAYS LEFT</Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">ENTITLEMENT</Typography>
                    <Typography variant="subtitle1" fontWeight={800}>{entitlementDays} Days</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">USED TO DATE</Typography>
                    <Typography variant="subtitle1" fontWeight={800}>{usedDays} Days</Typography>
                  </Box>
                </Box>
                <Button fullWidth variant="contained" sx={{ mt: 3, borderRadius: 3 }} onClick={() => navigate('/leave-management')}>
                  Request Time Off
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 4, bgcolor: '#1e293b', color: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SupportIcon fontSize="small" />
                  <Typography variant="h6" fontWeight={700}>HR Support</Typography>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                  Need assistance with your benefits or have a question about organizational policy?
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ bgcolor: 'white', color: '#1e293b', '&:hover': { bgcolor: '#f1f5f9' }, borderRadius: 2 }}
                  onClick={() => setHelpdeskOpen(true)}
                >
                  Contact HR Helpdesk
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      <Dialog open={helpdeskOpen} onClose={() => setHelpdeskOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>HR Helpdesk</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Our HR team is available Monday–Friday, 9 AM – 5 PM.
          </Typography>
          <Typography variant="body2"><strong>Email:</strong>segni2191@gmail.com</Typography>
          <Typography variant="body2"><strong>Phone:</strong> +1 (555) 010-HRHR</Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            For urgent matters, use the internal chat to reach an HR administrator directly.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHelpdeskOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => { setHelpdeskOpen(false); navigate('/todo'); }}>
            Open Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
