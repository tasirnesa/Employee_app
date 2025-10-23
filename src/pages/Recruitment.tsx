import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  education: string;
  skills: string[];
  status: 'Applied' | 'Screening' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  appliedDate: string;
  resumeUrl?: string;
  interviewDate?: string;
  notes?: string;
}

const Recruitment: React.FC = () => {
  const navigate = useNavigate();
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Check user role for access control
  const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
  const isEmployee = userRole === 'Employee';

  // Fetch candidates data
  const { data: candidates, isLoading: candidatesLoading, error: candidatesError } = useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/recruitment/candidates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hired':
        return 'success';
      case 'Offered':
        return 'info';
      case 'Interview':
        return 'warning';
      case 'Screening':
        return 'secondary';
      case 'Applied':
        return 'default';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Recruitment Management
        </Typography>
        {!isEmployee && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            >
              {viewMode === 'table' ? 'Card View' : 'Table View'}
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setCandidateDialogOpen(true)}
              sx={{ backgroundColor: 'primary.main' }}
            >
              Add Candidate
            </Button>
          </Box>
        )}
      </Box>

      {/* Table View */}
      {viewMode === 'table' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Candidate
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Position
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Experience
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Education
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Skills
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Applied Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {candidates?.map((candidate: any, index: number) => (
                <TableRow
                  key={candidate.id}
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                    '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getInitials(candidate.firstName, candidate.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {candidate.firstName} {candidate.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {candidate.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{candidate.position}</TableCell>
                  <TableCell>{candidate.experience} years</TableCell>
                  <TableCell>{candidate.education}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {candidate.skills.slice(0, 2).map((skill: string, idx: number) => (
                        <Chip key={idx} label={skill} size="small" variant="outlined" />
                      ))}
                      {candidate.skills.length > 2 && (
                        <Chip label={`+${candidate.skills.length - 2}`} size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={candidate.status} 
                      size="small" 
                      color={getStatusColor(candidate.status) as any}
                    />
                  </TableCell>
                  <TableCell>{new Date(candidate.appliedDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {!isEmployee && (
                      <IconButton onClick={handleMenuClick}>
                        <MoreVertIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {candidates?.map((candidate: any) => (
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }} key={candidate.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getInitials(candidate.firstName, candidate.lastName)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {candidate.firstName} {candidate.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.position}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <EmailIcon sx={{ mr: 1, fontSize: 16 }} />
                      {candidate.email}
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                      {candidate.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <WorkIcon sx={{ mr: 1, fontSize: 16 }} />
                      {candidate.experience} years experience
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SchoolIcon sx={{ mr: 1, fontSize: 16 }} />
                      {candidate.education}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} mb={1}>
                      Skills:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {candidate.skills.map((skill: string, idx: number) => (
                        <Chip key={idx} label={skill} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={candidate.status} 
                      size="small" 
                      color={getStatusColor(candidate.status) as any}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Applied: {new Date(candidate.appliedDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
                
                {!isEmployee && (
                  <CardActions>
                    <Button size="small" startIcon={<EditIcon />}>
                      Edit
                    </Button>
                    <Button size="small" color="primary">
                      View Details
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Candidate
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EmailIcon sx={{ mr: 1 }} />
          Send Email
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <WorkIcon sx={{ mr: 1 }} />
          Schedule Interview
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Remove Candidate
        </MenuItem>
      </Menu>

      {/* Add Candidate Dialog */}
      <Dialog open={candidateDialogOpen} onClose={() => setCandidateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Candidate</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Last Name"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Phone"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Position"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Experience (years)"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Education"
                variant="outlined"
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Skills (comma separated)"
                variant="outlined"
                placeholder="React, TypeScript, CSS, JavaScript"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Applied Date"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Status"
                select
                SelectProps={{ native: true }}
                variant="outlined"
              >
                <option value="Applied">Applied</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Offered">Offered</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </TextField>
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                variant="outlined"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCandidateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCandidateDialogOpen(false)}>
            Add Candidate
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Recruitment;
