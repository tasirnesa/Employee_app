import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { User, Evaluation, EvaluationCriteria, EvaluationResult, Employee, Goal } from '../types/interfaces';
import { listEmployees } from '../api/employeeApi';
import { getThreads } from '../api/messageApi';
import api from '../lib/axios';
import {
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Assignment as EvalIcon,
  FlightTakeoff as LeaveIcon,
  Flag as GoalIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import HrStats from '../components/HrStats';

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
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('userProfile') || '{}');
    } catch {
      return {} as any;
    }
  })();
  const isEmployee = currentUser?.role === 'Employee';

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/users');
        return response.data as User[];
      } catch (err: any) {
        if (err?.response?.status === 403) return [] as User[];
        throw err;
      }
    },
    enabled: !!token && !isEmployee,
  });

  const { data: evaluations } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const response = await api.get('/api/evaluations');
      return response.data as Evaluation[];
    },
  });

  const { data: results } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const response = await api.get('/api/evaluations'); // Evaluation results are usually in evaluations or results
      return response.data as EvaluationResult[];
    },
  });

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

  const { data: myGoals } = useQuery({
    queryKey: ['goals-dashboard', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [] as Goal[];
      const res = await api.get('/api/goals', {
        params: { userId: currentUser.id },
      });
      return res.data as Goal[];
    },
    enabled: !!token && !!currentUser?.id,
  });

  const { data: sessionsList } = useQuery({
    queryKey: ['sessions-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/evaluation-sessions');
      return res.data;
    },
  });

  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: getThreads,
    refetchInterval: 10000,
  });

  const chatThreads = React.useMemo(() => {
    return threads.map((t: any) => {
      const emp = (employeesForTime || []).find((x: any) => x.userId === t.otherId);
      return {
        withId: t.otherId,
        withName: t.otherName || (emp ? `${emp.firstName} ${emp.lastName}` : `User ${t.otherId}`),
        lastText: t.text || '',
        lastAt: t.createdAt,
        avatar: t.otherAvatar || emp?.profileImageUrl,
        isMe: t.senderId === currentUser?.id
      };
    });
  }, [threads, employeesForTime, currentUser?.id]);

  // Aggregate stats for the Top Stat Bar
  const activeSessionsCount = actions?.activeSessions?.length || 0;
  const statsSummary = {
    totalEmployees: users?.length || 0,
    activeEvaluations: (evaluations as any)?.filter((e: any) => e.status === 'In-Progress')?.length || activeSessionsCount || 0,
    pendingLeaves: actions?.pendingLeaves?.length || 0,
    monthlyPayroll: '$42,500.00', // Mocking for now
  };

  return (
    <Container disableGutters maxWidth={false} sx={{ mt: 0, px: 0, width: '100%', minHeight: '100vh', bgcolor: '#f8faff' }}>
      <Box sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} color="#1e293b" sx={{ mb: 0.5 }}>
            Enterprise HR Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {currentUser?.fullName}. Here's what's happening today.
          </Typography>
        </Box>

        <HrStats stats={statsSummary} />

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
          
          {/* Main Action Hub - 8 columns */}
          <Box sx={{ gridColumn: { xs: 'span 12', lg: 'span 8' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Action Center - Refined */}
            <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b' }}>Action Center</Typography>
                    <Typography variant="body2" color="text.secondary">Tasks requiring immediate attention</Typography>
                  </Box>
                  <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>View All</Button>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                  <Box>
                    <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LeaveIcon fontSize="small" /> Pending Approvals
                    </Typography>
                    <List dense disablePadding>
                      {actions?.pendingLeaves.length ? actions.pendingLeaves.map(action => (
                        <ListItem
                          key={`${action.type}-${action.id}`}
                          sx={{ px: 1.5, py: 1.5, borderRadius: 3, cursor: 'pointer', mb: 1, border: '1px solid transparent', '&:hover': { bgcolor: '#f1f5f9', borderColor: 'divider' } }}
                          onClick={() => navigate(action.link)}
                        >
                          <ListItemText
                            primary={<Typography variant="body2" fontWeight={700}>{action.title}</Typography>}
                            secondary={action.subtitle}
                          />
                          <ArrowIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </ListItem>
                      )) : (
                        <Box sx={{ py: 2, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 3 }}>
                          <Typography variant="body2" color="text.disabled">All clear!</Typography>
                        </Box>
                      )}
                    </List>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="secondary" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EvalIcon fontSize="small" /> Active Evaluations
                    </Typography>
                    <List dense disablePadding>
                      {actions?.activeSessions.length ? actions.activeSessions.map(action => (
                        <ListItem
                          key={`${action.type}-${action.id}`}
                          sx={{ px: 1.5, py: 1.5, borderRadius: 3, cursor: 'pointer', mb: 1, border: '1px solid transparent', '&:hover': { bgcolor: '#f1f5f9', borderColor: 'divider' } }}
                          onClick={() => navigate(action.link)}
                        >
                          <ListItemText
                            primary={<Typography variant="body2" fontWeight={700}>{action.title}</Typography>}
                            secondary={action.subtitle}
                          />
                          <ArrowIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </ListItem>
                      )) : (
                        <Box sx={{ py: 2, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 3 }}>
                          <Typography variant="body2" color="text.disabled">No active evaluations</Typography>
                        </Box>
                      )}
                    </List>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Bottom Row - Chats & Schedule */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Recent Chats */}
              <Card sx={{ borderRadius: 4, border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#1e293b' }}>Internal Communications</Typography>
                    <Button size="small" onClick={() => navigate('/todo')}>Open Chat</Button>
                  </Box>
                  <List sx={{ maxHeight: 320, overflow: 'auto' }}>
                    {chatThreads.map((t) => (
                      <ListItem
                        key={t.withId}
                        sx={{ px: 0, py: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' }, cursor: 'pointer' }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('open-chat', {
                            detail: { user: { id: t.withId, fullName: t.withName, profileImageUrl: t.avatar } }
                          }));
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={t.avatar || undefined} sx={{ bgcolor: 'primary.light' }}>{t.withName.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={700} noWrap>{t.withName}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary" noWrap>{t.lastText}</Typography>}
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>{new Date(t.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                      </ListItem>
                    ))}
                    {chatThreads.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No messages found.</Typography>}
                  </List>
                </CardContent>
              </Card>

              {/* Schedule */}
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
                          <Typography variant="caption" fontWeight={800} display="block" color="primary">{new Date(s.startDate).toLocaleString('en-US', { month: 'short' }).toUpperCase()}</Typography>
                          <Typography variant="h6" fontWeight={800} display="block" sx={{ lineHeight: 1 }}>{new Date(s.startDate).getDate()}</Typography>
                        </Box>
                        <ListItemText 
                          primary={<Typography variant="body2" fontWeight={700}>{s.title}</Typography>} 
                          secondary={`${new Date(s.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${s.type || 'Meeting'}`} 
                        />
                      </ListItem>
                    ))}
                    {(!sessionsList || !sessionsList.length) && <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No upcoming events.</Typography>}
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Side Info Bar - 4 columns */}
          <Box sx={{ gridColumn: { xs: 'span 12', lg: 'span 4' }, display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Time Off donut card */}
            <Card sx={{ borderRadius: 4, bgcolor: 'background.paper', border: '1px solid #eef2ff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" fontWeight={800}>Leave Balance</Typography>
                  <IconButton size="small" onClick={() => navigate('/leave-management')}><InfoIcon fontSize="small"/></IconButton>
                </Box>
                <Box sx={{ position: 'relative', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                  <svg viewBox="0 0 36 36" style={{ width: '140px', height: '140px' }}>
                    <path d="M18 2 a16 16 0 1 1 0 32 a16 16 0 1 1 0 -32" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <path d="M18 2 a16 16 0 1 1 0 32" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray={`${Math.round((remainingDays / Math.max(1, entitlementDays)) * 100)}, 100`} strokeLinecap="round" />
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
                <Button fullWidth variant="contained" sx={{ mt: 3, borderRadius: 3 }} onClick={() => navigate('/leave-management')}>Request Time Off</Button>
              </CardContent>
            </Card>

            {/* Support / Help card */}
            <Card sx={{ borderRadius: 4, bgcolor: '#1e293b', color: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>HR Support</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                  Need assistance with your benefits or have a question about organizational policy?
                </Typography>
                <Button variant="contained" fullWidth sx={{ bgcolor: 'white', color: '#1e293b', '&:hover': { bgcolor: '#f1f5f9' }, borderRadius: 2 }}>
                  Contact HR Helpdesk
                </Button>
              </CardContent>
            </Card>

          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
