import React from 'react';
import { Box, Button } from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Paid as PaidIcon,
  FlightTakeoff as LeaveIcon,
  Work as WorkIcon,
  RateReview as EvalIcon,
  Flag as GoalIcon,
  Groups as TeamIcon,
  Receipt as PayslipIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface DashboardQuickActionsProps {
  role?: string;
}

const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ role = 'Employee' }) => {
  const navigate = useNavigate();
  const isAdmin = role === 'Admin' || role === 'SuperAdmin';
  const isManager = role === 'Manager';

  const actions = isAdmin
    ? [
        { label: 'Add Employee', icon: <PersonAddIcon />, path: '/employees/create' },
        { label: 'Run Payroll', icon: <PaidIcon />, path: '/payroll' },
        { label: 'Approve Leaves', icon: <LeaveIcon />, path: '/leave-management' },
        { label: 'Post Job', icon: <WorkIcon />, path: '/recruitment' },
        { label: 'New Evaluation', icon: <EvalIcon />, path: '/evaluations/create' },
      ]
    : isManager
      ? [
          { label: 'Approve Leaves', icon: <LeaveIcon />, path: '/leave-management' },
          { label: 'View Team', icon: <TeamIcon />, path: '/employees/view' },
          { label: 'Schedule Review', icon: <EvalIcon />, path: '/evaluations/create' },
          { label: 'Assign Goals', icon: <GoalIcon />, path: '/goals' },
        ]
      : [
          { label: 'Request Leave', icon: <LeaveIcon />, path: '/leave-management' },
          { label: 'My Goals', icon: <GoalIcon />, path: '/goals' },
          { label: 'My Evaluations', icon: <EvalIcon />, path: '/evaluations/view' },
          { label: 'View Payslip', icon: <PayslipIcon />, path: '/payroll' },
        ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outlined"
          size="small"
          startIcon={action.icon}
          onClick={() => navigate(action.path)}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#e2e8f0',
            color: '#334155',
            '&:hover': { borderColor: 'primary.main', bgcolor: '#f8faff' },
          }}
        >
          {action.label}
        </Button>
      ))}
    </Box>
  );
};

export default DashboardQuickActions;
