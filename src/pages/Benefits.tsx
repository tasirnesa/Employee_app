import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { Benefit, Perk } from '../types/interfaces';
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


const Benefits: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'benefits' | 'perks'>('benefits');
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false);
  const [perkDialogOpen, setPerkDialogOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [selectedPerk, setSelectedPerk] = useState<Perk | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Check user role for access control
  const userRole = JSON.parse(localStorage.getItem('userProfile') || '{}').role;
  const isEmployee = userRole === 'Employee';

  // Form states
  const [benefitForm, setBenefitForm] = useState({
    employeeId: '',
    benefitType: '',
    provider: '',
    coverage: '',
    monthlyCost: '',
    employeeContribution: '',
    companyContribution: '',
    effectiveDate: '',
    expiryDate: '',
    notes: ''
  });

  const [perkForm, setPerkForm] = useState({
    employeeId: '',
    perkType: '',
    description: '',
    value: '',
    frequency: '',
    startDate: '',
    endDate: ''
  });

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

  // Fetch users for dropdown (benefits reference User model, not Employee model)
  const { data: employees } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/users', {
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

  // Form handlers
  const handleBenefitFormChange = (field: string, value: string) => {
    setBenefitForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePerkFormChange = (field: string, value: string) => {
    setPerkForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Mutations
  const createBenefitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/benefits/benefits', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefits'] });
      setBenefitDialogOpen(false);
      setBenefitForm({
        employeeId: '',
        benefitType: '',
        provider: '',
        coverage: '',
        monthlyCost: '',
        employeeContribution: '',
        companyContribution: '',
        effectiveDate: '',
        expiryDate: '',
        notes: ''
      });
    },
    onError: (error: any) => {
      console.error('Error creating benefit:', error);
      alert('Error creating benefit: ' + (error?.response?.data?.error || error.message));
    }
  });

  const createPerkMutation = useMutation({
    mutationFn: async (payload: any) => {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/benefits/perks', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perks'] });
      setPerkDialogOpen(false);
      setPerkForm({
        employeeId: '',
        perkType: '',
        description: '',
        value: '',
        frequency: '',
        startDate: '',
        endDate: ''
      });
    },
    onError: (error: any) => {
      console.error('Error creating perk:', error);
      alert('Error creating perk: ' + (error?.response?.data?.error || error.message));
    }
  });

  // Submit handlers
  const handleSubmitBenefit = () => {
    if (!benefitForm.employeeId || !benefitForm.benefitType || !benefitForm.provider || !benefitForm.effectiveDate) {
      alert('Please fill Employee, Benefit Type, Provider and Effective Date');
      return;
    }
    const payload = {
      employeeId: parseInt(benefitForm.employeeId),
      benefitType: benefitForm.benefitType,
      provider: benefitForm.provider,
      coverage: benefitForm.coverage,
      monthlyCost: parseFloat(benefitForm.monthlyCost || '0') || 0,
      employeeContribution: parseFloat(benefitForm.employeeContribution || '0') || 0,
      companyContribution: parseFloat(benefitForm.companyContribution || '0') || 0,
      effectiveDate: benefitForm.effectiveDate,
      expiryDate: benefitForm.expiryDate || null,
      notes: benefitForm.notes,
      // status is optional; backend defaults to 'Active'
    };
    createBenefitMutation.mutate(payload);
  };

  const handleSubmitPerk = () => {
    if (!perkForm.employeeId || !perkForm.perkType || !perkForm.startDate) {
      alert('Please fill Employee, Perk Type and Start Date');
      return;
    }
    const payload = {
      employeeId: parseInt(perkForm.employeeId),
      perkType: perkForm.perkType,
      description: perkForm.description,
      value: parseFloat(perkForm.value || '0') || 0,
      frequency: perkForm.frequency,
      startDate: perkForm.startDate,
      endDate: perkForm.endDate || null,
      // status optional; backend defaults to 'Active'
    };
    createPerkMutation.mutate(payload);
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
                value={benefitForm.employeeId}
                onChange={(e) => handleBenefitFormChange('employeeId', e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees?.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Benefit Type"
                select
                SelectProps={{ native: true }}
                variant="outlined"
                value={benefitForm.benefitType}
                onChange={(e) => handleBenefitFormChange('benefitType', e.target.value)}
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
                value={benefitForm.provider}
                onChange={(e) => handleBenefitFormChange('provider', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Coverage"
                variant="outlined"
                value={benefitForm.coverage}
                onChange={(e) => handleBenefitFormChange('coverage', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Monthly Cost"
                type="number"
                variant="outlined"
                value={benefitForm.monthlyCost}
                onChange={(e) => handleBenefitFormChange('monthlyCost', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Employee Contribution"
                type="number"
                variant="outlined"
                value={benefitForm.employeeContribution}
                onChange={(e) => handleBenefitFormChange('employeeContribution', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Company Contribution"
                type="number"
                variant="outlined"
                value={benefitForm.companyContribution}
                onChange={(e) => handleBenefitFormChange('companyContribution', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Effective Date"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={benefitForm.effectiveDate}
                onChange={(e) => handleBenefitFormChange('effectiveDate', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={benefitForm.expiryDate}
                onChange={(e) => handleBenefitFormChange('expiryDate', e.target.value)}
              />
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                variant="outlined"
                value={benefitForm.notes}
                onChange={(e) => handleBenefitFormChange('notes', e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBenefitDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitBenefit}
            disabled={createBenefitMutation.isPending}
          >
            {createBenefitMutation.isPending ? 'Adding...' : 'Add Benefit'}
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
                value={perkForm.employeeId}
                onChange={(e) => handlePerkFormChange('employeeId', e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees?.map((employee: any) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </TextField>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Perk Type"
                select
                SelectProps={{ native: true }}
                variant="outlined"
                value={perkForm.perkType}
                onChange={(e) => handlePerkFormChange('perkType', e.target.value)}
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
                value={perkForm.description}
                onChange={(e) => handlePerkFormChange('description', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Value"
                type="number"
                variant="outlined"
                value={perkForm.value}
                onChange={(e) => handlePerkFormChange('value', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="Frequency"
                select
                SelectProps={{ native: true }}
                variant="outlined"
                value={perkForm.frequency}
                onChange={(e) => handlePerkFormChange('frequency', e.target.value)}
              >
                <option value="">Select Frequency</option>
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
                value={perkForm.startDate}
                onChange={(e) => handlePerkFormChange('startDate', e.target.value)}
              />
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={perkForm.endDate}
                onChange={(e) => handlePerkFormChange('endDate', e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPerkDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitPerk}
            disabled={createPerkMutation.isPending}
          >
            {createPerkMutation.isPending ? 'Adding...' : 'Add Perk'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Benefits;
