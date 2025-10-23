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
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface Benefit {
  id: string;
  employeeId: string;
  employeeName: string;
  benefitType: 'Health Insurance' | 'Dental' | 'Vision' | 'Life Insurance' | 'Retirement' | 'Gym Membership' | 'Education' | 'Transportation' | 'Meal Allowance';
  provider: string;
  coverage: string;
  monthlyCost: number;
  employeeContribution: number;
  companyContribution: number;
  effectiveDate: string;
  expiryDate?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Expired';
  notes?: string;
}

interface Perk {
  id: string;
  employeeId: string;
  employeeName: string;
  perkType: 'Flexible Hours' | 'Remote Work' | 'Professional Development' | 'Wellness Program' | 'Company Events' | 'Free Meals' | 'Parking' | 'Childcare';
  description: string;
  value: number;
  frequency: 'Monthly' | 'Quarterly' | 'Annually' | 'One-time';
  status: 'Active' | 'Inactive' | 'Pending';
  startDate: string;
  endDate?: string;
}

const Benefits: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'benefits' | 'perks'>('benefits');
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false);
  const [perkDialogOpen, setPerkDialogOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Check user role for access control
  const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
  const isEmployee = userRole === 'Employee';

  // Fetch benefits data
  const { data: benefits, isLoading: benefitsLoading, error: benefitsError } = useQuery({
    queryKey: ['benefits'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/benefits/benefits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
  });

  // Fetch perks data
  const { data: perks, isLoading: perksLoading, error: perksError } = useQuery({
    queryKey: ['perks'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/benefits/perks', {
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
      case 'Active':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Inactive':
        return 'error';
      case 'Expired':
        return 'default';
      default:
        return 'default';
    }
  };

  const getBenefitIcon = (benefitType: string) => {
    switch (benefitType) {
      case 'Health Insurance':
      case 'Dental':
      case 'Vision':
        return <HealthAndSafetyIcon />;
      case 'Life Insurance':
        return <LocalHospitalIcon />;
      case 'Retirement':
        return <AttachMoneyIcon />;
      case 'Gym Membership':
        return <FitnessCenterIcon />;
      case 'Education':
        return <SchoolIcon />;
      default:
        return <CardGiftcardIcon />;
    }
  };

  const getPerkIcon = (perkType: string) => {
    switch (perkType) {
      case 'Flexible Hours':
      case 'Remote Work':
        return <WorkIcon />;
      case 'Professional Development':
        return <SchoolIcon />;
      case 'Wellness Program':
        return <FitnessCenterIcon />;
      default:
        return <CardGiftcardIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Benefits & Perks Management
        </Typography>
        {!isEmployee && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<HealthAndSafetyIcon />}
              onClick={() => setBenefitDialogOpen(true)}
              sx={{ backgroundColor: 'primary.main' }}
            >
              Add Benefit
            </Button>
            <Button
              variant="contained"
              startIcon={<CardGiftcardIcon />}
              onClick={() => setPerkDialogOpen(true)}
              sx={{ backgroundColor: 'secondary.main' }}
            >
              Add Perk
            </Button>
          </Box>
        )}
      </Box>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Button
          variant={activeTab === 'benefits' ? 'contained' : 'text'}
          onClick={() => setActiveTab('benefits')}
          sx={{ mr: 2 }}
        >
          Benefits
        </Button>
        <Button
          variant={activeTab === 'perks' ? 'contained' : 'text'}
          onClick={() => setActiveTab('perks')}
        >
          Perks
        </Button>
      </Box>

      {/* Benefits Table */}
      {activeTab === 'benefits' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Employee
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Benefit Type
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Provider
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Coverage
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Monthly Cost
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Employee Contribution
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Company Contribution
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {benefits?.map((benefit: any, index: number) => (
                <TableRow
                  key={benefit.id}
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                    '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {benefit.employee?.fullName || 'Unknown Employee'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {benefit.employee?.userName || `ID: ${benefit.employeeId}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getBenefitIcon(benefit.benefitType)}
                      {benefit.benefitType}
                    </Box>
                  </TableCell>
                  <TableCell>{benefit.provider}</TableCell>
                  <TableCell>{benefit.coverage}</TableCell>
                  <TableCell>{formatCurrency(benefit.monthlyCost)}</TableCell>
                  <TableCell>{formatCurrency(benefit.employeeContribution)}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600} color="primary">
                      {formatCurrency(benefit.companyContribution)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={benefit.status} 
                      size="small" 
                      color={getStatusColor(benefit.status) as any}
                    />
                  </TableCell>
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

      {/* Perks Table */}
      {activeTab === 'perks' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Employee
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Perk Type
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Description
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Value
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Frequency
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Start Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {perks?.map((perk: any, index: number) => (
                <TableRow
                  key={perk.id}
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff',
                    '&:hover': { backgroundColor: 'rgba(2, 136, 209, 0.04)' }
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {perk.employee?.fullName || 'Unknown Employee'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {perk.employee?.userName || `ID: ${perk.employeeId}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPerkIcon(perk.perkType)}
                      {perk.perkType}
                    </Box>
                  </TableCell>
                  <TableCell>{perk.description}</TableCell>
                  <TableCell>
                    {perk.value > 0 ? formatCurrency(perk.value) : 'N/A'}
                  </TableCell>
                  <TableCell>{perk.frequency}</TableCell>
                  <TableCell>
                    <Chip 
                      label={perk.status} 
                      size="small" 
                      color={getStatusColor(perk.status) as any}
                    />
                  </TableCell>
                  <TableCell>{new Date(perk.startDate).toLocaleDateString()}</TableCell>
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

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <HealthAndSafetyIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Remove
        </MenuItem>
      </Menu>

      {/* Add Benefit Dialog */}
      <Dialog open={benefitDialogOpen} onClose={() => setBenefitDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Benefit</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Employee"
                select
                SelectProps={{ native: true }}
                variant="outlined"
              >
                <option value="">Select Employee</option>
                <option value="EMP001">John Doe</option>
                <option value="EMP002">Jane Smith</option>
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Benefit Type"
                select
                SelectProps={{ native: true }}
                variant="outlined"
              >
                <option value="">Select Benefit Type</option>
                <option value="Health Insurance">Health Insurance</option>
                <option value="Dental">Dental</option>
                <option value="Vision">Vision</option>
                <option value="Life Insurance">Life Insurance</option>
                <option value="Retirement">Retirement</option>
                <option value="Gym Membership">Gym Membership</option>
                <option value="Education">Education</option>
                <option value="Transportation">Transportation</option>
                <option value="Meal Allowance">Meal Allowance</option>
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Provider"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Coverage"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Monthly Cost"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Employee Contribution"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Company Contribution"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Effective Date"
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
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
          <Button onClick={() => setBenefitDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setBenefitDialogOpen(false)}>
            Add Benefit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Perk Dialog */}
      <Dialog open={perkDialogOpen} onClose={() => setPerkDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Perk</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Employee"
                select
                SelectProps={{ native: true }}
                variant="outlined"
              >
                <option value="">Select Employee</option>
                <option value="EMP001">John Doe</option>
                <option value="EMP002">Jane Smith</option>
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Perk Type"
                select
                SelectProps={{ native: true }}
                variant="outlined"
              >
                <option value="">Select Perk Type</option>
                <option value="Flexible Hours">Flexible Hours</option>
                <option value="Remote Work">Remote Work</option>
                <option value="Professional Development">Professional Development</option>
                <option value="Wellness Program">Wellness Program</option>
                <option value="Company Events">Company Events</option>
                <option value="Free Meals">Free Meals</option>
                <option value="Parking">Parking</option>
                <option value="Childcare">Childcare</option>
              </TextField>
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Value"
                type="number"
                variant="outlined"
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Frequency"
                select
                SelectProps={{ native: true }}
                variant="outlined"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annually">Annually</option>
                <option value="One-time">One-time</option>
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Start Date"
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
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </TextField>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerkDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setPerkDialogOpen(false)}>
            Add Perk
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Benefits;
