import React, { useEffect, useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    LinearProgress,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tooltip,
} from '@mui/material';
import {
    Assignment as TaskIcon,
    Description as DocIcon,
    School as TrainingIcon,
    CheckCircle as DoneIcon,
    RadioButtonUnchecked as PendingIcon,
    Visibility as ViewIcon,
    CloudUpload as UploadIcon,
    FactCheck as VerifyIcon,
    ArrowBack as BackIcon,
    Add as AddIcon,
    Devices as AssetIcon,
    Timeline as ProbationIcon,
    VerifiedUser as VerificationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/axios';
import { format } from 'date-fns';

interface OnboardingTask {
    id: number;
    title: string;
    description?: string;
    status: 'Pending' | 'Completed';
    dueDate?: string;
    completedAt?: string;
}

interface OnboardingDoc {
    id: number;
    title: string;
    description?: string;
    fileUrl?: string;
    status: 'Pending' | 'Uploaded' | 'Verified' | 'Rejected';
    uploadedAt?: string;
}

interface OnboardingTraining {
    id: number;
    trainingName: string;
    status: 'Assigned' | 'InProgress' | 'Completed';
    completedAt?: string;
}

interface OnboardingRecord {
    id: number;
    employeeId: number;
    status: string;
    startDate: string;
    dueDate?: string;
    employee: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        department?: { name: string };
        position?: { name: string };
        assets: any[];
    };
    tasks: OnboardingTask[];
    documents: OnboardingDoc[];
    trainings: OnboardingTraining[];
    verifications?: any[];
    probation?: {
        id: number;
        startDate: string;
        endDate: string;
        status: string;
        feedback?: string;
        evaluation?: string;
        goals?: any;
    };
}

