import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Container,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Box,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Divider,
    Alert,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Work as WorkIcon,
    Flag as GoalIcon,
    CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/axios';

const steps = ['Account Setup', 'Employee Profile', 'Initial Goals'];

const NewHireWizard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const candidateId = searchParams.get('candidateId');

    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        userData: {
            fullName: '',
            userName: '',
            password: '',
            role: 'Employee',
            gender: '',
            age: '',
        },
        employeeData: {
            email: '',
            phone: '',
            department: '',
            position: '',
            hireDate: new Date().toISOString().split('T')[0],
        },
        goals: [] as { objective: string; priority: string; duedate: string }[],
    });

    // Current Goal Input
    const [currentGoal, setCurrentGoal] = useState({
        objective: '',
        priority: 'Normal',
        duedate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    // Fetch Depts/Positions
    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => (await api.get('/api/departments')).data,
    });

    const { data: positions = [] } = useQuery({
        queryKey: ['positions'],
        queryFn: async () => (await api.get('/api/positions')).data,
    });

    // Fetch Candidate if candidateId is present
    useEffect(() => {
        const fetchCandidate = async () => {
            if (!candidateId) return;

            try {
                const response = await api.get(`/api/recruitment/candidates/${candidateId}`);
                const candidate = response.data;

                setFormData(prev => ({
                    ...prev,
                    userData: {
                        ...prev.userData,
                        fullName: `${candidate.firstName} ${candidate.lastName}`,
                    },
                    employeeData: {
                        ...prev.employeeData,
                        email: candidate.email,
                        phone: candidate.phone || '',
                        position: candidate.position || '',
                    }
                }));
            } catch (err) {
                console.error('Error fetching candidate data:', err);
                setErrors('Failed to load candidate data');
            }
        };

        fetchCandidate();
    }, [candidateId]);

    const hireMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/api/onboarding/wizard', {
                ...data,
                candidateId
            });
            return response.data;
        },
        onSuccess: (data) => {
            setActiveStep(steps.length);
        },
        onError: (err: any) => {
            setErrors(err.response?.data?.error || err.message);
        }
    });

    const handleNext = () => {
        if (activeStep === 0) {
            if (!formData.userData.fullName || !formData.userData.userName || !formData.userData.password) {
                setErrors('Please fill in all account fields');
                return;
            }
        }
        if (activeStep === 1) {
            if (!formData.employeeData.email || !formData.employeeData.position) {
                setErrors('Email and Position are required');
                return;
            }
        }
        setErrors(null);
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleHire = () => {
        hireMutation.mutate(formData);
    };

    const addGoal = () => {
        if (!currentGoal.objective) return;
        setFormData(prev => ({
            ...prev,
            goals: [...prev.goals, { ...currentGoal }]
        }));
        setCurrentGoal({
            objective: '',
            priority: 'Normal',
            duedate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
    };

    const removeGoal = (index: number) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index)
        }));
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <Box sx={{ gridColumn: 'span 2' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon color="primary" /> User Account Information
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            label="Full Name"
                            value={formData.userData.fullName}
                            onChange={(e) => setFormData({ ...formData, userData: { ...formData.userData, fullName: e.target.value } })}
                        />
                        <TextField
                            fullWidth
                            label="Username"
                            value={formData.userData.userName}
                            onChange={(e) => setFormData({ ...formData, userData: { ...formData.userData, userName: e.target.value } })}
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={formData.userData.password}
                            onChange={(e) => setFormData({ ...formData, userData: { ...formData.userData, password: e.target.value } })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={formData.userData.role}
                                label="Role"
                                onChange={(e) => setFormData({ ...formData, userData: { ...formData.userData, role: e.target.value } })}
                            >
                                <MenuItem value="Employee">Employee</MenuItem>
                                <MenuItem value="Manager">Manager</MenuItem>
                                <MenuItem value="Admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Gender</InputLabel>
                            <Select
                                value={formData.userData.gender}
                                label="Gender"
                                onChange={(e) => setFormData({ ...formData, userData: { ...formData.userData, gender: e.target.value } })}
                            >
                                <MenuItem value="Male">Male</MenuItem>
                                <MenuItem value="Female">Female</MenuItem>

                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Age"
                            type="number"
                            value={formData.userData.age}
                            onChange={(e) => setFormData({ ...formData, userData: { ...formData.userData, age: e.target.value } })}
                        />
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <Box sx={{ gridColumn: 'span 2' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <WorkIcon color="primary" /> Employee Profile & Job Details
                            </Typography>
                        </Box>
                        <TextField
                            fullWidth
                            label="Work Email"
                            type="email"
                            value={formData.employeeData.email}
                            onChange={(e) => setFormData({ ...formData, employeeData: { ...formData.employeeData, email: e.target.value } })}
                        />
                        <TextField
                            fullWidth
                            label="Phone Number"
                            value={formData.employeeData.phone}
                            onChange={(e) => setFormData({ ...formData, employeeData: { ...formData.employeeData, phone: e.target.value } })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Department</InputLabel>
                            <Select
                                value={formData.employeeData.department}
                                label="Department"
                                onChange={(e) => setFormData({ ...formData, employeeData: { ...formData.employeeData, department: e.target.value } })}
                            >
                                {departments.map((d: any) => (
                                    <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Position</InputLabel>
                            <Select
                                value={formData.employeeData.position}
                                label="Position"
                                onChange={(e) => setFormData({ ...formData, employeeData: { ...formData.employeeData, position: e.target.value } })}
                            >
                                {positions.map((p: any) => (
                                    <MenuItem key={p.id} value={p.name}>{p.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Hire Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            value={formData.employeeData.hireDate}
                            onChange={(e) => setFormData({ ...formData, employeeData: { ...formData.employeeData, hireDate: e.target.value } })}
                        />
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GoalIcon color="primary" /> Initial Onboarding Goals
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2, alignItems: 'end' }}>
                                <TextField
                                    fullWidth
                                    label="Goal Objective"
                                    placeholder="e.g. Complete security training"
                                    value={currentGoal.objective}
                                    onChange={(e) => setCurrentGoal({ ...currentGoal, objective: e.target.value })}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Priority</InputLabel>
                                    <Select
                                        value={currentGoal.priority}
                                        label="Priority"
                                        onChange={(e) => setCurrentGoal({ ...currentGoal, priority: e.target.value })}
                                    >
                                        <MenuItem value="Low">Low</MenuItem>
                                        <MenuItem value="Normal">Normal</MenuItem>
                                        <MenuItem value="High">High</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    disabled={!currentGoal.objective}
                                    onClick={addGoal}
                                    sx={{ height: '56px' }}
                                >
                                    Add Goal
                                </Button>
                            </Box>
                        </Paper>

                        <List>
                            {formData.goals.map((goal, index) => (
                                <ListItem
                                    key={index}
                                    sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 1, bgcolor: 'white' }}
                                >
                                    <ListItemText
                                        primary={goal.objective}
                                        secondary={`Priority: ${goal.priority} | Due: ${goal.duedate}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton edge="end" onClick={() => removeGoal(index)}>
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                            {formData.goals.length === 0 && (
                                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                                    No goals added yet.
                                </Typography>
                            )}
                        </List>
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <Typography variant="h4" align="center" fontWeight={700} gutterBottom sx={{ color: '#1e293b' }}>
                    New Hire Wizard
                </Typography>
                <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
                    Complete 3 simple steps to fully onboard a new team member
                </Typography>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === steps.length ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            Success!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            The new hire has been successfully added to the system.
                            An account was created, their profile is active, and onboarding goals have been assigned.
                        </Typography>
                        <Button variant="contained" onClick={() => navigate('/users/view')} size="large">
                            View All Users
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        {errors && <Alert severity="error" sx={{ mb: 3 }}>{errors}</Alert>}

                        <Box sx={{ minHeight: '300px' }}>
                            {renderStepContent(activeStep)}
                        </Box>

                        <Divider sx={{ my: 4 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                variant="outlined"
                            >
                                Back
                            </Button>
                            {activeStep === steps.length - 1 ? (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleHire}
                                    disabled={hireMutation.isPending}
                                    startIcon={hireMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
                                    size="large"
                                >
                                    Complete Hire & Onboard
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={handleNext}
                                    size="large"
                                >
                                    Next Step
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default NewHireWizard;
