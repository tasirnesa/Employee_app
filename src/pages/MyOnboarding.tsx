import React from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    LinearProgress,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Button,
    Chip,
    Alert,
} from '@mui/material';
import {
    Assignment as TaskIcon,
    Description as DocIcon,
    School as TrainingIcon,
    Devices as AssetIcon,
    Timeline as ProbationIcon,
    CheckCircle as DoneIcon,
    RadioButtonUnchecked as PendingIcon,
    CloudUpload as UploadIcon,
    VerifiedUser as VerificationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { format } from 'date-fns';

const MyOnboarding: React.FC = () => {
    const [activeTab, setActiveTab] = React.useState(0);
    const queryClient = useQueryClient();

    const { data: onboarding, isLoading, error } = useQuery({
        queryKey: ['my-onboarding'],
        queryFn: async () => (await api.get('/api/onboarding/me')).data,
    });

    const uploadDocMutation = useMutation({
        mutationFn: async ({ docId, file }: { docId: number; file: File }) => {
            const formData = new FormData();
            formData.append('file', file);
            // employee uploads use the same upload endpoint — no ONBOARDING_MANAGE permission needed for own docs
            return await api.patch(`/api/onboarding/documents/${docId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-onboarding'] }),
    });

    const updateTrainingMutation = useMutation({
        mutationFn: async ({ trainingId, status }: { trainingId: number; status: string }) =>
            await api.patch(`/api/onboarding/trainings/${trainingId}`, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-onboarding'] }),
    });

    const calculateProgress = (record: any) => {
        if (!record) return 0;
        const total = record.tasks.length + record.documents.length + record.trainings.length + (record.verifications || []).length;
        if (total === 0) return 0;
        const completedTasks = record.tasks.filter((t: any) => t.status === 'Completed').length;
        const verifiedDocs = record.documents.filter((d: any) => d.status === 'Verified').length;
        const completedTrainings = record.trainings.filter((t: any) => t.status === 'Completed').length;
        const verifiedChecks = (record.verifications || []).filter((v: any) => v.status === 'Verified').length;
        return Math.round(((completedTasks + verifiedDocs + completedTrainings + verifiedChecks) / total) * 100);
    };

    if (isLoading) return <LinearProgress sx={{ mt: 4 }} />;
    if (error) return <Alert severity="info" sx={{ mt: 4 }}>You don't have an active onboarding process at the moment.</Alert>;
    if (!onboarding) return <Alert severity="info" sx={{ mt: 4 }}>No onboarding data found.</Alert>;

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4, borderRadius: 3, mb: 3, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white' }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Welcome to the Team, {onboarding.employee.firstName}!
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                    We're excited to have you here. Let's get you set up and settled in.
                </Typography>

                <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>Your Onboarding Progress</Typography>
                        <Typography variant="body2" fontWeight={600}>{calculateProgress(onboarding)}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={calculateProgress(onboarding)}
                        sx={{ height: 12, borderRadius: 6, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
                    />
                </Box>
            </Paper>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab icon={<TaskIcon />}         iconPosition="start" label="Tasks" />
                    <Tab icon={<DocIcon />}           iconPosition="start" label="Documents" />
                    <Tab icon={<TrainingIcon />}      iconPosition="start" label="Training" />
                    <Tab icon={<AssetIcon />}         iconPosition="start" label="Assets" />
                    <Tab icon={<ProbationIcon />}     iconPosition="start" label="Probation" />
                    <Tab icon={<VerificationIcon />}  iconPosition="start" label="Verification" />
                </Tabs>

                <Box sx={{ p: 3 }}>

                    {/* ── 0: Tasks ── */}
                    {activeTab === 0 && (
                        <>
                            {onboarding.tasks.length === 0 && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No tasks assigned yet.</Typography>
                                </Box>
                            )}
                            <List disablePadding>
                                {onboarding.tasks.map((task: any) => (
                                    <ListItem key={task.id} divider sx={{ py: 2 }}>
                                        <ListItemIcon>
                                            {task.status === 'Completed'
                                                ? <DoneIcon color="success" />
                                                : <PendingIcon color="disabled" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={task.title}
                                            secondary={task.description}
                                            primaryTypographyProps={{
                                                fontWeight: 600,
                                                sx: { textDecoration: task.status === 'Completed' ? 'line-through' : 'none' },
                                            }}
                                        />
                                        <Chip
                                            label={task.status}
                                            size="small"
                                            color={task.status === 'Completed' ? 'success' : 'default'}
                                            variant="outlined"
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}

                    {/* ── 1: Documents ── */}
                    {activeTab === 1 && (
                        <>
                            {onboarding.documents.length === 0 && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No documents required yet.</Typography>
                                </Box>
                            )}
                            <List disablePadding>
                                {onboarding.documents.map((doc: any) => (
                                    <ListItem key={doc.id} divider sx={{ py: 2 }}>
                                        <ListItemIcon>
                                            {doc.status === 'Verified'
                                                ? <DoneIcon color="success" />
                                                : doc.status === 'Rejected'
                                                    ? <DocIcon color="error" />
                                                    : <DocIcon color="disabled" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={doc.title}
                                            secondary={doc.description || `Status: ${doc.status}`}
                                            primaryTypographyProps={{ fontWeight: 600 }}
                                        />
                                        <ListItemSecondaryAction>
                                            <Chip
                                                label={doc.status}
                                                size="small"
                                                color={
                                                    doc.status === 'Verified' ? 'success'
                                                    : doc.status === 'Rejected' ? 'error'
                                                    : doc.status === 'Uploaded' ? 'warning'
                                                    : 'default'
                                                }
                                                sx={{ mr: doc.status !== 'Verified' ? 1 : 0 }}
                                            />
                                            {doc.status !== 'Verified' && (
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    component="label"
                                                    startIcon={<UploadIcon />}
                                                    disabled={uploadDocMutation.isPending}
                                                >
                                                    {doc.status === 'Uploaded' ? 'Re-upload' : 'Upload'}
                                                    <input
                                                        type="file"
                                                        hidden
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) uploadDocMutation.mutate({ docId: doc.id, file });
                                                        }}
                                                    />
                                                </Button>
                                            )}
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}

                    {/* ── 2: Training ── */}
                    {activeTab === 2 && (
                        <>
                            {onboarding.trainings.length === 0 && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No trainings assigned yet.</Typography>
                                </Box>
                            )}
                            <List disablePadding>
                                {onboarding.trainings.map((training: any) => (
                                    <ListItem key={training.id} divider sx={{ py: 2 }}>
                                        <ListItemIcon>
                                            {training.status === 'Completed'
                                                ? <DoneIcon color="success" />
                                                : <TrainingIcon color={training.status === 'InProgress' ? 'primary' : 'disabled'} />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={training.trainingName}
                                            secondary={training.description}
                                            primaryTypographyProps={{ fontWeight: 600 }}
                                        />
                                        <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {training.status === 'Assigned' && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    disabled={updateTrainingMutation.isPending}
                                                    onClick={() => updateTrainingMutation.mutate({ trainingId: training.id, status: 'InProgress' })}
                                                >
                                                    Start
                                                </Button>
                                            )}
                                            {training.status === 'InProgress' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="success"
                                                    disabled={updateTrainingMutation.isPending}
                                                    onClick={() => updateTrainingMutation.mutate({ trainingId: training.id, status: 'Completed' })}
                                                >
                                                    Mark Done
                                                </Button>
                                            )}
                                            <Chip
                                                label={training.status}
                                                size="small"
                                                color={
                                                    training.status === 'Completed' ? 'success'
                                                    : training.status === 'InProgress' ? 'primary'
                                                    : 'default'
                                                }
                                            />
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}

                    {/* ── 3: Assets ── */}
                    {activeTab === 3 && (
                        <>
                            {onboarding.employee.assets.length === 0 && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No assets assigned yet.</Typography>
                                </Box>
                            )}
                            <List disablePadding>
                                {onboarding.employee.assets.map((asset: any) => (
                                    <ListItem key={asset.id} divider sx={{ py: 2 }}>
                                        <ListItemIcon><AssetIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary={`${asset.assetType}${asset.brand ? ` — ${asset.brand}` : ''}`}
                                            secondary={`SN: ${asset.serialNumber || 'N/A'}`}
                                            primaryTypographyProps={{ fontWeight: 600 }}
                                        />
                                        <Chip
                                            label={asset.status}
                                            size="small"
                                            color={asset.status === 'Assigned' ? 'success' : 'default'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}

                    {/* ── 4: Probation ── */}
                    {activeTab === 4 && (
                        <Box sx={{ py: 1 }}>
                            {onboarding.probation ? (
                                <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" fontWeight={700}>Probation Period</Typography>
                                        <Chip
                                            label={onboarding.probation.status}
                                            size="small"
                                            color={
                                                onboarding.probation.status === 'Passed' ? 'success'
                                                : onboarding.probation.status === 'Failed' ? 'error'
                                                : onboarding.probation.status === 'Extended' ? 'warning'
                                                : 'primary'
                                            }
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Start: <strong>{format(new Date(onboarding.probation.startDate), 'MMM dd, yyyy')}</strong>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        Review Date: <strong>{format(new Date(onboarding.probation.endDate), 'MMM dd, yyyy')}</strong>
                                    </Typography>
                                    {onboarding.probation.evaluation && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 1 }}>
                                            <Typography variant="caption" fontWeight={700} display="block" gutterBottom color="primary">
                                                EVALUATION
                                            </Typography>
                                            <Typography variant="body2">{onboarding.probation.evaluation}</Typography>
                                        </Box>
                                    )}
                                    {onboarding.probation.feedback && (
                                        <Box sx={{ mt: 1, p: 2, bgcolor: '#f0fdf4', borderRadius: 1 }}>
                                            <Typography variant="caption" fontWeight={700} display="block" gutterBottom color="success.main">
                                                FEEDBACK FROM HR
                                            </Typography>
                                            <Typography variant="body2">{onboarding.probation.feedback}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <ProbationIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                                    <Typography color="text.secondary">
                                        Probation details not available yet.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* ── 5: Verification ── */}
                    {activeTab === 5 && (
                        <>
                            {(onboarding.verifications || []).length === 0 && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No verification checks assigned yet.</Typography>
                                </Box>
                            )}
                            <List disablePadding>
                                {(onboarding.verifications || []).map((v: any) => (
                                    <ListItem key={v.id} divider sx={{ py: 2 }}>
                                        <ListItemIcon>
                                            {v.status === 'Verified'
                                                ? <VerificationIcon color="success" />
                                                : v.status === 'Failed'
                                                    ? <VerificationIcon color="error" />
                                                    : <VerificationIcon color="disabled" />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={v.type}
                                            secondary={v.notes || `Your ${v.type.toLowerCase()} check is ${v.status.toLowerCase()}.`}
                                            primaryTypographyProps={{ fontWeight: 600 }}
                                        />
                                        <Chip
                                            label={v.status}
                                            size="small"
                                            color={
                                                v.status === 'Verified' ? 'success'
                                                : v.status === 'Failed' ? 'error'
                                                : 'warning'
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}

                </Box>
            </Paper>
        </Container>
    );
};

export default MyOnboarding;
