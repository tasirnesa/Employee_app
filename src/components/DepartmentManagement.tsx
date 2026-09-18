import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/apiService';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  IconButton,
  Paper,
  Chip,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Tooltip,
  InputAdornment,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Pagination,
  ToggleButtonGroup,
  ToggleButton,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';

// ── constants ──────────────────────────────────────────────────────────────
const CARDS_PER_PAGE = 12;
const ROWS_PER_PAGE  = 15;

const DEPT_COLORS = [
  '#6366f1','#ec4899','#10b981','#f59e0b',
  '#0ea5e9','#8b5cf6','#f43f5e','#14b8a6',
];
const deptColor = (name: string) => DEPT_COLORS[name.charCodeAt(0) % DEPT_COLORS.length];

// ── Department Card ────────────────────────────────────────────────────────
const DeptCard: React.FC<{ dept: any; onEdit:(d:any)=>void; onDelete:(d:any)=>void }> = ({ dept, onEdit, onDelete }) => {
  const color = deptColor(dept.name);
  const count = dept.users?.length ?? dept._count?.users ?? 0;
  return (
    <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid #eef2ff', overflow:'hidden',
      transition:'all 0.2s', '&:hover':{ transform:'translateY(-3px)', boxShadow:'0 8px 24px rgba(0,0,0,0.07)', borderColor:color } }}>
      <Box sx={{ height:5, bgcolor:color }} />
      <Box sx={{ p:2.5 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:2 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Avatar sx={{ bgcolor:`${color}18`, color, width:40, height:40, borderRadius:2 }}><BusinessIcon /></Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b" lineHeight={1.2}>{dept.name}</Typography>
              <Typography variant="caption" color="text.secondary">ID #{dept.id}</Typography>
            </Box>
          </Box>
          <Box>
            <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(dept)} sx={{ color:'#6366f1' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(dept)} sx={{ color:'#ef4444' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap:1 }}>
          <Chip icon={<PeopleIcon sx={{ fontSize:'14px !important' }} />}
            label={`${count} employee${count!==1?'s':''}`} size="small"
            sx={{ bgcolor:'#f1f5f9', fontWeight:600, fontSize:12 }} />
          {dept.manager
            ? <Chip icon={<PersonIcon sx={{ fontSize:'14px !important' }} />} label={dept.manager.fullName}
                size="small" sx={{ bgcolor:`${color}12`, color, fontWeight:600, fontSize:12 }} />
            : <Chip label="No manager" size="small" sx={{ bgcolor:'#f8fafc', color:'#94a3b8', fontSize:12 }} />}
        </Stack>
        <Typography variant="caption" color="text.disabled" sx={{ display:'block', mt:1.5 }}>
          Created {new Date(dept.createdAt).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}
        </Typography>
      </Box>
    </Paper>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
const DepartmentManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch]           = useState('');
  const [view, setView]               = useState<'grid'|'list'>('grid');
  const [page, setPage]               = useState(1);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [form, setForm]               = useState({ name:'', managerId:'' });
  const [formError, setFormError]     = useState<string|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const { data: departments=[], isLoading, error: fetchError } = useQuery({
    queryKey:['departments'], queryFn:()=>apiService.getDepartments(),
  });
  const { data: users=[] } = useQuery({
    queryKey:['users'], queryFn:()=>apiService.getUsers(),
  });

  const createMutation = useMutation({
    mutationFn:(data:any)=>apiService.createDepartment(data),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['departments']}); closeDialog(); },
    onError:(e:any)=>setFormError(e?.response?.data?.error||'Failed to create'),
  });
  const updateMutation = useMutation({
    mutationFn:({id,data}:any)=>apiService.updateDepartment(id,data),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['departments']}); closeDialog(); },
    onError:(e:any)=>setFormError(e?.response?.data?.error||'Failed to update'),
  });
  const deleteMutation = useMutation({
    mutationFn:(id:number)=>apiService.deleteDepartment(id),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['departments']}); setDeleteConfirm(null); },
    onError:(e:any)=>setFormError(e?.response?.data?.error||'Failed to delete'),
  });

  const openCreate = () => { setEditingDept(null); setForm({name:'',managerId:''}); setFormError(null); setDialogOpen(true); };
  const openEdit   = (d:any) => { setEditingDept(d); setForm({name:d.name,managerId:d.managerId?.toString()||''}); setFormError(null); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingDept(null); setForm({name:'',managerId:''}); setFormError(null); };

  const handleSubmit = () => {
    if (!form.name.trim()) { setFormError('Department name is required'); return; }
    const payload = { name:form.name.trim(), managerId:form.managerId?parseInt(form.managerId):undefined };
    editingDept ? updateMutation.mutate({id:editingDept.id,data:payload}) : createMutation.mutate(payload);
  };

  // Filter + paginate
  const filtered = useMemo(()=>
    (departments as any[]).filter(d=>d.name.toLowerCase().includes(search.toLowerCase())),
    [departments, search]
  );

  const perPage   = view==='grid' ? CARDS_PER_PAGE : ROWS_PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage  = Math.min(page, pageCount);
  const paginated = filtered.slice((safePage-1)*perPage, safePage*perPage);

  // Reset to page 1 when search changes
  const handleSearch = (val:string) => { setSearch(val); setPage(1); };
  const handleView   = (_:any, v:any) => { if(v){ setView(v); setPage(1); } };

  const totalEmployees = (departments as any[]).reduce((s,d)=>s+(d.users?.length??d._count?.users??0),0);

  return (
    <Box sx={{ p:{ xs:2, md:4 } }}>

      {/* ── Header ── */}
      <Box sx={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:2, mb:4, alignItems:'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">Departments</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>
            Manage your organisation's department structure
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ borderRadius:2.5, px:3, fontWeight:700 }}>New Department</Button>
      </Box>

      {/* ── Summary ── */}
      <Box sx={{ display:'flex', gap:2, mb:3, flexWrap:'wrap' }}>
        {[
          { label:'Total Departments', value:(departments as any[]).length, color:'#6366f1', icon:<BusinessIcon /> },
          { label:'Total Employees',   value:totalEmployees,                color:'#10b981', icon:<PeopleIcon /> },
          { label:'With Manager',      value:(departments as any[]).filter((d:any)=>d.manager||d.managerId).length, color:'#f59e0b', icon:<PersonIcon /> },
        ].map(s=>(
          <Paper key={s.label} elevation={0} sx={{ flex:'1 1 160px', p:2, borderRadius:3, border:'1px solid #eef2ff', display:'flex', alignItems:'center', gap:1.5 }}>
            <Avatar sx={{ bgcolor:`${s.color}15`, color:s.color, width:40, height:40, borderRadius:2 }}>{s.icon}</Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1e293b">{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ── Toolbar ── */}
      <Box sx={{ display:'flex', gap:2, mb:3, alignItems:'center', flexWrap:'wrap' }}>
        <TextField
          placeholder="Search departments…"
          value={search}
          onChange={e=>handleSearch(e.target.value)}
          size="small"
          sx={{ flex:'1 1 220px', maxWidth:360 }}
          InputProps={{
            startAdornment:<InputAdornment position="start"><SearchIcon sx={{ color:'text.disabled', fontSize:18 }} /></InputAdornment>,
            sx:{ borderRadius:2.5 },
          }}
        />
        <Box sx={{ display:'flex', alignItems:'center', gap:1, ml:'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} result{filtered.length!==1?'s':''}
          </Typography>
          <ToggleButtonGroup value={view} exclusive onChange={handleView} size="small" sx={{ '& .MuiToggleButton-root':{ border:'1px solid #eef2ff', borderRadius:'8px !important' } }}>
            <ToggleButton value="grid"><Tooltip title="Card view"><GridViewIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="list"><Tooltip title="Table view"><TableRowsIcon fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {fetchError && <Alert severity="error" sx={{ mb:2 }}>Failed to load departments</Alert>}

      {/* ── Content ── */}
      {isLoading ? (
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:2.5 }}>
          {[...Array(6)].map((_,i)=><Skeleton key={i} variant="rounded" height={160} sx={{ borderRadius:3 }} />)}
        </Box>
      ) : filtered.length===0 ? (
        <Box sx={{ textAlign:'center', py:8, border:'1px dashed #e2e8f0', borderRadius:3 }}>
          <BusinessIcon sx={{ fontSize:48, color:'#cbd5e1', mb:1 }} />
          <Typography color="text.secondary">
            {search ? 'No departments match your search' : 'No departments yet — create one to get started'}
          </Typography>
        </Box>
      ) : view==='grid' ? (
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:2.5 }}>
          {paginated.map((d:any)=>(
            <DeptCard key={d.id} dept={d} onEdit={openEdit} onDelete={setDeleteConfirm} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border:'1px solid #eef2ff', borderRadius:3 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th':{ bgcolor:'#f8faff', fontWeight:700, color:'#64748b', fontSize:12, textTransform:'uppercase', letterSpacing:0.5 } }}>
                <TableCell>Department</TableCell>
                <TableCell>Manager</TableCell>
                <TableCell>Employees</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((d:any)=>{
                const color = deptColor(d.name);
                const count = d.users?.length??d._count?.users??0;
                return (
                  <TableRow key={d.id} hover sx={{ '&:last-child td':{ borderBottom:0 } }}>
                    <TableCell>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                        <Avatar sx={{ bgcolor:`${color}18`, color, width:32, height:32, borderRadius:1.5, fontSize:14 }}><BusinessIcon fontSize="small" /></Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{d.name}</Typography>
                          <Typography variant="caption" color="text.secondary">#{d.id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {d.manager
                        ? <Chip label={d.manager.fullName} size="small" sx={{ bgcolor:`${color}12`, color, fontWeight:600 }} />
                        : <Typography variant="caption" color="text.disabled">No manager</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip label={count} size="small" icon={<PeopleIcon sx={{ fontSize:'13px !important' }} />}
                        sx={{ bgcolor:'#f1f5f9', fontWeight:600 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(d.createdAt).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={()=>openEdit(d)} sx={{ color:'#6366f1' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={()=>setDeleteConfirm(d)} sx={{ color:'#ef4444' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Pagination ── */}
      {pageCount > 1 && (
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mt:3, flexWrap:'wrap', gap:1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(safePage-1)*perPage+1}–{Math.min(safePage*perPage, filtered.length)} of {filtered.length}
          </Typography>
          <Pagination
            count={pageCount}
            page={safePage}
            onChange={(_,v)=>setPage(v)}
            size="small"
            shape="rounded"
            color="primary"
          />
        </Box>
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ fontWeight:800, pb:1 }}>
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {editingDept ? 'Edit Department' : 'New Department'}
            <IconButton size="small" onClick={closeDialog}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt:'8px !important' }}>
          {formError && <Alert severity="error" sx={{ mb:2 }}>{formError}</Alert>}
          <Stack spacing={2.5} sx={{ mt:1 }}>
            <TextField label="Department Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
              fullWidth required autoFocus placeholder="e.g. Engineering, Sales, HR" />
            <FormControl fullWidth>
              <InputLabel>Manager (optional)</InputLabel>
              <Select value={form.managerId} onChange={e=>setForm({...form,managerId:e.target.value as string})} label="Manager (optional)">
                <MenuItem value="">No Manager</MenuItem>
                {(users as any[]).map(u=>(
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.fullName} <Typography component="span" variant="caption" color="text.secondary" sx={{ ml:1 }}>({u.userName})</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:3 }}>
          <Button onClick={closeDialog} variant="outlined" sx={{ borderRadius:2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}
            disabled={createMutation.isPending||updateMutation.isPending} sx={{ borderRadius:2, fontWeight:700 }}>
            {createMutation.isPending||updateMutation.isPending ? 'Saving…' : editingDept ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle fontWeight={800}>Delete Department?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone
            and will fail if employees are assigned to it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:3 }}>
          <Button onClick={()=>setDeleteConfirm(null)} variant="outlined" sx={{ borderRadius:2 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={()=>deleteMutation.mutate(deleteConfirm.id)}
            disabled={deleteMutation.isPending} sx={{ borderRadius:2, fontWeight:700 }}>
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentManagement;
