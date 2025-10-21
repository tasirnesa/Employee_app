import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Chip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckInIcon,
  Cancel as CheckOutIcon,
} from '@mui/icons-material';
import { useUser } from '../context/UserContext';
import type { AttendanceRecord } from '../types/interfaces';
import * as attendanceApi from '../api/attendanceApi';

const Attendance: React.FC = () => {
  const { user } = useUser();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<AttendanceRecord> | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [tabValue, setTabValue] = useState(0);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Load attendance records on component mount
  useEffect(() => {
    loadAttendanceRecords();
  }, [user?.id]);

  const loadAttendanceRecords = async () => {
    try {
      if (user?.id) {
        // For demo purposes, we'll use mock data since we don't have a backend
        const mockRecords: AttendanceRecord[] = [
          {
            id: 1,
            employeeId: user.id,
            date: '2025-10-15',
            checkInTime: '09:00',
            checkOutTime: '17:30',
            hoursWorked: 8.5,
            status: 'present',
            notes: 'Regular day'
          },
          {
            id: 2,
            employeeId: user.id,
            date: '2025-10-16',
            checkInTime: '09:15',
            checkOutTime: '17:45',
            hoursWorked: 8.5,
            status: 'late',
            notes: 'Traffic delay'
          },
          {
            id: 3,
            employeeId: user.id,
            date: '2025-10-17',
            checkInTime: '09:00',
            checkOutTime: '13:00',
            hoursWorked: 4,
            status: 'half-day',
            notes: 'Doctor appointment'
          },
          {
            id: 4,
            employeeId: user.id,
            date: '2025-10-18',
            checkInTime: '',
            checkOutTime: '',
            hoursWorked: 0,
            status: 'absent',
            notes: 'Sick leave'
          }
        ];
        setRecords(mockRecords);
        setFilteredRecords(mockRecords);
      }
    } catch (error) {
      showSnackbar('Error loading attendance records', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddRecord = () => {
    setCurrentRecord({
      employeeId: user?.id,
      date: new Date().toISOString().split('T')[0],
      checkInTime: '',
      status: 'present'
    });
    setOpenDialog(true);
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setCurrentRecord(record);
    setOpenDialog(true);
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      // In a real implementation, we would call:
      // await attendanceApi.deleteAttendanceRecord(id);
      
      // For demo, just filter out the record
      setRecords(records.filter(record => record.id !== id));
      setFilteredRecords(filteredRecords.filter(record => record.id !== id));
      showSnackbar('Attendance record deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Error deleting attendance record', 'error');
    }
  };

  const handleSaveRecord = async () => {
    try {
      if (!currentRecord) return;
      
      // Calculate hours worked if both check-in and check-out times are provided
      let hoursWorked = currentRecord.hoursWorked;
      if (currentRecord.checkInTime && currentRecord.checkOutTime) {
        const [checkInHours, checkInMinutes] = currentRecord.checkInTime.split(':').map(Number);
        const [checkOutHours, checkOutMinutes] = currentRecord.checkOutTime.split(':').map(Number);
        
        const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;
        const checkOutTotalMinutes = checkOutHours * 60 + checkOutMinutes;
        
        // Handle case where checkout is next day (if needed)
        hoursWorked = (checkOutTotalMinutes - checkInTotalMinutes) / 60;
        hoursWorked = Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
      }
      
      const recordWithHours = { ...currentRecord, hoursWorked };
      
      if (currentRecord.id) {
        // Update existing record
        // In a real implementation, we would call:
        // const updatedRecord = await attendanceApi.updateAttendanceRecord(currentRecord.id, recordWithHours);
        
        // For demo, just update in state
        setRecords(records.map(record => 
          record.id === currentRecord.id ? { ...record, ...recordWithHours } as AttendanceRecord : record
        ));
        showSnackbar('Attendance record updated successfully', 'success');
      } else {
        // Add new record
        // In a real implementation, we would call:
        // const newRecord = await attendanceApi.addAttendanceRecord(recordWithHours as Omit<AttendanceRecord, 'id'>);
        
        // For demo, just add to state
        const newRecord: AttendanceRecord = {
          id: Date.now(),
          employeeId: recordWithHours.employeeId || 0,
          date: recordWithHours.date || '',
          checkInTime: recordWithHours.checkInTime || '',
          checkOutTime: recordWithHours.checkOutTime,
          hoursWorked: recordWithHours.hoursWorked,
          status: recordWithHours.status as 'present' | 'absent' | 'late' | 'half-day',
          notes: recordWithHours.notes
        };
        setRecords([...records, newRecord]);
        showSnackbar('Attendance record added successfully', 'success');
      }
      
      setOpenDialog(false);
      setCurrentRecord(null);
      // Refresh filtered records
      setFilteredRecords(records);
    } catch (error) {
      showSnackbar('Error saving attendance record', 'error');
    }
  };

  const handleCheckIn = async () => {
    try {
      // In a real implementation, we would call:
      // const record = await attendanceApi.checkIn(user?.id || 0);
      
      // For demo, just add a new record
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      const newRecord: AttendanceRecord = {
        id: Date.now(),
        employeeId: user?.id || 0,
        date: today,
        checkInTime: time,
        status: 'present'
      };
      
      setRecords([...records, newRecord]);
      showSnackbar('Checked in successfully', 'success');
    } catch (error) {
      showSnackbar('Error checking in', 'error');
    }
  };

  const handleCheckOut = async () => {
    try {
      // In a real implementation, we would call:
      // const record = await attendanceApi.checkOut(user?.id || 0);
      
      // For demo, just update the last record
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      
      const lastRecordIndex = records.findIndex(record => record.date === today && !record.checkOutTime);
      if (lastRecordIndex !== -1) {
        const updatedRecords = [...records];
        const checkInTime = updatedRecords[lastRecordIndex].checkInTime;
        const checkOutTime = time;
        
        // Calculate hours worked
        let hoursWorked = 0;
        if (checkInTime && checkOutTime) {
          const [checkInHours, checkInMinutes] = checkInTime.split(':').map(Number);
          const [checkOutHours, checkOutMinutes] = checkOutTime.split(':').map(Number);
          
          const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;
          const checkOutTotalMinutes = checkOutHours * 60 + checkOutMinutes;
          
          // Handle case where checkout is next day (if needed)
          hoursWorked = (checkOutTotalMinutes - checkInTotalMinutes) / 60;
          hoursWorked = Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
        }
        
        updatedRecords[lastRecordIndex] = {
          ...updatedRecords[lastRecordIndex],
          checkOutTime: time,
          hoursWorked: hoursWorked
        };
        setRecords(updatedRecords);
        showSnackbar('Checked out successfully', 'success');
      } else {
        showSnackbar('No check-in record found for today', 'error');
      }
    } catch (error) {
      showSnackbar('Error checking out', 'error');
    }
  };

  const handleCheckInTimeChange = (time: string) => {
    const hoursWorked = calculateHoursWorked(time, currentRecord?.checkOutTime || '');
    setCurrentRecord({ 
      ...currentRecord, 
      checkInTime: time,
      hoursWorked: currentRecord?.checkOutTime ? hoursWorked : currentRecord?.hoursWorked
    });
  };

  const handleCheckOutTimeChange = (time: string) => {
    const hoursWorked = calculateHoursWorked(currentRecord?.checkInTime || '', time);
    setCurrentRecord({ 
      ...currentRecord, 
      checkOutTime: time,
      hoursWorked: currentRecord?.checkInTime ? hoursWorked : currentRecord?.hoursWorked
    });
  };

  const handleFilter = () => {
    let filtered = records;
    
    // Date filter
    if (dateFilter.start && dateFilter.end) {
      filtered = filtered.filter(record => 
        record.date >= dateFilter.start && record.date <= dateFilter.end
      );
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.date.includes(searchTerm) || 
        record.status.includes(searchTerm) ||
        (record.notes && record.notes.includes(searchTerm))
      );
    }
    
    setFilteredRecords(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'half-day': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'late': return 'Late';
      case 'half-day': return 'Half Day';
      default: return status;
    }
  };

  const getTimeTypeLabel = (timeType: string) => {
    switch (timeType) {
      case 'working': return 'Working Time';
      case 'break': return 'Break';
      case 'overnight': return 'Overnight';
      case 'holiday': return 'Holiday Overtime';
      case 'overtime-regular': return 'Regular Overtime';
      case 'overtime-sunday': return 'Sunday Overtime';
      default: return timeType;
    }
  };

  const getTimeTypeColor = (timeType: string) => {
    switch (timeType) {
      case 'working': return 'primary';
      case 'break': return 'info';
      case 'overnight': return 'secondary';
      case 'holiday': return 'error';
      case 'overtime-regular': return 'warning';
      case 'overtime-sunday': return 'success';
      default: return 'default';
    }
  };

  const handleApplyPlanned = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if planned schedule already exists for today
    const todayRecords = records.filter(record => record.date === today);
    
    if (todayRecords.length > 0) {
      showSnackbar('Planned schedule already applied for today', 'error');
      return;
    }
    
    // Create morning shift record
    const morningRecord: AttendanceRecord = {
      id: Date.now(),
      employeeId: user?.id || 0,
      date: today,
      checkInTime: '08:00',
      checkOutTime: '12:00',
      hoursWorked: 4,
      status: 'present',
      timeType: 'working',
      notes: 'Morning shift'
    };
    
    // Create break record
    const breakRecord: AttendanceRecord = {
      id: Date.now() + 1,
      employeeId: user?.id || 0,
      date: today,
      checkInTime: '12:00',
      checkOutTime: '13:00',
      hoursWorked: 1,
      status: 'present',
      timeType: 'break',
      notes: 'Lunch break'
    };
    
    // Create afternoon shift record
    const afternoonRecord: AttendanceRecord = {
      id: Date.now() + 2,
      employeeId: user?.id || 0,
      date: today,
      checkInTime: '13:00',
      checkOutTime: '17:00',
      hoursWorked: 4,
      status: 'present',
      timeType: 'working',
      notes: 'Afternoon shift'
    };
    
    // Add the new records to the existing records
    const newRecords = [morningRecord, breakRecord, afternoonRecord, ...records];
    setRecords(newRecords);
    setFilteredRecords(newRecords);
    showSnackbar('Planned schedule applied successfully', 'success');
  };

  const calculateHoursWorked = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;
    
    const [checkInHours, checkInMinutes] = checkIn.split(':').map(Number);
    const [checkOutHours, checkOutMinutes] = checkOut.split(':').map(Number);
    
    const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;
    const checkOutTotalMinutes = checkOutHours * 60 + checkOutMinutes;
    
    // Handle case where checkout is next day (if needed)
    const hoursWorked = (checkOutTotalMinutes - checkInTotalMinutes) / 60;
    return Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
  };

  useEffect(() => {
    handleFilter();
  }, [dateFilter, searchTerm, records]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendance Management
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Apply Planned Schedule
              </Typography>
              <Button
                variant="contained"
                onClick={handleApplyPlanned}
              >
                Apply Planned
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body1">Morning</Typography>
                <Typography variant="body1">8:00 AM - 12:00 PM</Typography>
                <Chip label="4 hours" color="primary" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body1">Break</Typography>
                <Typography variant="body1">12:00 PM - 1:00 PM</Typography>
                <Chip label="1 hour" color="info" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body1">Afternoon</Typography>
                <Typography variant="body1">1:00 PM - 5:00 PM</Typography>
                <Chip label="4 hours" color="primary" size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body1" fontWeight="bold">Total Working Hours</Typography>
                <Typography variant="body1" fontWeight="bold">8 hours</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Attendance Records</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddRecord}
              >
                Add Record
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              sx={{ width: 200 }}
            />
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              sx={{ width: 200 }}
            />
            <TextField
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 200 }}
            />
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time Type</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.checkInTime}</TableCell>
                    <TableCell>{record.checkOutTime || '-'}</TableCell>
                    <TableCell>{record.hoursWorked || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(record.status)} 
                        color={getStatusColor(record.status) as any} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {record.timeType && (
                        <Chip 
                          label={getTimeTypeLabel(record.timeType)} 
                          color={getTimeTypeColor(record.timeType) as any} 
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>{record.notes || '-'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditRecord(record)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteRecord(record.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentRecord?.id ? 'Edit Attendance Record' : 'Add Attendance Record'}
        </DialogTitle>
        <DialogContent>
          {currentRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={currentRecord.date || ''}
                onChange={(e) => setCurrentRecord({ ...currentRecord, date: e.target.value })}
                fullWidth
              />
              <TextField
                label="Check In Time"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={currentRecord.checkInTime || ''}
                onChange={(e) => handleCheckInTimeChange(e.target.value)}
                fullWidth
              />
              <TextField
                label="Check Out Time"
                type="time"
                InputLabelProps={{ shrink: true }}
                value={currentRecord.checkOutTime || ''}
                onChange={(e) => handleCheckOutTimeChange(e.target.value)}
                fullWidth
              />
              <TextField
                label="Hours Worked"
                type="number"
                value={currentRecord.hoursWorked || ''}
                InputProps={{
                  readOnly: true,
                }}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Time Type</InputLabel>
                <Select
                  value={currentRecord.timeType || 'working'}
                  onChange={(e) => setCurrentRecord({ ...currentRecord, timeType: e.target.value as any })}
                >
                  <MenuItem value="working">Working Time</MenuItem>
                  <MenuItem value="break">Break</MenuItem>
                  <MenuItem value="overnight">Overnight</MenuItem>
                  <MenuItem value="holiday">Holiday Overtime</MenuItem>
                  <MenuItem value="overtime-regular">Regular Overtime</MenuItem>
                  <MenuItem value="overtime-sunday">Sunday Overtime</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={currentRecord.status || 'present'}
                  onChange={(e) => setCurrentRecord({ ...currentRecord, status: e.target.value as any })}
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="half-day">Half Day</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Notes"
                value={currentRecord.notes || ''}
                onChange={(e) => setCurrentRecord({ ...currentRecord, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRecord} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Attendance;