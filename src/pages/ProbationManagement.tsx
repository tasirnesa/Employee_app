import React from 'react';
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
    Chip,
    LinearProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { format } from 'date-fns';

const ProbationManagement: React.FC = () => {
    const { data: probations = [], isLoading } = useQuery({
        queryKey: ['probations'],
        queryFn: async () => (await api.get('/api/probation')).data,
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#1e293b' }}>
                    Probation Reviews
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Track the probation status of recent hires
                </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Employee Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Feedback</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <LinearProgress sx={{ width: '50%', mx: 'auto' }} />
                                </TableCell>
                            </TableRow>
                        ) : probations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No records found.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : probations.map((row: any) => (
                            <TableRow key={row.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>
                                        {row.onboarding?.employee?.firstName} {row.onboarding?.employee?.lastName}
                                    </Typography>
                                </TableCell>
                                <TableCell>{format(new Date(row.startDate), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>{format(new Date(row.endDate), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={row.status}
                                        size="small"
                                        color={row.status === 'Passed' ? 'success' : row.status === 'Failed' ? 'error' : 'primary'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{row.feedback || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default ProbationManagement;