const OnboardingManagement: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false);
    const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '' });
    const [newTraining, setNewTraining] = useState({ trainingName: '' });
    const [newAsset, setNewAsset] = useState({ assetType: '', brand: '', serialNumber: '' });

    useEffect(() => {
        const employeeId = searchParams.get('employeeId');
        if (employeeId) {
            const parsed = Number(employeeId);
            if (Number.isFinite(parsed) && parsed > 0) {
                setSelectedEmployeeId(parsed);
            }
        }
    }, [searchParams]);

    // Mutations
    const addAssetMutation = useMutation({
        mutationFn: async (data: any) => 
            await api.post(`/api/assets/employee/${detail?.employee.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] });
            setIsAssetDialogOpen(false);
            setNewAsset({ assetType: '', brand: '', serialNumber: '' });
        },
    });

    const updateAssetMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => 
            await api.patch(`/api/assets/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] }),
    });

    const evaluateProbationMutation = useMutation({
        mutationFn: async ({ id, status, feedback }: { id: number; status: string; feedback: string }) => 
            await api.post(`/api/probation/${id}/evaluate`, { status, feedback }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] }),
    });
    const { data: onboardings = [], isLoading } = useQuery<OnboardingRecord[]>({
        queryKey: ['onboardings'],
        queryFn: async () => (await api.get('/api/onboarding')).data,
    });

    // Fetch Single Onboarding Detail
    const { data: detail, isLoading: isDetailLoading } = useQuery<OnboardingRecord>({
        queryKey: ['onboarding', selectedEmployeeId],
        queryFn: async () => (await api.get(`/api/onboarding/${selectedEmployeeId}`)).data,
        enabled: !!selectedEmployeeId,
    });

    // Mutations
    const updateTaskMutation = useMutation({
        mutationFn: async ({ taskId, data }: { taskId: number; data: any }) => 
            await api.patch(`/api/onboarding/tasks/${taskId}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] }),
    });

    const verifyDocMutation = useMutation({
        mutationFn: async ({ docId, status }: { docId: number; status: string }) => 
            await api.patch(`/api/onboarding/documents/${docId}/verify`, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] }),
    });

    const generateContractMutation = useMutation({
        mutationFn: async (employeeId: number) => 
            await api.post(`/api/onboarding/${employeeId}/generate-contract`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] });
            alert('Contract generated and sent successfully!');
        },
    });

    const updateVerificationMutation = useMutation({
        mutationFn: async ({ id, status, result, notes }: { id: number; status: string; result?: string; notes?: string }) => 
            await api.patch(`/api/verification/${id}`, { status, result, notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] });
        }
    });

    const initVerificationsMutation = useMutation({
        mutationFn: async (onboardingId: number) => 
            await api.post(`/api/verification/${onboardingId}/initialize`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] });
        }
    });

    const completeOnboardingMutation = useMutation({
        mutationFn: async (id: number) =>
            await api.patch(`/api/onboarding/${id}`, { status: 'Completed', completedAt: new Date().toISOString() }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] });
            queryClient.invalidateQueries({ queryKey: ['onboardings'] });
        },
    });

    const addTaskMutation = useMutation({
        mutationFn: async (data: any) => 
            await api.post(`/api/onboarding/${detail?.id}/tasks`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] });
            setIsTaskDialogOpen(false);
            setNewTask({ title: '', description: '' });
        },
    });

    const assignTrainingMutation = useMutation({
        mutationFn: async (data: any) => 
            await api.post(`/api/onboarding/${detail?.id}/trainings`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding', selectedEmployeeId] });
            setIsTrainingDialogOpen(false);
            setNewTraining({ trainingName: '' });
        },
    });

    const calculateProgress = (record: OnboardingRecord) => {
        const total = record.tasks.length + record.documents.length + record.trainings.length;
        if (total === 0) return 0;
        const completedTasks = record.tasks.filter(t => t.status === 'Completed').length;
        const verifiedDocs = record.documents.filter(d => d.status === 'Verified').length;
        const completedTrainings = record.trainings.filter(t => t.status === 'Completed').length;
        return Math.round(((completedTasks + verifiedDocs + completedTrainings) / total) * 100);
    };

    if (selectedEmployeeId && detail) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Button 
                    startIcon={<BackIcon />} 
                    onClick={() => setSelectedEmployeeId(null)}
                    sx={{ mb: 2 }}
                >
                    Back to Dashboard
                </Button>

                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h5" fontWeight={700}>
                            Onboarding: {detail.employee.firstName} {detail.employee.lastName}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {calculateProgress(detail) === 100 && detail.status !== 'Completed' && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    disabled={completeOnboardingMutation.isPending}
                                    onClick={() => completeOnboardingMutation.mutate(detail.id)}
                                >
                                    Mark Complete
                                </Button>
                            )}
                            {detail.status === 'Completed' && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => navigate('/evaluations/create')}
                                >
                                    Start Evaluation
                                </Button>
                            )}
                            <Chip 
                                label={detail.status} 
                                color={detail.status === 'Completed' ? 'success' : 'primary'} 
                                variant="outlined"
                            />
                        </Box>
                    </Box>
                    <Typography color="text.secondary" variant="body2">
                        {detail.employee.position?.name} • {detail.employee.department?.name}
                    </Typography>
                    
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>Overall Progress</Typography>
                            <Typography variant="body2" color="primary">{calculateProgress(detail)}%</Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={calculateProgress(detail)} 
                            sx={{ height: 10, borderRadius: 5 }}
                        />
                    </Box>
                </Paper>

                <Paper sx={{ borderRadius: 2 }}>
                    <Tabs 
                        value={activeTab} 
                        onChange={(_, v) => setActiveTab(v)}
                        sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
                    >
                        <Tab icon={<TaskIcon />} iconPosition="start" label="Checklist" />
                        <Tab icon={<DocIcon />} iconPosition="start" label="Documents" />
                        <Tab icon={<TrainingIcon />} iconPosition="start" label="Training" />
                        <Tab icon={<AssetIcon />} iconPosition="start" label="Assets" />
                        <Tab icon={<ProbationIcon />} iconPosition="start" label="Probation" />
                        <Tab icon={<VerificationIcon />} iconPosition="start" label="Verification" />
                    </Tabs>

                    <Box sx={{ p: 2 }}>
                        {activeTab === 0 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsTaskDialogOpen(true)}
                                    >
                                        Add Task
                                    </Button>
                                </Box>
                                <List>
                                    {detail.tasks.map(task => (
                                        <ListItem key={task.id} divider>
                                            <ListItemIcon>
                                                {task.status === 'Completed' ? <DoneIcon color="success" /> : <PendingIcon color="disabled" />}
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={task.title} 
                                                secondary={task.description}
                                                sx={{ textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}
                                            />
                                            <ListItemSecondaryAction>
                                                <Button 
                                                    size="small"
                                                    variant={task.status === 'Completed' ? "outlined" : "contained"}
                                                    onClick={() => updateTaskMutation.mutate({ 
                                                        taskId: task.id, 
                                                        data: { status: task.status === 'Completed' ? 'Pending' : 'Completed' } 
                                                    })}
                                                >
                                                    {task.status === 'Completed' ? 'Reopen' : 'Complete'}
                                                </Button>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}

                        {activeTab === 1 && (
                            <List>
                                {(detail.documents || []).map(doc => (
                                    <ListItem key={doc.id} divider>
                                        <ListItemIcon>
                                            {doc.status === 'Verified' ? <DoneIcon color="success" /> : <DocIcon color="disabled" />}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={doc.title} 
                                            secondary={`Status: ${doc.status}`}
                                        />
                                        <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                                            {doc.fileUrl && (
                                                <IconButton 
                                                    size="small" 
                                                    component="a" 
                                                    href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.fileUrl}`} 
                                                    target="_blank"
                                                >
                                                    <ViewIcon />
                                                </IconButton>
                                            )}
                                            {doc.status === 'Uploaded' && (
                                                <>
                                                    <Tooltip title="Verify">
                                                        <IconButton 
                                                            size="small" 
                                                            color="success"
                                                            onClick={() => verifyDocMutation.mutate({ docId: doc.id, status: 'Verified' })}
                                                        >
                                                            <VerifyIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Reject">
                                                        <IconButton 
                                                            size="small" 
                                                            color="error"
                                                            onClick={() => verifyDocMutation.mutate({ docId: doc.id, status: 'Rejected' })}
                                                        >
                                                            <VerifyIcon style={{ transform: 'rotate(180deg)' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                                {(detail.documents || []).filter(d => d.title === 'Signed Contract' && d.status === 'Pending').length > 0 && (
                                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f9ff', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} color="primary.main">
                                                Contract Generation
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Generate a professional employment contract for this hire.
                                            </Typography>
                                        </Box>
                                        <Button 
                                            variant="contained" 
                                            size="small"
                                            disabled={generateContractMutation.isPending}
                                            onClick={() => generateContractMutation.mutate(detail.employee.id)}
                                        >
                                            {generateContractMutation.isPending ? 'Generating...' : 'Generate & Send Contract'}
                                        </Button>
                                    </Box>
                                )}
                            </List>
                        )}

                        {activeTab === 2 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsTrainingDialogOpen(true)}
                                    >
                                        Assign Training
                                    </Button>
                                </Box>
                                <List>
                                    {detail.trainings.map(training => (
                                        <ListItem key={training.id} divider>
                                            <ListItemIcon>
                                                {training.status === 'Completed' ? <DoneIcon color="success" /> : <TrainingIcon color="disabled" />}
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={training.trainingName} 
                                                secondary={`Status: ${training.status}`}
                                            />
                                            <ListItemSecondaryAction>
                                                <Chip 
                                                    label={training.status} 
                                                    size="small" 
                                                    color={training.status === 'Completed' ? 'success' : 'warning'} 
                                                />
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                    {detail.trainings.length === 0 && (
                                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                            No trainings assigned at this moment.
                                        </Typography>
                                    )}
                                </List>
                            </Box>
                        )}
                        {activeTab === 3 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsAssetDialogOpen(true)}
                                    >
                                        Assign Asset
                                    </Button>
                                </Box>
                                <List>
                                    {(detail.employee.assets || []).map((asset: any) => (
                                        <ListItem key={asset.id} divider>
                                            <ListItemIcon><AssetIcon color="primary" /></ListItemIcon>
                                            <ListItemText 
                                                primary={`${asset.assetType}: ${asset.brand || ''}`} 
                                                secondary={`SN: ${asset.serialNumber || 'N/A'} • Assigned: ${asset.assignedDate ? format(new Date(asset.assignedDate), 'MMM dd') : 'N/A'}`}
                                            />
                                            <ListItemSecondaryAction>
                                                <Chip label={asset.status} size="small" color={asset.status === 'Assigned' ? 'success' : 'default'} />
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                    {(detail.employee.assets || []).length === 0 && (
                                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                            No assets assigned to this employee yet.
                                        </Typography>
                                    )}
                                </List>
                            </Box>
                        )}

                        {activeTab === 4 && (
                            <Box>
                                {detail.probation ? (
                                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                            Probation Status: <Chip label={detail.probation.status} size="small" color="primary" />
                                        </Typography>
                                        <Typography variant="body2">
                                            Period: {format(new Date(detail.probation.startDate), 'MMM dd, yyyy')} - {format(new Date(detail.probation.endDate), 'MMM dd, yyyy')}
                                        </Typography>
                                        
                                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                            <Button 
                                                variant="contained" 
                                                color="success"
                                                onClick={() => evaluateProbationMutation.mutate({ id: detail.probation!.id, status: 'Passed', feedback: 'Employee has successfully met all onboarding goals.' })}
                                            >
                                                Pass Probation
                                            </Button>
                                            <Button 
                                                variant="outlined" 
                                                color="error"
                                                onClick={() => {
                                                    const feedback = prompt('Please enter feedback for failure:');
                                                    if (feedback) evaluateProbationMutation.mutate({ id: detail.probation!.id, status: 'Failed', feedback });
                                                }}
                                            >
                                                Fail Probation
                                            </Button>
                                        </Box>

                                        {detail.probation.evaluation && (
                                            <Alert severity="info" sx={{ mt: 2 }}>
                                                {detail.probation.evaluation}
                                            </Alert>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                        No probation period initialized for this onboarding.
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {activeTab === 5 && (
                            <Box>
                                <List>
                                    {(detail.verifications || []).map((v: any) => (
                                        <ListItem key={v.id} divider>
                                            <ListItemIcon>
                                                {v.status === 'Verified' ? <VerificationIcon color="success" /> : <VerificationIcon color="disabled" />}
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={v.type} 
                                                secondary={v.notes || `Verification status: ${v.status}`}
                                            />
                                            <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                                                <Chip 
                                                    label={v.status} 
                                                    size="small" 
                                                    color={v.status === 'Verified' ? 'success' : v.status === 'Failed' ? 'error' : 'warning'} 
                                                />
                                                {v.status !== 'Verified' && (
                                                    <Button 
                                                        size="small" 
                                                        variant="outlined" 
                                                        onClick={() => updateVerificationMutation.mutate({ id: v.id, status: 'Verified' })}
                                                    >
                                                        Verify
                                                    </Button>
                                                )}
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                    {(detail.verifications || []).length === 0 && (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                No verification tasks found.
                                            </Typography>
                                            <Button 
                                                variant="contained" 
                                                onClick={() => initVerificationsMutation.mutate(detail.id)}
                                            >
                                                Initialize Checks
                                            </Button>
                                        </Box>
                                    )}
                                </List>
                            </Box>
                        )}
                    </Box>
                </Paper>

                {/* Add Task Dialog */}
                <Dialog open={isTaskDialogOpen} onClose={() => setIsTaskDialogOpen(false)}>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Task Title"
                            margin="normal"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            margin="normal"
                            multiline
                            rows={3}
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
                        <Button 
                            variant="contained" 
                            disabled={!newTask.title || addTaskMutation.isPending}
                            onClick={() => addTaskMutation.mutate(newTask)}
                        >
                            Add
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Assign Training Dialog */}
                <Dialog open={isTrainingDialogOpen} onClose={() => setIsTrainingDialogOpen(false)}>
                    <DialogTitle>Assign Training</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Training Name"
                            margin="normal"
                            placeholder="e.g. Cyber Security Awareness"
                            value={newTraining.trainingName}
                            onChange={(e) => setNewTraining({ ...newTraining, trainingName: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsTrainingDialogOpen(false)}>Cancel</Button>
                        <Button 
                            variant="contained" 
                            disabled={!newTraining.trainingName || assignTrainingMutation.isPending}
                            onClick={() => assignTrainingMutation.mutate(newTraining)}
                        >
                            Assign
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Assign Asset Dialog */}
                <Dialog open={isAssetDialogOpen} onClose={() => setIsAssetDialogOpen(false)}>
                    <DialogTitle>Assign Company Asset</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Asset Type"
                            margin="normal"
                            placeholder="e.g. Laptop, Mobile, Access Card"
                            value={newAsset.assetType}
                            onChange={(e) => setNewAsset({ ...newAsset, assetType: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Brand/Model"
                            margin="normal"
                            value={newAsset.brand}
                            onChange={(e) => setNewAsset({ ...newAsset, brand: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Serial Number"
                            margin="normal"
                            value={newAsset.serialNumber}
                            onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsAssetDialogOpen(false)}>Cancel</Button>
                        <Button 
                            variant="contained" 
                            disabled={!newAsset.assetType || addAssetMutation.isPending}
                            onClick={() => addAssetMutation.mutate(newAsset)}
                        >
                            Assign
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} sx={{ color: '#1e293b' }}>
                        Onboarding Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Track and manage the progress of new team members
                    </Typography>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Started</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <LinearProgress sx={{ width: '50%', mx: 'auto' }} />
                                </TableCell>
                            </TableRow>
                        ) : onboardings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No active onboarding processes found.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : onboardings.map((ob) => (
                            <TableRow key={ob.id} hover>
                                <TableCell>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            {ob.employee.firstName} {ob.employee.lastName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {ob.employee.position?.name}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{ob.employee.department?.name || 'N/A'}</TableCell>
                                <TableCell sx={{ width: '20%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={calculateProgress(ob)} 
                                            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                        />
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                            {calculateProgress(ob)}%
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={ob.status} 
                                        size="small" 
                                        variant="outlined"
                                        color={ob.status === 'Completed' ? 'success' : 'primary'}
                                    />
                                </TableCell>
                                <TableCell>{format(new Date(ob.startDate), 'MMM dd, yyyy')}</TableCell>
                                <TableCell align="right">
                                    <Button 
                                        variant="contained" 
                                        size="small" 
                                        onClick={() => setSelectedEmployeeId(ob.employeeId)}
                                    >
                                        View Detail
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default OnboardingManagement;
