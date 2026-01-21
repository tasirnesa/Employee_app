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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckInIcon,
  Cancel as CheckOutIcon,
  EventBusy as EventBusyIcon,
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
  const [loading, setLoading] = useState(true);
  // Track days that have planned schedules applied
  const [daysWithPlannedSchedule, setDaysWithPlannedSchedule] = useState<Set<string>>(new Set());
  // Track current leave status
  const [currentLeaveStatus, setCurrentLeaveStatus] = useState<any>(null);
  const [isOnLeaveToday, setIsOnLeaveToday] = useState(false);

  // Load attendance records on component mount
  useEffect(() => {
    loadAttendanceRecords();
  }, [user?.id]);

  const loadAttendanceRecords = async () => {
    try {
      if (user?.id) {
        setLoading(true);
        const userRecords = await attendanceApi.getAttendanceRecords(user.id);
        setRecords(userRecords);
        setFilteredRecords(userRecords);

        // Update the set of days with planned schedules
        const plannedDays = new Set<string>();
        userRecords.forEach(record => {
          // Check if this is a planned schedule record (morning shift)
          // More robust check that handles different time formats
          if (record.checkInTime && record.checkInTime.startsWith('08:00') &&
            record.checkOutTime && record.checkOutTime.startsWith('12:00') &&
            record.notes === 'Morning shift') {
            plannedDays.add(record.date);
          }
        });
        setDaysWithPlannedSchedule(plannedDays);
      }
    } catch (error) {
      showSnackbar('Error loading attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is on leave today
  useEffect(() => {
    const checkLeaveStatus = async () => {
      if (!user?.id) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await attendanceApi.getLeaveCalendar(user.id);

        // Check if any leave includes today
        const leaveToday = response.find((leave: any) => {
          const startDate = new Date(leave.startDate).toISOString().split('T')[0];
          const endDate = new Date(leave.endDate).toISOString().split('T')[0];
          return today >= startDate && today <= endDate;
        });

        if (leaveToday) {
          setCurrentLeaveStatus(leaveToday);
          setIsOnLeaveToday(true);
        } else {
          setCurrentLeaveStatus(null);
          setIsOnLeaveToday(false);
        }
      } catch (error) {
        console.error('Error checking leave status:', error);
      }
    };

    checkLeaveStatus();
  }, [user?.id]);

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
      await attendanceApi.deleteAttendanceRecord(id);
      setRecords(records.filter(record => record.id !== id));
      setFilteredRecords(filteredRecords.filter(record => record.id !== id));

      // If this was a planned schedule record, update the set
      const deletedRecord = records.find(record => record.id === id);
      if (deletedRecord &&
        deletedRecord.checkInTime && deletedRecord.checkInTime.startsWith('08:00') &&
        deletedRecord.checkOutTime && deletedRecord.checkOutTime.startsWith('12:00') &&
        deletedRecord.notes === 'Morning shift') {
        const updatedDays = new Set(daysWithPlannedSchedule);
        updatedDays.delete(deletedRecord.date);
        setDaysWithPlannedSchedule(updatedDays);
      }

      showSnackbar('Attendance record deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Error deleting attendance record', 'error');
    }
  };

  const handleSaveRecord = async () => {
    try {
      if (!currentRecord || !user?.id) return;

      let savedRecord: AttendanceRecord;

      if (currentRecord.id) {
        // Update existing record
        savedRecord = await attendanceApi.updateAttendanceRecord(currentRecord.id, currentRecord);
        setRecords(records.map(record =>
          record.id === currentRecord.id ? savedRecord : record
        ));
        showSnackbar('Attendance record updated successfully', 'success');
      } else {
        // Add new record
        savedRecord = await attendanceApi.addAttendanceRecord(currentRecord as Omit<AttendanceRecord, 'id'>);
        setRecords([savedRecord, ...records]);
        showSnackbar('Attendance record added successfully', 'success');

        // If this was a planned schedule record, update the set
        if (savedRecord.checkInTime && savedRecord.checkInTime.startsWith('08:00') &&
          savedRecord.checkOutTime && savedRecord.checkOutTime.startsWith('12:00') &&
          savedRecord.notes === 'Morning shift') {
          const updatedDays = new Set(daysWithPlannedSchedule);
          updatedDays.add(savedRecord.date);
          setDaysWithPlannedSchedule(updatedDays);
        }
      }

      setOpenDialog(false);
      setCurrentRecord(null);
      // Refresh filtered records
      setFilteredRecords(records);
    } catch (error: any) {
      // Check if error is due to leave
      if (error.response?.data?.onLeave) {
        showSnackbar(error.response.data.error, 'error');
        setIsOnLeaveToday(true);
        setCurrentLeaveStatus(error.response.data.leaveDetails);
      } else {
        showSnackbar('Error saving attendance record', 'error');
      }
    }
  };

  const handleCheckIn = async () => {
    try {
      if (!user?.id) return;
      const record = await attendanceApi.checkIn(user.id);
      setRecords([record, ...records]);
      showSnackbar('Checked in successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Error checking in', 'error');
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!user?.id) return;
      const record = await attendanceApi.checkOut(user.id);

      // Update the record in the list
      setRecords(records.map(r => r.id === record.id ? record : r));
      showSnackbar('Checked out successfully', 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.error || 'Error checking out', 'error');
    }
  };

  const handleApplyPlanned = async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];

    // Check if planned schedule already exists for today
    if (daysWithPlannedSchedule.has(today)) {
      showSnackbar('Planned schedule already applied for today', 'error');
      return;
    }

    try {
      // Create morning shift record
      const morningRecord = await attendanceApi.addAttendanceRecord({
        employeeId: user.id,
        date: today,
        checkInTime: '08:00',
        checkOutTime: '12:00',
        hoursWorked: 4,
        status: 'present',
        timeType: 'working',
        notes: 'Morning shift'
      });

      // Create break record
      const breakRecord = await attendanceApi.addAttendanceRecord({
        employeeId: user.id,
        date: today,
        checkInTime: '12:00',
        checkOutTime: '13:00',
        hoursWorked: 1,
        status: 'present',
        timeType: 'break',
        notes: 'Lunch break'
      });

      // Create afternoon shift record
      const afternoonRecord = await attendanceApi.addAttendanceRecord({
        employeeId: user.id,
        date: today,
        checkInTime: '13:00',
        checkOutTime: '17:00',
        hoursWorked: 4,
        status: 'present',
        timeType: 'working',
        notes: 'Afternoon shift'
      });

      // Add the new records to the existing records
      const newRecords = [morningRecord, breakRecord, afternoonRecord, ...records];
      setRecords(newRecords);
      setFilteredRecords(newRecords);

      // Update the set of days with planned schedules
      const updatedDays = new Set(daysWithPlannedSchedule);
      updatedDays.add(today);
      setDaysWithPlannedSchedule(updatedDays);

      showSnackbar('Planned schedule applied successfully', 'success');
    } catch (error) {
      showSnackbar('Error applying planned schedule', 'error');
    }
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

  useEffect(() => {
    handleFilter();
  }, [dateFilter, searchTerm, records]);

  // Check if a specific date has a planned schedule
  const hasPlannedSchedule = (date: string) => {
    return daysWithPlannedSchedule.has(date);
  };

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
                disabled={loading}
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

      {/* Leave Status Indicator */}
      {isOnLeaveToday && currentLeaveStatus && (
        <Alert
          severity="info"
          icon={<EventBusyIcon />}
          sx={{ mb: 3 }}
        >
          <Typography variant="body1" fontWeight="bold">
            You are currently on {currentLeaveStatus.leaveType?.name} leave
          </Typography>
          <Typography variant="body2">
            From {new Date(currentLeaveStatus.startDate).toLocaleDateString()} to {new Date(currentLeaveStatus.endDate).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Attendance submission is disabled during your leave period.
          </Typography>
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Attendance Records</Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddRecord}
                disabled={loading || isOnLeaveToday}
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

          {loading ? (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
              Loading attendance records...
            </Typography>
          ) : (
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
                        <IconButton onClick={() => handleEditRecord(record)} size="small" disabled={loading}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteRecord(record.id)} size="small" disabled={loading}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentRecord?.id ? 'Edit Attendance Record' : 'Add Attendance Record'}
        </DialogTitle>
        <DialogContent>
          {currentRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {currentRecord.date && hasPlannedSchedule(currentRecord.date) && !currentRecord.id && (
                <Alert severity="info">
                  This day already has a planned schedule applied. You can only edit existing records.
                </Alert>
              )}
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
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleSaveRecord}
            variant="contained"
            disabled={loading || (currentRecord && !currentRecord.id && currentRecord.date ? hasPlannedSchedule(currentRecord.date) : false)}
          >
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