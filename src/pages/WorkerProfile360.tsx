import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import {
    Container,
    Box,
    Typography,
    Avatar,
    Chip,
    Tabs,
    Tab,
    Paper,
    Divider,
    Button,
    Stack,
    LinearProgress,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Skeleton,
    Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DevicesIcon from '@mui/icons-material/Devices';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/* ─────────────────── helpers ─────────────────── */

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const getInitials = (first?: string, last?: string) =>
    `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || 'U';

const ratingStars = (rating: number, max = 5) => {
    const stars: React.ReactNode[] = [];
    for (let i = 1; i <= max; i++) {
        stars.push(
            i <= Math.round(rating)
                ? <StarIcon key={i} sx={{ color: '#f59e0b', fontSize: 20 }} />
                : <StarBorderIcon key={i} sx={{ color: '#d1d5db', fontSize: 20 }} />
        );
    }
    return stars;
};

const priorityColor = (p?: string) => {
    switch (p?.toLowerCase()) {
        case 'high': return 'error';
        case 'normal': return 'info';
        case 'low': return 'default';
        default: return 'default';
    }
};

const statusIcon = (s?: string) => {
    switch (s) {
        case 'Completed': return <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />;
        case 'In Progress': return <HourglassEmptyIcon sx={{ color: '#f59e0b', fontSize: 18 }} />;
        default: return <FlagIcon sx={{ color: '#6b7280', fontSize: 18 }} />;
    }
};

/* ─────────────────── tab panel ─────────────────── */

interface TabPanelProps { children: React.ReactNode; value: number; index: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
        {value === index && children}
    </Box>
);

/* ─────────────────── stats card ─────────────────── */

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: '1 1 200px',
            background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
        }}
    >
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}15`, color, display: 'flex' }}>{icon}</Box>
        <Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography variant="h6" fontWeight={700}>{value}</Typography>
        </Box>
    </Paper>
);

/* ───────────────────────────────────────────────── */
/*               MAIN COMPONENT                      */
/* ───────────────────────────────────────────────── */

