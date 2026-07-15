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
            return await api.patch(`/api/onboarding/documents/${docId}/upload`, formData);
        },
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
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab icon={<TaskIcon />} label="Tasks" />
                    <Tab icon={<DocIcon />} label="Documents" />
                    <Tab icon={<AssetIcon />} label="Assets" />
                    <Tab icon={<ProbationIcon />} label="Probation" />
                    <Tab icon={<VerificationIcon />} label="Verification" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {activeTab === 0 && (
                        <List>
                            {onboarding.tasks.map((task: any) => (
                                <ListItem key={task.id} divider sx={{ py: 2 }}>
                                    <ListItemIcon>
                                        {task.status === 'Completed' ? <DoneIcon color="success" /> : <PendingIcon color="disabled" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={task.title}
                                        secondary={task.description}
                                        primaryTypographyProps={{ fontWeight: 600 }}
                                    />
                                    <Chip label={task.status} size="small" variant="outlined" />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {activeTab === 1 && (
                        <List>
                            {onboarding.documents.map((doc: any) => (
                                <ListItem key={doc.id} divider sx={{ py: 2 }}>
                                    <ListItemIcon>
                                        {doc.status === 'Verified' ? <DoneIcon color="success" /> : <DocIcon />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={doc.title}
                                        secondary={`Status: ${doc.status}`}
                                        primaryTypographyProps={{ fontWeight: 600 }}
                                    />
                                    <ListItemSecondaryAction>
                                        {doc.status !== 'Verified' && (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                component="label"
                                                startIcon={<UploadIcon />}
                                            >
                                                {doc.status === 'Uploaded' ? 'Update' : 'Upload'}
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
                    )}

                    {activeTab === 2 && (
                        <List>
                            {onboarding.employee.assets.map((asset: any) => (
                                <ListItem key={asset.id} divider sx={{ py: 2 }}>
                                    <ListItemIcon><AssetIcon color="primary" /></ListItemIcon>
                                    <ListItemText
                                        primary={asset.assetType}
                                        secondary={`${asset.brand || ''} • SN: ${asset.serialNumber || 'N/A'}`}
                                        primaryTypographyProps={{ fontWeight: 600 }}
                                    />
                                    <Chip label={asset.status} size="small" color="success" />
                                </ListItem>
                            ))}
                            {onboarding.employee.assets.length === 0 && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No assets assigned yet.</Typography>
                                </Box>
                            )}
                        </List>
                    )}

                    {activeTab === 3 && (
                        <Box sx={{ py: 2 }}>
                            {onboarding.probation ? (
                                <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <Typography variant="h6" gutterBottom>Probation Period</Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Start: {format(new Date(onboarding.probation.startDate), 'MMM dd, yyyy')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Review Date: {format(new Date(onboarding.probation.endDate), 'MMM dd, yyyy')}
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body2" fontWeight={600}>Status:</Typography>
                                        <Chip label={onboarding.probation.status} color="primary" size="small" sx={{ mt: 0.5 }} />
                                    </Box>
                                    {onboarding.probation.feedback && (
                                        <Box sx={{ mt: 3, p: 2, bgcolor: '#f1f5f9', borderRadius: 1 }}>
                                            <Typography variant="caption" fontWeight={700} display="block" gutterBottom color="primary">FEEDBACK</Typography>
                                            <Typography variant="body2">{onboarding.probation.feedback}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Typography color="text.secondary" align="center">Probation details not available.</Typography>
                            )}
                        </Box>
                    )}

                    {activeTab === 4 && (
                        <List>
                            {(onboarding.verifications || []).map((v: any) => (
                                <ListItem key={v.id} divider sx={{ py: 2 }}>
                                    <ListItemIcon>
                                        {v.status === 'Verified' ? <VerificationIcon color="success" /> : <VerificationIcon color="disabled" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={v.type}
                                        secondary={v.notes || `Your verification is ${v.status.toLowerCase()}.`}
                                        primaryTypographyProps={{ fontWeight: 600 }}
                                    />
                                    <Chip
                                        label={v.status}
                                        size="small"
                                        color={v.status === 'Verified' ? 'success' : v.status === 'Failed' ? 'error' : 'warning'}
                                    />
                                </ListItem>
                            ))}
                            {(onboarding.verifications || []).length === 0 && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No verification tasks assigned.</Typography>
                                </Box>
                            )}
                        </List>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default MyOnboarding;
