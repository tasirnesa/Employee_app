import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import {
  Box,
  Card, CardContent, Typography, Divider, IconButton, List, ListItem, ListItemText,
  Chip, Button, TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, Slider, Select, MenuItem, InputLabel, FormControl, Tabs, Tab,
  Autocomplete,
} from '@mui/material';
import {
  Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon, Assignment as AssignmentIcon,
  BarChart as BarChartIcon, Add as AddIcon, Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import type { Goal } from '../types/interfaces';

interface Employee { id: number; fullName: string; departmentId?: number | null; }
interface Department { id: number; name: string; }

const GoalsPage: React.FC = () => {
  const currentUser = JSON.parse(localStorage.getItem('userProfile') || '{}');

  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tabIndex, setTabIndex] = useState(0);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newObjective, setNewObjective] = useState('');
  const [newKeyResults, setNewKeyResults] = useState<Array<{ title: string; progress?: number }>>([{ title: '', progress: 0 }]);
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignedUser, setNewAssignedUser] = useState<Employee | null>(null);
  const [newAssignedDept, setNewAssignedDept] = useState<number | ''>('');
  const [formError, setFormError] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [progressKeyIndex, setProgressKeyIndex] = useState<number | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [editObjective, setEditObjective] = useState('');
  const [editKeyResults, setEditKeyResults] = useState<Array<{ title: string; progress?: number }>>([{ title: '', progress: 0 }]);
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');
  const [editStatus, setEditStatus] = useState('Active');
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editCategory, setEditCategory] = useState('General');
  const [editAssignedUser, setEditAssignedUser] = useState<Employee | null>(null);
  const [editAssignedDept, setEditAssignedDept] = useState<number | ''>('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsGoal, setDetailsGoal] = useState<Goal | null>(null);
  const [detailsLogs, setDetailsLogs] = useState<Array<{ id: number; keyIndex: number; progress: number; notedAt: string; notedBy: number }>>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [goalsRes, empRes, deptRes] = await Promise.all([
          api.get('/api/goals'),
          api.get('/api/employees'),
          api.get('/api/departments'),
        ]);
        setGoals(goalsRes.data);
        setEmployees(empRes.data.map((e: any) => ({ id: e.userId || e.id, fullName: e.fullName, departmentId: e.departmentId })));
        setDepartments(deptRes.data);
      } catch (err) {
        setError('Failed to fetch data. Please check your authentication or try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Tab filtering
  const filteredGoals = goals.filter((g: any) => {
    if (tabIndex === 0) return true; // All Goals (created by me)
    if (tabIndex === 1) return g.assignedToUserId === currentUser.id; // Assigned to Me
    if (tabIndex === 2) {
      const userDept = currentUser.departmentId;
      return userDept && g.assignedToDeptId === userDept;
    }
    return true;
  });

  const totalGoals = filteredGoals.length;
  const activeGoals = filteredGoals.filter(o => o.status === 'Active' || o.status === 'In Progress').length;
  const completedGoals = filteredGoals.filter(o => o.status === 'Completed').length;
  const avgProgress = filteredGoals.length
    ? Math.round(filteredGoals.reduce((sum, o) => sum + (o.progress ?? 0), 0) / filteredGoals.length) : 0;

  const isDateValid = (duedate: string | undefined) => {
    if (!duedate) return true;
    const due = new Date(duedate); const today = new Date(); today.setHours(0,0,0,0);
    return due >= today;
  };

  const getScheduleStatus = (dueDateStr?: string, progress?: number) => {
    const pct = Number(progress ?? 0);
    if (!dueDateStr) return { label: 'No Due Date', color: 'default' as const };
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dueDateStr); due.setHours(0,0,0,0);
    const daysLeft = Math.floor((due.getTime() - today.getTime()) / 86400000);
    if (daysLeft < 0) return pct >= 100 ? { label: 'Completed (Overdue)', color: 'success' as const } : { label: 'Overdue', color: 'error' as const };
    if (daysLeft <= 3 && pct < 90) return { label: 'At Risk', color: 'warning' as const };
    if (daysLeft <= 7 && pct < 80) return { label: 'At Risk', color: 'warning' as const };
    if (daysLeft <= 14 && pct < 50) return { label: 'At Risk', color: 'warning' as const };
    return { label: 'On Track', color: 'info' as const };
  };

  const getRequiredDailyProgressSentence = (dueDateStr?: string, progress?: number) => {
    const pct = Number(progress ?? 0);
    if (!dueDateStr) return 'No due date set.';
    const today = new Date(); today.setHours(0,0,0,0);
    const due = new Date(dueDateStr); due.setHours(0,0,0,0);
    const daysLeft = Math.floor((due.getTime() - today.getTime()) / 86400000);
    if (pct >= 100) return 'Objective completed.';
    if (daysLeft <= 0) return `Overdue — remaining ${(100 - pct).toFixed(0)}%.`;
    return `Need ${((100 - pct) / daysLeft).toFixed(1)}%/day for ${daysLeft} day(s) to reach 100%.`;
  };

  const openDetails = async (gid: number) => {
    const goal = goals.find(g => g.gid === gid) || null;
    setDetailsGoal(goal);
    try {
      const res = await api.get(`/api/key-result-progress/${gid}`);
      setDetailsLogs(res.data.logs || []);
    } catch { setDetailsLogs([]); }
    setDetailsOpen(true);
  };

  const handleDelete = (gid: number) => {
    setDeleteGoal(goals.find(g => g.gid === gid) || null);
    setDeleteDialogOpen(true);
    if (editIndex === gid) setEditIndex(null);
  };

  const handleEdit = (gid: number) => {
    const goal = goals.find(g => g.gid === gid);
    if (!goal) return;
    setEditGoal(goal);
    setEditObjective(goal.objective || '');
    const raw = Array.isArray(goal.keyResult) ? goal.keyResult : (goal.keyResult ? [goal.keyResult] : []);
    setEditKeyResults(raw.map((kr: any) => ({
      title: typeof kr === 'string' ? kr : kr?.title || '',
      progress: typeof kr === 'object' && kr?.progress != null ? kr.progress : 0,
    })).length ? raw.map((kr: any) => ({ title: typeof kr === 'string' ? kr : kr?.title || '', progress: typeof kr === 'object' && kr?.progress != null ? kr.progress : 0 })) : [{ title: '', progress: 0 }]);
    setEditDueDate(goal.duedate ? new Date(goal.duedate).toISOString().slice(0, 10) : '');
    setEditPriority((goal as any).priority || 'Medium');
    setEditStatus(goal.status || 'Active');
    setEditProgress(goal.progress ?? 0);
    setEditCategory((goal as any).category || 'General');
    const assignedUid = (goal as any).assignedToUserId;
    setEditAssignedUser(assignedUid ? (employees.find(e => e.id === assignedUid) || null) : null);
    setEditAssignedDept((goal as any).assignedToDeptId || '');
    setEditDialogOpen(true);
  };

  const handleUpdateProgress = (gid: number, keyIndex: number) => {
    const goal = goals.find(g => g.gid === gid);
    if (!goal || !isDateValid(goal.duedate)) return;
    setProgressGoal(goal); setProgressKeyIndex(keyIndex);
    const kr = Array.isArray(goal.keyResult) ? goal.keyResult[keyIndex] : goal.keyResult;
    setProgressValue(typeof kr === 'object' && kr?.progress != null ? kr.progress : 0);
    setProgressDialogOpen(true);
  };

  const saveProgress = async () => {
    if (!progressGoal || progressKeyIndex === null) return;
    try {
      await api.post('/api/key-result-progress', {
        goalId: progressGoal.gid, keyIndex: progressKeyIndex, progress: progressValue, notedBy: currentUser.id,
      });
      setGoals(prev => prev.map(g => g.gid === progressGoal.gid ? {
        ...g,
        keyResult: Array.isArray(g.keyResult)
          ? g.keyResult.map((kr, idx) => idx === progressKeyIndex
              ? (typeof kr === 'object' && kr !== null ? { ...kr, progress: progressValue } : { title: kr, progress: progressValue })
              : kr)
          : [{ title: '', progress: progressValue }],
      } : g));
      setProgressDialogOpen(false);
    } catch { setError('Failed to update progress.'); }
  };

  const saveEdit = async () => {
    if (!editGoal) return;
    try {
      const payload = {
        objective: editObjective,
        keyResult: editKeyResults.filter(kr => kr.title.trim()),
        priority: editPriority, status: editStatus, duedate: editDueDate, category: editCategory,
        assignedToUserId: editAssignedUser?.id || null,
        assignedToDeptId: editAssignedDept || null,
      };
      const res = await api.put(`/api/goals/${editGoal.gid}`, payload);
      setGoals(prev => prev.map(g => g.gid === editGoal.gid ? { ...g, ...res.data } : g));
      setEditDialogOpen(false);
    } catch { setError('Failed to update goal.'); }
  };

  const confirmDelete = async () => {
    if (!deleteGoal) return;
    try {
      await api.delete(`/api/goals/${deleteGoal.gid}`);
      setGoals(prev => prev.filter(g => g.gid !== deleteGoal.gid));
      setDeleteDialogOpen(false);
    } catch { setError('Failed to delete goal.'); }
  };

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjective || !newDueDate || newKeyResults.some(kr => !kr.title.trim())) {
      setFormError('Objective, due date, and at least one key result are required.'); return;
    }
    try {
      const response = await api.post('/api/goals', {
        objective: newObjective,
        keyResult: newKeyResults.filter(kr => kr.title.trim()),
        priority: 'Medium', status: 'Active', duedate: newDueDate, category: 'General',
        assignedToUserId: newAssignedUser?.id || null,
        assignedToDeptId: newAssignedDept || null,
      });
      setGoals([response.data, ...goals]);
      setNewObjective(''); setNewKeyResults([{ title: '', progress: 0 }]); setNewDueDate('');
      setNewAssignedUser(null); setNewAssignedDept('');
      setIsFormOpen(false); setFormError('');
    } catch { setFormError('Failed to add goal. Please check your input or try again later.'); }
  };

  if (loading) return <Typography>Loading goals...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', mt: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h3" gutterBottom align="center" color="primary" fontWeight="bold">Goals Dashboard</Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        {[
          { icon: <AssignmentIcon color="primary" />, label: 'Total Goals', value: totalGoals, color: '#1976d2' },
          { icon: <HourglassEmptyIcon color="warning" />, label: 'Active', value: activeGoals, color: '#ed6c02' },
          { icon: <CheckCircleIcon color="success" />, label: 'Completed', value: completedGoals, color: '#2e7d32' },
          { icon: <BarChartIcon color="info" />, label: 'Avg Progress', value: `${avgProgress}%`, color: '#0288d1' },
        ].map(({ icon, label, value, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 1 }}>
            {icon}
            <Typography variant="h6" sx={{ ml: 1 }}>{label}: <span style={{ color }}>{value}</span></Typography>
          </Box>
        ))}
      </Box>

      {/* Filter Tabs */}
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
        <Tab label="All Goals" />
        <Tab label="Assigned to Me" />
        <Tab label="My Department" />
      </Tabs>

      {/* Goal Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {filteredGoals.map((goal: any) => (
          <Box key={goal.gid} sx={{ flex: '1 1 320px', minWidth: 280 }}>
            <Card sx={{ p: 2, transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'scale(1.02)', boxShadow: 6 }, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom fontWeight="bold">Objective: {goal.objective}</Typography>
                <Divider sx={{ my: 1 }} />

                {/* Assignee chips */}
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  {goal.assignedToUser && (
                    <Chip icon={<PersonIcon />} label={`Assigned to: ${goal.assignedToUser.fullName}`} color="primary" variant="outlined" size="small" />
                  )}
                  {goal.assignedToDept && (
                    <Chip icon={<BusinessIcon />} label={`Dept: ${goal.assignedToDept.name}`} color="secondary" variant="outlined" size="small" />
                  )}
                </Box>

                <List>
                  {Array.isArray(goal.keyResult) ? goal.keyResult.map((kr: any, index: number) => (
                    <ListItem key={index} disablePadding>
                      <Button variant="outlined" size="small" color="primary" onClick={() => handleUpdateProgress(goal.gid, index)}
                        disabled={!isDateValid(goal.duedate)} sx={{ mr: 1, textTransform: 'none' }} startIcon={<BarChartIcon />}>
                        Add Progress
                      </Button>
                      <ListItemText primary={
                        <Typography variant="body1">
                          {`Key Result ${index + 1}: `}{typeof kr === 'string' ? kr : kr?.title || 'No key result'}
                          {typeof kr === 'object' && kr?.progress != null ? ` — ${kr.progress}%` : ''}
                        </Typography>
                      } sx={{ pl: 1 }} />
                    </ListItem>
                  )) : (
                    <ListItem disablePadding>
                      <ListItemText primary={<Typography variant="body1">Key Result: {goal.keyResult || 'No key results'}</Typography>} sx={{ pl: 1 }} />
                    </ListItem>
                  )}
                </List>

                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`Priority: ${goal.priority || 'N/A'}`} variant="outlined" />
                  <Chip label={`Status: ${goal.status || 'N/A'}`} color={goal.status === 'Completed' ? 'success' : 'warning'} variant="outlined" />
                  <Chip label={`Progress: ${goal.progress || 0}%`} color="info" variant="outlined" />
                  <Chip label={`Due: ${goal.duedate ? new Date(goal.duedate).toLocaleDateString() : 'N/A'}`} variant="outlined" />
                  {(() => { const sch = getScheduleStatus(goal.duedate, goal.progress ?? 0); return <Chip label={`Schedule: ${sch.label}`} color={sch.color} variant="outlined" />; })()}
                  <Chip label={`Category: ${goal.category || 'N/A'}`} color="secondary" variant="outlined" />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {getRequiredDailyProgressSentence(goal.duedate, goal.progress ?? 0)}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="secondary" onClick={() => handleEdit(goal.gid)}
                    disabled={!isDateValid(goal.duedate)} startIcon={<EditIcon />} sx={{ textTransform: 'none' }}>Edit</Button>
                  <IconButton color="error" onClick={() => handleDelete(goal.gid)} disabled={!isDateValid(goal.duedate)}>
                    <DeleteIcon />
                  </IconButton>
                  <Button variant="outlined" onClick={() => openDetails(goal.gid)} sx={{ textTransform: 'none' }}>Details</Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
        {filteredGoals.length === 0 && (
          <Typography color="text.secondary" sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
            No goals found for this view.
          </Typography>
        )}
      </Box>

      {/* Add New Goal Button */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setIsFormOpen(true)} sx={{ px: 3, py: 1.5, borderRadius: 2 }}>New Goal</Button>
      </Box>

      {/* Add Goal Form */}
      {isFormOpen && (
        <Card sx={{ mt: 4, p: 3, borderRadius: 2, boxShadow: 3, bgcolor: 'white' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">Add New Goal</Typography>
            <form onSubmit={handleAddObjective} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <TextField fullWidth label="Objective" value={newObjective} onChange={e => setNewObjective(e.target.value)} required variant="outlined" />
              <TextField fullWidth label="Due Date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} required type="date" InputLabelProps={{ shrink: true }} variant="outlined" />
              {newKeyResults.map((kr, index) => (
                <TextField key={index} fullWidth label={index === 0 ? 'Key Result 1' : `Key Result ${index + 1}`}
                  value={kr.title} onChange={e => { const u = [...newKeyResults]; u[index].title = e.target.value; setNewKeyResults(u); }} required variant="outlined" />
              ))}
              <Button variant="outlined" onClick={() => setNewKeyResults([...newKeyResults, { title: '', progress: 0 }])}>+ Add Another Key Result</Button>

              {/* Assignment */}
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Assignment (optional)</Typography>
              <Autocomplete
                options={employees}
                getOptionLabel={o => o.fullName}
                value={newAssignedUser}
                onChange={(_, v) => setNewAssignedUser(v)}
                renderInput={params => <TextField {...params} label="Assign to User" variant="outlined" />}
              />
              <FormControl fullWidth>
                <InputLabel>Assign to Department</InputLabel>
                <Select value={newAssignedDept} label="Assign to Department" onChange={e => setNewAssignedDept(e.target.value as number | '')}>
                  <MenuItem value="">— None —</MenuItem>
                  {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>

              {formError && <Alert severity="error">{formError}</Alert>}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.5 }}>Add Objective</Button>
                <Button variant="outlined" color="secondary" onClick={() => setIsFormOpen(false)} fullWidth sx={{ py: 1.5 }}>Cancel</Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Progress Dialog */}
      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)}>
        <DialogTitle>Update Key Result Progress</DialogTitle>
        <DialogContent>
          <DialogContentText>Set progress for "{progressGoal?.objective}" - KR {progressKeyIndex !== null ? progressKeyIndex + 1 : ''}.</DialogContentText>
          <Box sx={{ mt: 2, px: 1 }}>
            <Slider value={progressValue} onChange={(_, v) => setProgressValue(v as number)} valueLabelDisplay="auto" min={0} max={100} />
            <TextField label="Progress (%)" type="number" value={progressValue} onChange={e => setProgressValue(Math.max(0, Math.min(100, Number(e.target.value))))} fullWidth sx={{ mt: 2 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveProgress} variant="contained" disabled={!isDateValid(progressGoal?.duedate)}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Objective" value={editObjective} onChange={e => setEditObjective(e.target.value)} fullWidth />
            {editKeyResults.map((kr, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2 }}>
                <TextField label={`Key Result ${idx + 1}`} value={kr.title} fullWidth
                  onChange={e => { const n = [...editKeyResults]; n[idx].title = e.target.value; setEditKeyResults(n); }} />
                <TextField label="%" type="number" value={kr.progress ?? 0} sx={{ width: 100 }} inputProps={{ min: 0, max: 100 }}
                  onChange={e => { const n = [...editKeyResults]; n[idx].progress = Math.max(0, Math.min(100, Number(e.target.value))); setEditKeyResults(n); }} />
              </Box>
            ))}
            <Button variant="outlined" onClick={() => setEditKeyResults([...editKeyResults, { title: '', progress: 0 }])}>+ Add Key Result</Button>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={editPriority} label="Priority" onChange={e => setEditPriority(e.target.value)}>
                {['Low', 'Medium', 'High'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={editStatus} label="Status" onChange={e => setEditStatus(e.target.value)}>
                {['Active', 'In Progress', 'Completed'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Due Date" type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Category" value={editCategory} onChange={e => setEditCategory(e.target.value)} fullWidth />
            <Box sx={{ px: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Progress: {editProgress}%</Typography>
              <Slider value={editProgress} onChange={(_, v) => setEditProgress(v as number)} valueLabelDisplay="auto" min={0} max={100} />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">Assignment (optional)</Typography>
            <Autocomplete options={employees} getOptionLabel={o => o.fullName} value={editAssignedUser}
              onChange={(_, v) => setEditAssignedUser(v)}
              renderInput={params => <TextField {...params} label="Assign to User" variant="outlined" />} />
            <FormControl fullWidth>
              <InputLabel>Assign to Department</InputLabel>
              <Select value={editAssignedDept} label="Assign to Department" onChange={e => setEditAssignedDept(e.target.value as number | '')}>
                <MenuItem value="">— None —</MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Objective Details</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom>{detailsGoal?.objective}</Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {getRequiredDailyProgressSentence(detailsGoal?.duedate as any, detailsGoal?.progress ?? 0)}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {(() => { const sch = getScheduleStatus(detailsGoal?.duedate as any, detailsGoal?.progress ?? 0); return <Chip label={`Schedule: ${sch.label}`} color={sch.color} variant="outlined" />; })()}
            <Chip label={`Progress: ${detailsGoal?.progress ?? 0}%`} color="info" variant="outlined" />
            <Chip label={`Due: ${detailsGoal?.duedate ? new Date(detailsGoal.duedate as any).toLocaleDateString() : 'N/A'}`} variant="outlined" />
            <Chip label={`Priority: ${(detailsGoal as any)?.priority || 'N/A'}`} variant="outlined" />
            <Chip label={`Status: ${detailsGoal?.status || 'N/A'}`} variant="outlined" />
          </Box>
          <Typography variant="subtitle1" gutterBottom>Key Results</Typography>
          <List dense>
            {Array.isArray(detailsGoal?.keyResult) ? detailsGoal!.keyResult.map((kr: any, idx: number) => (
              <ListItem key={idx} disableGutters>
                <ListItemText primary={`${idx + 1}. ${typeof kr === 'string' ? kr : kr?.title || 'Untitled'}`}
                  secondary={`Progress: ${typeof kr === 'object' && kr?.progress != null ? kr.progress : 0}%`} />
              </ListItem>
            )) : <ListItem disableGutters><ListItemText primary={String(detailsGoal?.keyResult || 'No key results')} /></ListItem>}
          </List>
          <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>Recent Progress Logs</Typography>
          {detailsLogs.length === 0 ? <Typography variant="body2" color="text.secondary">No progress logs yet.</Typography> : (
            <List dense>
              {detailsLogs.slice(0, 20).map(log => (
                <ListItem key={log.id} disableGutters>
                  <ListItemText primary={`KR ${log.keyIndex + 1}: ${log.progress}%`} secondary={`Noted at: ${new Date(log.notedAt).toLocaleString()} by User #${log.notedBy}`} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailsOpen(false)}>Close</Button></DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete "{deleteGoal?.objective}"? This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalsPage;