const WorkerProfile360: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);

    /* ── queries ── */

    const { data: employee, isLoading: empLoading, error: empError } = useQuery({
        queryKey: ['employee360', id],
        queryFn: async () => (await api.get(`/api/employees/${id}`)).data,
        enabled: !!id,
    });

    const { data: evaluations = [] } = useQuery({
        queryKey: ['employee360-evals', employee?.userId],
        queryFn: async () => {
            const res = await api.get('/api/evaluations');
            return (res.data || []).filter((e: any) => e.evaluateeID === employee?.userId);
        },
        enabled: !!employee?.userId,
    });

    const { data: performance = [] } = useQuery({
        queryKey: ['employee360-perf', employee?.userId],
        queryFn: async () => {
            const res = await api.get(`/api/performance?userId=${employee?.userId}`);
            return res.data || [];
        },
        enabled: !!employee?.userId,
    });

    const { data: goals = [] } = useQuery({
        queryKey: ['employee360-goals', employee?.userId],
        queryFn: async () => {
            const res = await api.get('/api/goals');
            return (res.data || []).filter((g: any) => g.activatedBy === employee?.userId);
        },
        enabled: !!employee?.userId,
    });

    const { data: assets = [] } = useQuery({
        queryKey: ['employee360-assets', id],
        queryFn: async () => {
            const res = await api.get(`/api/assets?employeeId=${id}`);
            return res.data || [];
        },
        enabled: !!id,
    });

    const { data: leaves = [] } = useQuery({
        queryKey: ['employee360-leaves', employee?.userId],
        queryFn: async () => {
            const res = await api.get(`/api/leaves?employeeId=${employee?.userId}`);
            return res.data || [];
        },
        enabled: !!employee?.userId,
    });

    const { data: payslips = [] } = useQuery({
        queryKey: ['employee360-payslips', employee?.userId],
        queryFn: async () => {
            const res = await api.get(`/api/payroll/payslips?employeeId=${employee?.userId}`);
            return res.data || [];
        },
        enabled: !!employee?.userId,
    });

    /* ── derived stats ── */

    const avgRating = performance.length
        ? (performance.reduce((s: number, p: any) => s + (p.overallRating || 0), 0) / performance.length).toFixed(1)
        : '—';

    const completedGoals = goals.filter((g: any) => g.status === 'Completed').length;
    const totalGoals = goals.length;

    const latestPayslip = payslips.length
        ? payslips.sort((a: any, b: any) => b.period?.localeCompare(a.period))[0]
        : null;

    const getName = (val: any) => {
        if (!val) return '—';
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val.name) return val.name;
        return '—';
    };

    /* ── loading / error ── */

    if (empLoading) return (
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
            <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Stack spacing={2}>
                    <Skeleton variant="circular" width={100} height={100} />
                    <Skeleton variant="text" width={300} height={40} />
                    <Skeleton variant="rectangular" height={300} />
                </Stack>
            </Paper>
        </Container>
    );

    if (empError || !employee) return (
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
            <Alert severity="error">Failed to load employee data. Please try again.</Alert>
            <Button onClick={() => navigate('/employees/view')} sx={{ mt: 2 }}>Back to Employees</Button>
        </Container>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
            {/* ── HEADER BANNER ── */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 3,
                }}
            >
                {/* Gradient Banner */}
                <Box
                    sx={{
                        height: 160,
                        background: 'linear-gradient(135deg, #1e3a5f 0%, #0d7377 40%, #14919b 100%)',
                        position: 'relative',
                    }}
                >
                    <IconButton
                        onClick={() => navigate('/employees/view')}
                        sx={{ position: 'absolute', top: 16, left: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Tooltip title="Edit Employee">
                        <IconButton
                            onClick={() => navigate(`/employees/${id}/edit`)}
                            sx={{ position: 'absolute', top: 16, right: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Profile Info Section */}
                <Box sx={{ px: 4, pb: 3, position: 'relative' }}>
                    <Avatar
                        src={employee.profileImageUrl || undefined}
                        sx={{
                            width: 120,
                            height: 120,
                            fontSize: 40,
                            fontWeight: 700,
                            bgcolor: '#1e3a5f',
                            border: '4px solid white',
                            position: 'relative',
                            top: -60,
                            mb: -5,
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                        }}
                    >
                        {getInitials(employee.firstName, employee.lastName)}
                    </Avatar>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', letterSpacing: '-0.5px' }}>
                                {employee.firstName} {employee.lastName}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                                {getName(employee.position)} &bull; {getName(employee.department)}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                                <Chip
                                    size="small"
                                    label={employee.isActive ? 'Active' : 'Inactive'}
                                    color={employee.isActive ? 'success' : 'default'}
                                    sx={{ fontWeight: 600 }}
                                />
                                {employee.userId && <Chip size="small" label={`User ID: ${employee.userId}`} variant="outlined" />}
                            </Stack>
                        </Box>

                        {/* Quick Contact Strip */}
                        <Stack direction="row" spacing={3} sx={{ mt: { xs: 1, md: 0 } }}>
                            {employee.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EmailIcon sx={{ color: '#6b7280', fontSize: 18 }} />
                                    <Typography variant="body2" color="text.secondary">{employee.email}</Typography>
                                </Box>
                            )}
                            {employee.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneIcon sx={{ color: '#6b7280', fontSize: 18 }} />
                                    <Typography variant="body2" color="text.secondary">{employee.phone}</Typography>
                                </Box>
                            )}
                            {employee.hireDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarTodayIcon sx={{ color: '#6b7280', fontSize: 18 }} />
                                    <Typography variant="body2" color="text.secondary">Hired {fmtDate(employee.hireDate)}</Typography>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Box>
            </Paper>

            {/* ── STATS ROW ── */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <StatCard label="Overall Rating" value={avgRating} icon={<StarIcon />} color="#f59e0b" />
                <StatCard label="Goals Completed" value={`${completedGoals}/${totalGoals}`} icon={<FlagIcon />} color="#10b981" />
                <StatCard label="Evaluations" value={evaluations.length} icon={<AssignmentIcon />} color="#6366f1" />
                <StatCard label="Assets Assigned" value={assets.length} icon={<DevicesIcon />} color="#0ea5e9" />
            </Box>

            {/* ── TABBED CONTENT ── */}
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
                    <Tab icon={<PersonIcon />} iconPosition="start" label="Overview" />
                    <Tab icon={<WorkIcon />} iconPosition="start" label="Job" />
                    <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Performance" />
                    <Tab icon={<DevicesIcon />} iconPosition="start" label="Assets" />
                    <Tab icon={<CalendarTodayIcon />} iconPosition="start" label="Time Off" />
                </Tabs>
                <Divider />

                <Box sx={{ p: 3 }}>
                    {/* ── TAB 0: OVERVIEW ── */}
                    <TabPanel value={tab} index={0}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PersonIcon sx={{ color: '#6366f1' }} /> Personal Information
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack spacing={1.5}>
                                        <InfoRow label="Full Name" value={`${employee.firstName} ${employee.lastName}`} />
                                        <InfoRow label="Email" value={employee.email} />
                                        <InfoRow label="Phone" value={employee.phone || '—'} />
                                        <InfoRow label="Gender" value={employee.gender || '—'} />
                                        <InfoRow label="Date of Birth" value={fmtDate(employee.birthDate)} />
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BusinessIcon sx={{ color: '#0ea5e9' }} /> Organization
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack spacing={1.5}>
                                        <InfoRow label="Department" value={getName(employee.department)} />
                                        <InfoRow label="Position" value={getName(employee.position)} />
                                        <InfoRow label="Hire Date" value={fmtDate(employee.hireDate)} />
                                        <InfoRow label="Employee ID" value={`#${employee.id}`} />
                                        <InfoRow label="Status" value={employee.isActive ? 'Active' : 'Inactive'} />
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* Latest Payslip Summary */}
                            <Card variant="outlined" sx={{ borderRadius: 3, gridColumn: { md: 'span 2' } }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        💰 Latest Compensation
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    {latestPayslip ? (
                                        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            <InfoRow label="Period" value={latestPayslip.period} />
                                            <InfoRow label="Basic Salary" value={`$${Number(latestPayslip.basicSalary || 0).toLocaleString()}`} />
                                            <InfoRow label="Allowances" value={`$${Number(latestPayslip.allowances || 0).toLocaleString()}`} />
                                            <InfoRow label="Net Salary" value={`$${Number(latestPayslip.netSalary || 0).toLocaleString()}`} />
                                            <InfoRow label="Status" value={latestPayslip.status} />
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">No payslip records found.</Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    </TabPanel>

                    {/* ── TAB 1: JOB ── */}
                    <TabPanel value={tab} index={1}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>📋 Job Details</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Stack spacing={1.5}>
                                        <InfoRow label="Department" value={getName(employee.department)} />
                                        <InfoRow label="Position" value={getName(employee.position)} />
                                        <InfoRow label="Hire Date" value={fmtDate(employee.hireDate)} />
                                        <InfoRow label="Employment Status" value={employee.isActive ? 'Full-Time / Active' : 'Separated'} />
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>📊 Evaluation History</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    {evaluations.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">No evaluations recorded yet.</Typography>
                                    ) : (
                                        <Stack spacing={1.5}>
                                            {evaluations.slice(0, 5).map((ev: any) => (
                                                <Box
                                                    key={ev.evaluationID}
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor: '#f8fafc',
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: '#f1f5f9' },
                                                    }}
                                                    onClick={() => navigate(`/evaluations/${ev.evaluationID}`)}
                                                >
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={600}>{ev.evaluationType}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            By {ev.evaluator?.fullName || 'Unknown'} &bull; {fmtDate(ev.evaluationDate)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip size="small" label="View" variant="outlined" color="primary" />
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    </TabPanel>

                    {/* ── TAB 2: PERFORMANCE ── */}
                    <TabPanel value={tab} index={2}>
                        {/* Performance Records */}
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>📈 Performance Records</Typography>
                        {performance.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>No performance records yet.</Typography>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 4 }}>
                                {performance.slice(0, 4).map((p: any) => (
                                    <Card key={p.id} variant="outlined" sx={{ borderRadius: 3 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle2" fontWeight={700}>{p.evaluationPeriod}</Typography>
                                                <Box sx={{ display: 'flex' }}>{ratingStars(p.overallRating || 0)}</Box>
                                            </Box>
                                            <Stack direction="row" spacing={3}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Tasks Done</Typography>
                                                    <Typography variant="h6" fontWeight={700}>{p.tasksCompleted}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Hours</Typography>
                                                    <Typography variant="h6" fontWeight={700}>{p.hoursWorked}h</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Rating</Typography>
                                                    <Typography variant="h6" fontWeight={700}>{Number(p.overallRating).toFixed(1)}/5</Typography>
                                                </Box>
                                            </Stack>
                                            {p.feedback && (
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                                                    "{p.feedback}"
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}

                        {/* Goals Section */}
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>🎯 Goals</Typography>
                        {goals.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No goals assigned.</Typography>
                        ) : (
                            <Stack spacing={1.5}>
                                {goals.map((g: any) => (
                                    <Paper
                                        key={g.gid}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            '&:hover': { bgcolor: '#f8fafc' },
                                        }}
                                    >
                                        {statusIcon(g.status)}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={600}>{g.objective}</Typography>
                                            {g.duedate && (
                                                <Typography variant="caption" color="text.secondary">Due: {fmtDate(g.duedate)}</Typography>
                                            )}
                                        </Box>
                                        <Chip size="small" label={g.priority || 'Normal'} color={priorityColor(g.priority) as any} />
                                        <Chip
                                            size="small"
                                            label={g.status || 'Not Started'}
                                            variant="outlined"
                                        />
                                        {typeof g.progress === 'number' && (
                                            <Box sx={{ width: 100 }}>
                                                <LinearProgress variant="determinate" value={g.progress} sx={{
                                                    height: 6,
                                                    borderRadius: 3,
                                                    bgcolor: '#e5e7eb',
                                                    '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: g.progress === 100 ? '#10b981' : '#6366f1' },
                                                }} />
                                            </Box>
                                        )}
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </TabPanel>

                    {/* ── TAB 3: ASSETS ── */}
                    <TabPanel value={tab} index={3}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>🖥️ Assigned Assets</Typography>
                        {assets.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No assets assigned to this employee.</Typography>
                        ) : (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                                {assets.map((a: any) => (
                                    <Card key={a.id} variant="outlined" sx={{ borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <DevicesIcon sx={{ color: '#0ea5e9' }} />
                                                <Chip
                                                    size="small"
                                                    label={a.status || 'Assigned'}
                                                    color={
                                                        a.status === 'Assigned' ? 'success'
                                                            : a.status === 'Pending Return' ? 'warning'
                                                                : 'default'
                                                    }
                                                />
                                            </Box>
                                            <Typography variant="subtitle2" fontWeight={700}>{a.assetName || a.name || `Asset #${a.id}`}</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">{a.assetType || a.type || '—'}</Typography>
                                            {a.serialNumber && (
                                                <Typography variant="caption" color="text.secondary">S/N: {a.serialNumber}</Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </TabPanel>

                    {/* ── TAB 4: TIME OFF ── */}
                    <TabPanel value={tab} index={4}>
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>🏖️ Leave History</Typography>
                        {leaves.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No leave records found.</Typography>
                        ) : (
                            <Stack spacing={1.5}>
                                {leaves.slice(0, 10).map((l: any) => (
                                    <Paper
                                        key={l.id}
                                        variant="outlined"
                                        sx={{ p: 2, borderRadius: 2.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}
                                    >
                                        <Box sx={{ flex: 1, minWidth: 200 }}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {l.leaveType?.name || 'Leave'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {fmtDate(l.startDate)} — {fmtDate(l.endDate)} &bull; {l.days} day{l.days !== 1 ? 's' : ''}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={l.status}
                                            color={
                                                l.status === 'Approved' ? 'success'
                                                    : l.status === 'Pending' ? 'warning'
                                                        : 'error'
                                            }
                                        />
                                        {l.reason && (
                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                "{l.reason}"
                                            </Typography>
                                        )}
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </TabPanel>
                </Box>
            </Paper>
        </Container>
    );
};

/* ── reusable info row ── */

const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120, fontWeight: 500 }}>{label}:</Typography>
        <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Box>
);

export default WorkerProfile360;
