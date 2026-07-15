import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    Person as PersonIcon,
    Paid as PaidIcon,
    FlightTakeoff as LeaveIcon,
    Assessment as PerformanceIcon,
    CardGiftcard as BenefitsIcon,
    Groups as TeamIcon,
    Inbox as InboxIcon,
    AdminPanelSettings as AdminIcon,
    AssignmentTurnedIn as GoalsIcon,
} from '@mui/icons-material';

interface DashboardWorkletsProps {
    role?: string;
}

const DashboardWorklets: React.FC<DashboardWorkletsProps> = ({ role = 'Employee' }) => {
    const navigate = useNavigate();
    const isAdmin = role === 'Admin' || role === 'SuperAdmin';
    const isManager = role === 'Manager';

    const worklets = [
        {
            id: 'personal-info',
            title: 'Personal Info',
            icon: <PersonIcon sx={{ fontSize: 40, color: '#3b82f6' }} />,
            path: '/employees/view', // Employees view themselves or others
            show: true,
            color: '#eff6ff',
        },
        {
            id: 'time-off',
            title: 'Time Off',
            icon: <LeaveIcon sx={{ fontSize: 40, color: '#10b981' }} />,
            path: '/leave-management',
            show: true,
            color: '#f0fdf4',
        },
        {
            id: 'pay',
            title: 'Pay',
            icon: <PaidIcon sx={{ fontSize: 40, color: '#f59e0b' }} />,
            path: '/payroll',
            show: true,
            color: '#fffbeb',
        },
        {
            id: 'performance',
            title: 'Performance',
            icon: <PerformanceIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />,
            path: '/evaluations/view',
            show: true,
            color: '#f5f3ff',
        },
        {
            id: 'benefits',
            title: 'Benefits',
            icon: <BenefitsIcon sx={{ fontSize: 40, color: '#ec4899' }} />,
            path: '/benefits',
            show: true,
            color: '#fdf2f8',
        },
        {
            id: 'goals',
            title: 'Goals',
            icon: <GoalsIcon sx={{ fontSize: 40, color: '#06b6d4' }} />,
            path: '/goals',
            show: true,
            color: '#ecfeff',
        },
        {
            id: 'inbox',
            title: 'My Tasks',
            icon: <InboxIcon sx={{ fontSize: 40, color: '#f43f5e' }} />,
            path: '/inbox',
            show: isAdmin || isManager,
            color: '#fff1f2',
        },
        {
            id: 'team',
            title: 'My Team',
            icon: <TeamIcon sx={{ fontSize: 40, color: '#14b8a6' }} />,
            path: '/employees/view',
            show: isAdmin || isManager,
            color: '#f0fdfa',
        },
        {
            id: 'admin',
            title: 'Admin Console',
            icon: <AdminIcon sx={{ fontSize: 40, color: '#64748b' }} />,
            path: '/settings',
            show: isAdmin,
            color: '#f8fafc',
        },
    ];

    const visibleWorklets = worklets.filter((w) => w.show);

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" fontWeight={800} color="#1e293b" sx={{ mb: 2 }}>
                Your Apps
            </Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: 'repeat(3, 1fr)',
                        md: 'repeat(4, 1fr)',
                        lg: 'repeat(5, 1fr)',
                    },
                    gap: 3,
                }}
            >
                {visibleWorklets.map((worklet) => (
                    <Paper
                        key={worklet.id}
                        elevation={0}
                        onClick={() => navigate(worklet.path)}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid #eef2ff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            bgcolor: 'white',
                            aspectRatio: '1 / 1', // make them squares
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                borderColor: '#c7d2fe',
                                bgcolor: worklet.color,
                            },
                        }}
                    >
                        <Box
                            sx={{
                                mb: 1.5,
                                bgcolor: worklet.color,
                                p: 1.5,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {worklet.icon}
                        </Box>
                        <Typography variant="body2" fontWeight={700} color="#334155" textAlign="center">
                            {worklet.title}
                        </Typography>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
};

export default DashboardWorklets;
