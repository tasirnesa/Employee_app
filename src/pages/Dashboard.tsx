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
import api from '../lib/axios';

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
      if (!token) throw new Error('No authentication token');
      try {
        const response = await axios.get('http://localhost:3000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched users:', response.data);
        return response.data as User[];
      } catch (err: any) {
        // If forbidden (e.g., Employee role), return empty list so dashboard still loads
        if (err?.response?.status === 403) {
          console.warn('Users fetch forbidden; returning empty list for dashboard');
          return [] as User[];
        }
        throw err;
      }
    },
    enabled: !!token && !isEmployee,
  });

  const { data: evaluations, isLoading: evaluationsLoading, error: evaluationsError } = useQuery({
    queryKey: ['evaluations'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/evaluations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched evaluations:', response.data);
      return response.data as Evaluation[];
    },
  });

  const { data: criteria, isLoading: criteriaLoading, error: criteriaError } = useQuery({
    queryKey: ['criteria'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      const response = await axios.get('http://localhost:3000/api/criteria', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched criteria:', response.data);
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
    ? `timeoff_entitlement_${currentUser.id}_${new Date(meEmployee.hireDate).toISOString().slice(0,10)}`
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
      if (!token) return [] as Array<{ sessionID: number; title: string; startDate: string; endDate: string }>;
      const res = await axios.get('http://localhost:3000/api/evaluation-sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Recent Chats from localStorage (local chat prototype)
  type ChatMsg = { sender: 'me' | 'them'; text: string; at: string };
  type ChatThread = { withId: number; withName: string; lastText: string; lastAt: string };
  const { data: allEmployees } = useQuery({
    queryKey: ['employees-for-chat'],
    queryFn: async () => await listEmployees(true),
    staleTime: 5 * 60 * 1000,
  });
  const employeeName = (id: number) => {
    const e = (allEmployees || []).find((x: any) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : `Employee ${id}`;
  };
  const myUserId = currentUser?.id;
  const chatThreads: ChatThread[] = React.useMemo(() => {
    if (!myUserId) return [];
    const items: ChatThread[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) as string;
      if (!key || !key.startsWith(`chat:${myUserId}:`)) continue;
      const toIdStr = key.split(':')[2];
      const toId = Number(toIdStr);
      if (!Number.isFinite(toId)) continue;
      try {
        const msgs: ChatMsg[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (msgs.length === 0) continue;
        const last = msgs[msgs.length - 1];
        items.push({ withId: toId, withName: employeeName(toId), lastText: last.text, lastAt: last.at });
      } catch {}
    }
    // Sort by latest first
    return items.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()).slice(0, 6);
  }, [myUserId, allEmployees, localStorage.length]);

  return (
    <Container disableGutters maxWidth={false} sx={{ mt: 0, px: 0 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 0.75 }}>
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
                    <path d="M18 2 a16 16 0 1 1 0 32" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray={`${Math.round((remainingDays/Math.max(1, entitlementDays))*100)}, 100`} strokeLinecap="round" />
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
                <Typography variant="h6">Recent Chats</Typography>
                <Button size="small" variant="text" onClick={() => navigate('/contacts')}>Open</Button>
              </Box>
              <List dense sx={{ mt: 1, maxHeight: 260, overflow: 'auto', pr: 1 }}>
                {chatThreads.map((t) => (
                  <ListItem key={t.withId} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar>{t.withName.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600} noWrap>{currentUser?.fullName} → {t.withName}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary" noWrap>{t.lastText}</Typography>}
                    />
                    <Chip size="small" variant="outlined" label={new Date(t.lastAt).toLocaleTimeString()} />
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

        {/* Status Tracker */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(16,24,40,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Status Tracker</Typography>
                <Button size="small" variant="text" onClick={() => navigate('/analytics-performance')}>See more</Button>
              </Box>
              <List dense sx={{ mt: 1, maxHeight: 260, overflow: 'auto', pr: 1 }}>
                {(myGoals || []).slice(0, 3).map((g) => (
                  <ListItem key={g.gid} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar>{g.objective.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={g.objective} secondary={`Due ${g.duedate ? new Date(g.duedate as any).toLocaleDateString() : '—'}`} />
                    <Chip size="small" label={`${Math.round(Number(g.progress || 0))}%`} />
                  </ListItem>
                ))}
                {(!myGoals || !myGoals.length) && (
                  <Typography variant="body2" color="text.secondary">No items yet.</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Announcements */}
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card sx={{ borderRadius: 3, bgcolor: 'background.paper', boxShadow: '0 1px 2px rgba(16,24,40,0.08)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Announcements</Typography>
                <Button size="small" variant="text" onClick={() => navigate('/reports')}>See more</Button>
              </Box>
              <List dense sx={{ mt: 1, maxHeight: 260, overflow: 'auto', pr: 1 }}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Meeting with John" secondary={<Typography variant="caption" color="text.secondary">9:00 - 10:30</Typography>} />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Check neutral colors" secondary={<Typography variant="caption" color="text.secondary">Design System</Typography>} />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemText primary="Text inputs for design system" secondary={<Typography variant="caption" color="text.secondary">UX</Typography>} />
                </ListItem>
              </List>
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