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

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
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

  const { data: evaluations, isLoading: evaluationsLoading, error: evaluationsError } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      const response = await api.get('/api/evaluations');
      return response.data as Evaluation[];
    },
  });

  const { data: criteria, isLoading: criteriaLoading, error: criteriaError } = useQuery({
    queryKey: ['criteria'],
    queryFn: async () => {
      const response = await api.get('/api/criteria');
      return response.data as EvaluationCriteria[];
    },
  });

  const { data: results, isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/results', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched results:', response.data);
      return response.data as EvaluationResult[];
    },
  });

  // Fetch employees to identify current user's employee profile for Time Off
  const { data: employeesForTime } = useQuery({
    queryKey: ['employees-for-timeoff'],
    queryFn: async () => await listEmployees(true),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: actions, isLoading: actionsLoading } = useQuery({
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
    // 1) Match by linked userId
    const byUserId = list.find((e) => e.userId === currentUser?.id);
    if (byUserId) return byUserId;
    // 2) Match by full name
    const userName = normalize(currentUser?.fullName as any);
    const byName = list.find((e) => `${normalize(e.firstName)} ${normalize(e.lastName)}` === userName);
    if (byName) return byName;
    // 3) Match by email prefix equals userName (if usernames are emails)
    const userUserName = normalize((currentUser as any)?.userName);
    const byEmail = list.find((e) => normalize(e.email).startsWith(userUserName) || normalize(e.email) === userUserName);
    return byEmail;
  })();
  const meEmployee: Employee | undefined = liveMe || cachedMe || undefined;
  if (liveMe && employeeCacheKey) {
    localStorage.setItem(employeeCacheKey, JSON.stringify(liveMe));
  }

  // Time Off entitlement calculation
  const computeEntitlement = (hireDate?: string | null) => {
    if (!hireDate) return 0;
    const start = new Date(hireDate);
    if (Number.isNaN(start.getTime())) return 0;
    const now = new Date();
    const anniversaryThisYear = new Date(now.getFullYear(), start.getMonth(), start.getDate());
    const years = now.getFullYear() - start.getFullYear() - (now < anniversaryThisYear ? 1 : 0);
    if (years <= 0) return 16; // first year
    if (years === 1) return 18; // second year
    if (years === 2) return 20; // third year
    return 20 + (years - 2) * 2; // add 2 days per year after third
  };
  const entitlementCacheKey = currentUser?.id && meEmployee?.hireDate
    ? `timeoff_entitlement_${currentUser.id}_${new Date(meEmployee.hireDate).toISOString().slice(0, 10)}`
    : undefined;
  const cachedEntitlement = entitlementCacheKey ? Number(localStorage.getItem(entitlementCacheKey) || 'NaN') : NaN;
  const entitlementDaysCalc = computeEntitlement(meEmployee?.hireDate || null);
  // Prefer fresh calculation when hireDate exists; fallback to cache only if calc is 0 because no hireDate available yet
  const entitlementDays = entitlementDaysCalc > 0
    ? entitlementDaysCalc
    : (Number.isFinite(cachedEntitlement) ? cachedEntitlement : 0);
  if (entitlementCacheKey && entitlementDaysCalc > 0) {
    localStorage.setItem(entitlementCacheKey, String(entitlementDaysCalc));
  }
  // Leave usage (approved days this year) and recent approved leave for current user
  const { data: leaveUsage } = useQuery({
    queryKey: ['leave-usage', currentUser?.id],
    queryFn: async () => {
      if (!token || !currentUser?.id) return { usedDaysYear: 0 } as { usedDaysYear: number };
      const res = await api.get(`/api/leaves/usage/${currentUser.id}`);
      return res.data as { usedDaysYear: number };
    },
    enabled: !!token && !!currentUser?.id,
  });
  const { data: myLeavesAll } = useQuery({
    queryKey: ['my-leaves', currentUser?.id],
    queryFn: async () => {
      if (!token || !currentUser?.id) return [] as any[];
      const res = await api.get('/api/leaves');
      return res.data as any[];
    },
    enabled: !!token && !!currentUser?.id,
  });
  const lastApprovedLeave = (myLeavesAll || [])
    .filter((l: any) => l.status === 'Approved')
    .sort((a: any, b: any) => new Date(b.approvedAt || b.endDate).getTime() - new Date(a.approvedAt || a.endDate).getTime())[0];

  const usedDays = Number(leaveUsage?.usedDaysYear ?? 0);
  const remainingDays = Math.max(0, entitlementDays - usedDays);

  const { data: sessionStats } = useQuery({
    queryKey: ['sessionStats'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/evaluation-sessions/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched session stats:', response.data);
      return response.data as { thisWeek: number; today: number; pending: number; meetings: number };
    },
  });

  const totalUsers = users?.length || 0;
  const usersByRole = users?.reduce((acc: Record<string, number>, user: User) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  const activeUsers = users?.filter((user: User) => user.activeStatus).length || 0;
  const inactiveUsers = totalUsers - activeUsers;

  // role chart removed in redesigned dashboard

  const averageScores = criteria?.map((criterion: EvaluationCriteria) => {
    const relevantResults = results?.filter((result: EvaluationResult) => result.criteriaID === criterion.criteriaID) || [];
    const avgScore =
      relevantResults.length > 0
        ? relevantResults.reduce((sum: number, result: EvaluationResult) => sum + result.score, 0) / relevantResults.length
        : 0;
    return { title: criterion.title, avgScore };
  }) || [];

  const scoreChartData = {
    labels: averageScores.map((item: { title: string; avgScore: number }) => item.title),
    datasets: [
      {
        label: 'Average Score',
        data: averageScores.map((item: { title: string; avgScore: number }) => item.avgScore),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  const totalEvaluations = evaluations?.length || 0;
  const overallAverageScore = results && results.length > 0
    ? results.reduce((sum: number, r: EvaluationResult) => sum + r.score, 0) / results.length
    : 0;

  // evaluations by type removed in redesigned dashboard

  // Monthly evaluations trend (last 6 months)
  const trendLabels: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendLabels.push(d.toLocaleString(undefined, { month: 'short', year: '2-digit' }));
  }
  const monthlyCounts = new Array(trendLabels.length).fill(0);
  (evaluations || []).forEach((e: Evaluation) => {
    const d = new Date(e.evaluationDate);
    const label = d.toLocaleString(undefined, { month: 'short', year: '2-digit' });
    const idx = trendLabels.indexOf(label);
    if (idx !== -1) monthlyCounts[idx] += 1;
  });
  // trend chart removed in redesigned dashboard

  // Score distribution (bins 1..5)
  const scoreBins = [1, 2, 3, 4, 5];
  const scoreCounts = scoreBins.map((b) => (results || []).filter((r) => Math.round(r.score) === b).length);
  // score distribution removed in redesigned dashboard

  // chart options removed

  // Do not early-return; render widgets with whatever data is available

  // 'recent evaluations' table removed in redesigned dashboard

  // Goals and sessions data
  const { data: myGoals } = useQuery({
    queryKey: ['goals-dashboard', currentUser?.id],
    queryFn: async () => {
      if (!token || !currentUser?.id) return [] as Goal[];
      const res = await axios.get('http://localhost:3000/api/goals', {
        params: { userId: currentUser.id },
        headers: { Authorization: `Bearer ${token}` },
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

  // Recent Chats from backend
  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: getThreads,
    refetchInterval: 10000, // Poll every 10s for dashboard
  });

  type ChatThread = { withId: number; withName: string; lastText: string; lastAt: string; avatar?: string | null; isMe: boolean };
  const { data: allEmployees } = useQuery({
    queryKey: ['employees-for-chat'],
    queryFn: async () => await listEmployees(true),
    staleTime: 5 * 60 * 1000,
  });
  const employeeByUserId = (uid: number) => {
    return (allEmployees || []).find((x: any) => x.userId === uid);
  };
  const chatThreads: ChatThread[] = React.useMemo(() => {
    return threads.map((t: any) => {
      const emp = employeeByUserId(t.otherId);
      return {
        withId: t.otherId,
        withName: t.otherName || (emp ? `${emp.firstName} ${emp.lastName}` : `User ${t.otherId}`),
        lastText: t.text || '',
        lastAt: t.createdAt,
        avatar: t.otherAvatar || emp?.profileImageUrl,
        isMe: t.senderId === currentUser?.id
      };
    });
  }, [threads, allEmployees, currentUser?.id]);

  return (
    <Container disableGutters maxWidth={false} sx={{ mt: 0, px: 0, width: '100%' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2, width: '100%', p: 3 }}>
        {/* Time Off */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(16,24,40,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Time Off</Typography>
                <Button size="small" variant="text" onClick={() => navigate('/leave-management')}>See more</Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Box sx={{ width: 120, height: 120, position: 'relative' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                    <path d="M18 2 a16 16 0 1 1 0 32 a16 16 0 1 1 0 -32" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                    <path d="M18 2 a16 16 0 1 1 0 32" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray={`${Math.round((remainingDays / Math.max(1, entitlementDays)) * 100)}, 100`} strokeLinecap="round" />
                  </svg>
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="h5" fontWeight={700}>{remainingDays}</Typography>
                    <Typography variant="caption">out of {entitlementDays}</Typography>
                  </Box>
                </Box>
                <Box>
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={`Hire date: ${meEmployee?.hireDate ? new Date(meEmployee.hireDate).toLocaleDateString() : '—'}`} />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={`Used: ${usedDays} days`} />
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Recent Chats */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(16,24,40,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>Recent Chats</Typography>
                  <Button size="small" variant="text" sx={{ fontWeight: 600 }}>All Contacts</Button>
                </Box>
              </Box>
              <List dense sx={{ mt: 1, maxHeight: 400, overflow: 'auto', pr: 1 }}>
                {chatThreads.map((t) => (
                  <ListItem
                    key={t.withId}
                    sx={{ px: 0, py: 1, '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, cursor: 'pointer' }}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-chat', {
                        detail: { user: { id: t.withId, fullName: t.withName, profileImageUrl: t.avatar } }
                      }));
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={t.avatar || undefined}>{t.withName.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600} noWrap>{t.isMe ? `To: ${t.withName}` : `From: ${t.withName}`}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary" noWrap>{t.lastText}</Typography>}
                    />
                    <Chip size="small" variant="outlined" label={new Date(t.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                  </ListItem>
                ))}
                {chatThreads.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No chats yet.</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Current Project */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(16,24,40,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Current Project</Typography>
                <Button size="small" variant="text" onClick={() => navigate('/projects')}>See more</Button>
              </Box>
              {(!myGoals || !myGoals.length) ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No goals yet.</Typography>
              ) : (
                <List dense sx={{ mt: 1, maxHeight: 260, overflow: 'auto', pr: 1 }}>
                  {myGoals.slice(0, 3).map((g) => {
                    const progress = Math.max(0, Math.min(100, Number(g.progress || 0)));
                    const due = g.duedate ? new Date(g.duedate as any) : null;
                    const overdue = due && due.getTime() < Date.now() && progress < 100;
                    const color = overdue ? 'error' : progress >= 80 ? 'success' : progress >= 40 ? 'warning' : 'secondary';
                    return (
                      <ListItem key={g.gid} sx={{ px: 0 }}>
                        <ListItemText
                          primary={<Typography variant="subtitle2" noWrap>{g.objective}</Typography>}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ flexGrow: 1, height: 8, bgcolor: '#eef2ff', borderRadius: 9999, overflow: 'hidden' }}>
                                <Box sx={{ width: `${progress}%`, height: '100%', bgcolor: (theme) => theme.palette[color].main }} />
                              </Box>
                              <Chip size="small" label={`${progress}%`} color={color as any} variant="outlined" />
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Schedule */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(16,24,40,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Schedule</Typography>
                <Button size="small" variant="text" onClick={() => navigate('/schedule')}>See more</Button>
              </Box>
              <List dense sx={{ mt: 1, maxHeight: 260, overflow: 'auto', pr: 1 }}>
                {(sessionsList || []).slice(0, 5).map((s: any) => (
                  <ListItem key={s.sessionID} sx={{ px: 0 }}>
                    <ListItemText primary={<Typography variant="body2" fontWeight={600} noWrap>{s.title}</Typography>} secondary={<Typography variant="caption" color="text.secondary">{new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}</Typography>} />
                  </ListItem>
                ))}
                {(!sessionsList || !sessionsList.length) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No upcoming sessions.</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Action Center - Replacing Status Tracker and Announcements */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', border: '1px solid #eef2ff' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1e293b' }}>Action Center</Typography>
                  <Typography variant="body2" color="text.secondary">Tasks that require your immediate attention</Typography>
                </Box>
                {actions?.unreadCount ? (
                  <Chip
                    label={`${actions.unreadCount} New Alerts`}
                    color="primary"
                    size="small"
                    onClick={() => navigate('/notifications')}
                    sx={{ fontWeight: 600, animation: 'pulse 2s infinite' }}
                  />
                ) : null}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="primary" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LeaveIcon fontSize="small" /> Pending Approvals
                  </Typography>
                  <List dense disablePadding>
                    {actions?.pendingLeaves.length ? actions.pendingLeaves.map(action => (
                      <ListItem
                        key={`${action.type}-${action.id}`}
                        sx={{ px: 1, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' }, cursor: 'pointer', mb: 0.5 }}
                        onClick={() => navigate(action.link)}
                      >
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{action.title}</Typography>}
                          secondary={action.subtitle}
                        />
                        <ArrowIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </ListItem>
                    )) : (
                      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>No pending approvals</Typography>
                    )}
                  </List>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="secondary" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EvalIcon fontSize="small" /> Active Evaluations
                  </Typography>
                  <List dense disablePadding>
                    {actions?.activeSessions.length ? actions.activeSessions.map(action => (
                      <ListItem
                        key={`${action.type}-${action.id}`}
                        sx={{ px: 1, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' }, cursor: 'pointer', mb: 0.5 }}
                        onClick={() => navigate(action.link)}
                      >
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{action.title}</Typography>}
                          secondary={action.subtitle}
                        />
                        <ArrowIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      </ListItem>
                    )) : (
                      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 1 }}>No active evaluations</Typography>
                    )}
                  </List>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" color="warning.main" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GoalIcon fontSize="small" /> Upcoming Deadlines
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                  {actions?.pendingGoals.length ? actions.pendingGoals.map(action => (
                    <Card
                      key={`${action.type}-${action.id}`}
                      variant="outlined"
                      sx={{ minWidth: 200, flexShrink: 0, borderRadius: 2, p: 1.5, cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: '#f0f9ff' } }}
                      onClick={() => navigate(action.link)}
                    >
                      <Typography variant="body2" fontWeight={600} noWrap>{action.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{action.subtitle}</Typography>
                    </Card>
                  )) : (
                    <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>No upcoming deadlines</Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Meetings */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(16,24,40,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Meetings</Typography>
                <Button size="small" variant="text" onClick={() => navigate('/schedule')}>See more</Button>
              </Box>
              <List dense sx={{ mt: 1, maxHeight: 260, overflow: 'auto', pr: 1 }}>
                {(sessionsList || []).slice(0, 3).map((s: any) => (
                  <ListItem key={s.sessionID} sx={{ px: 0 }}>
                    <ListItemText primary={s.title} secondary={<Typography variant="caption" color="text.secondary">{new Date(s.startDate).toLocaleTimeString()} - {new Date(s.endDate).toLocaleTimeString()}</Typography>} />
                    <Chip size="small" label="+4 members" variant="outlined" />
                  </ListItem>
                ))}
                {(!sessionsList || !sessionsList.length) && (
                  <Typography variant="body2" color="text.secondary">No meetings today.</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;