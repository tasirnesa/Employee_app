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
  LinearProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Pagination,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BadgeIcon from '@mui/icons-material/Badge';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';

// ── constants ──────────────────────────────────────────────────────────────
const CARDS_PER_PAGE = 12;
const ROWS_PER_PAGE  = 15;

const LEVEL_COLORS: Record<number,{bg:string;color:string;label:string}> = {
  1:{ bg:'#fef3c7', color:'#d97706', label:'Executive' },
  2:{ bg:'#ede9fe', color:'#7c3aed', label:'Director'  },
  3:{ bg:'#dbeafe', color:'#2563eb', label:'Manager'   },
  4:{ bg:'#dcfce7', color:'#16a34a', label:'Senior'    },
  5:{ bg:'#fce7f3', color:'#db2777', label:'Mid-Level' },
};
const levelStyle = (l:number) => LEVEL_COLORS[l]||{ bg:'#f1f5f9', color:'#64748b', label:`Level ${l}` };

// ── Position Card ──────────────────────────────────────────────────────────
const PositionCard: React.FC<{ pos:any; allPositions:any[]; maxLevel:number; onEdit:(p:any)=>void; onDelete:(p:any)=>void }> =
  ({ pos, allPositions, maxLevel, onEdit, onDelete }) => {
  const style     = levelStyle(pos.level);
  const userCount = pos.users?.length??pos._count?.users??0;
  const reportsTo = allPositions.find(p=>p.id===pos.reportsTo);
  const barValue  = Math.max(5, 100-((pos.level-1)/Math.max(maxLevel-1,1))*90);

  return (
    <Paper elevation={0} sx={{ borderRadius:3, border:'1px solid #eef2ff', overflow:'hidden',
      transition:'all 0.2s', '&:hover':{ transform:'translateY(-3px)', boxShadow:'0 8px 24px rgba(0,0,0,0.07)', borderColor:style.color } }}>
      <LinearProgress variant="determinate" value={barValue}
        sx={{ height:5, bgcolor:'#f1f5f9', '& .MuiLinearProgress-bar':{ bgcolor:style.color } }} />
      <Box sx={{ p:2.5 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:2 }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <Avatar sx={{ bgcolor:style.bg, color:style.color, width:40, height:40, borderRadius:2, fontSize:15, fontWeight:800 }}>{pos.level}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b" lineHeight={1.2}>{pos.name}</Typography>
              <Chip label={style.label} size="small"
                sx={{ bgcolor:style.bg, color:style.color, fontWeight:700, fontSize:10, height:18, mt:0.5 }} />
            </Box>
          </Box>
          <Box>
            <Tooltip title="Edit"><IconButton size="small" onClick={()=>onEdit(pos)} sx={{ color:'#6366f1' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Delete"><IconButton size="small" onClick={()=>onDelete(pos)} sx={{ color:'#ef4444' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap:1 }}>
          <Chip icon={<PeopleIcon sx={{ fontSize:'14px !important' }} />}
            label={`${userCount} user${userCount!==1?'s':''}`} size="small"
            sx={{ bgcolor:'#f1f5f9', fontWeight:600, fontSize:12 }} />
          {reportsTo
            ? <Chip icon={<ArrowUpwardIcon sx={{ fontSize:'13px !important' }} />}
                label={reportsTo.name} size="small"
                sx={{ bgcolor:`${style.color}12`, color:style.color, fontWeight:600, fontSize:12 }} />
            : <Chip label="Top Level" size="small"
                sx={{ bgcolor:'#fef3c7', color:'#d97706', fontWeight:600, fontSize:12 }} />}
        </Stack>
        <Typography variant="caption" color="text.disabled" sx={{ display:'block', mt:1.5 }}>
          Created {new Date(pos.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
        </Typography>
      </Box>
    </Paper>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
const PositionManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch]         = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [view, setView]             = useState<'grid'|'list'>('grid');
  const [page, setPage]             = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<any>(null);
  const [form, setForm]             = useState({ name:'', level:'', reportsTo:'' });
  const [formError, setFormError]   = useState<string|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

  const { data: positions=[], isLoading, error: fetchError } = useQuery({
    queryKey:['positions'], queryFn:()=>apiService.getPositions(),
  });

  const createMutation = useMutation({
    mutationFn:(data:any)=>apiService.createPosition(data),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['positions']}); closeDialog(); },
    onError:(e:any)=>setFormError(e?.response?.data?.error||'Failed to create'),
  });
  const updateMutation = useMutation({
    mutationFn:({id,data}:any)=>apiService.updatePosition(id,data),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['positions']}); closeDialog(); },
    onError:(e:any)=>setFormError(e?.response?.data?.error||'Failed to update'),
  });
  const deleteMutation = useMutation({
    mutationFn:(id:number)=>apiService.deletePosition(id),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['positions']}); setDeleteConfirm(null); },
    onError:(e:any)=>setFormError(e?.response?.data?.error||'Failed to delete'),
  });

  const openCreate = () => { setEditingPos(null); setForm({name:'',level:'',reportsTo:''}); setFormError(null); setDialogOpen(true); };
  const openEdit   = (p:any) => { setEditingPos(p); setForm({name:p.name,level:String(p.level),reportsTo:p.reportsTo?.toString()||''}); setFormError(null); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingPos(null); setForm({name:'',level:'',reportsTo:''}); setFormError(null); };

  const handleSubmit = () => {
    if (!form.name.trim()||!form.level) { setFormError('Position name and level are required'); return; }
    const payload = { name:form.name.trim(), level:parseInt(form.level), reportsTo:form.reportsTo?parseInt(form.reportsTo):undefined };
    editingPos ? updateMutation.mutate({id:editingPos.id,data:payload}) : createMutation.mutate(payload);
  };

  const levels = useMemo(()=>[...new Set((positions as any[]).map(p=>p.level))].sort((a,b)=>a-b), [positions]);
  const maxLevel = useMemo(()=>Math.max(...(positions as any[]).map(p=>p.level),1), [positions]);

  const filtered = useMemo(()=>
    (positions as any[])
      .filter(p=>p.name.toLowerCase().includes(search.toLowerCase()) && (filterLevel===''||String(p.level)===filterLevel))
      .sort((a,b)=>a.level-b.level),
    [positions, search, filterLevel]
  );

  const perPage   = view==='grid' ? CARDS_PER_PAGE : ROWS_PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(filtered.length/perPage));
  const safePage  = Math.min(page, pageCount);
  const paginated = filtered.slice((safePage-1)*perPage, safePage*perPage);

  const handleSearch = (v:string) => { setSearch(v); setPage(1); };
  const handleFilter = (v:string) => { setFilterLevel(v); setPage(1); };
  const handleView   = (_:any,v:any) => { if(v){ setView(v); setPage(1); } };

  const totalUsers = (positions as any[]).reduce((s,p)=>s+(p.users?.length??p._count?.users??0),0);

  return (
    <Box sx={{ p:{ xs:2, md:4 } }}>

      {/* ── Header ── */}
      <Box sx={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:2, mb:4, alignItems:'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#1e293b">Positions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt:0.5 }}>
            Define your organisation's hierarchy and reporting structure
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ borderRadius:2.5, px:3, fontWeight:700 }}>New Position</Button>
      </Box>

      {/* ── Summary ── */}
      <Box sx={{ display:'flex', gap:2, mb:3, flexWrap:'wrap' }}>
        {[
          { label:'Total Positions',  value:(positions as any[]).length, color:'#6366f1', icon:<BadgeIcon /> },
          { label:'Hierarchy Levels', value:levels.length,               color:'#f59e0b', icon:<AccountTreeIcon /> },
          { label:'Users Assigned',   value:totalUsers,                  color:'#10b981', icon:<PeopleIcon /> },
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
          placeholder="Search positions…"
          value={search}
          onChange={e=>handleSearch(e.target.value)}
          size="small"
          sx={{ flex:'1 1 200px', maxWidth:300 }}
          InputProps={{
            startAdornment:<InputAdornment position="start"><SearchIcon sx={{ color:'text.disabled', fontSize:18 }} /></InputAdornment>,
            sx:{ borderRadius:2.5 },
          }}
        />
        <FormControl size="small" sx={{ minWidth:160 }}>
          <InputLabel>Level</InputLabel>
          <Select value={filterLevel} onChange={e=>handleFilter(e.target.value as string)} label="Level" sx={{ borderRadius:2.5 }}>
            <MenuItem value="">All levels</MenuItem>
            {levels.map(l=>(
              <MenuItem key={l} value={String(l)}>Level {l} — {levelStyle(l).label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display:'flex', alignItems:'center', gap:1, ml:'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {filtered.length} result{filtered.length!==1?'s':''}
          </Typography>
          <ToggleButtonGroup value={view} exclusive onChange={handleView} size="small"
            sx={{ '& .MuiToggleButton-root':{ border:'1px solid #eef2ff', borderRadius:'8px !important' } }}>
            <ToggleButton value="grid"><Tooltip title="Card view"><GridViewIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="list"><Tooltip title="Table view"><TableRowsIcon fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {fetchError && <Alert severity="error" sx={{ mb:2 }}>Failed to load positions</Alert>}

      {/* ── Content ── */}
      {isLoading ? (
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:2.5 }}>
          {[...Array(6)].map((_,i)=><Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius:3 }} />)}
        </Box>
      ) : filtered.length===0 ? (
        <Box sx={{ textAlign:'center', py:8, border:'1px dashed #e2e8f0', borderRadius:3 }}>
          <BadgeIcon sx={{ fontSize:48, color:'#cbd5e1', mb:1 }} />
          <Typography color="text.secondary">
            {search||filterLevel ? 'No positions match your filters' : 'No positions yet — create one to get started'}
          </Typography>
        </Box>
      ) : view==='grid' ? (
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:2.5 }}>
          {paginated.map((p:any)=>(
            <PositionCard key={p.id} pos={p} allPositions={positions as any[]}
              maxLevel={maxLevel} onEdit={openEdit} onDelete={setDeleteConfirm} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border:'1px solid #eef2ff', borderRadius:3 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th':{ bgcolor:'#f8faff', fontWeight:700, color:'#64748b', fontSize:12, textTransform:'uppercase', letterSpacing:0.5 } }}>
                <TableCell>Position</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Reports To</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((p:any)=>{
                const style     = levelStyle(p.level);
                const userCount = p.users?.length??p._count?.users??0;
                const reportsTo = (positions as any[]).find(x=>x.id===p.reportsTo);
                return (
                  <TableRow key={p.id} hover sx={{ '&:last-child td':{ borderBottom:0 } }}>
                    <TableCell>
                      <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
                        <Avatar sx={{ bgcolor:style.bg, color:style.color, width:32, height:32, borderRadius:1.5, fontSize:13, fontWeight:800 }}>{p.level}</Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{p.name}</Typography>
                          <Chip label={style.label} size="small"
                            sx={{ bgcolor:style.bg, color:style.color, fontWeight:700, fontSize:10, height:16, '& .MuiChip-label':{ px:0.75 } }} />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>Level {p.level}</Typography>
                    </TableCell>
                    <TableCell>
                      {reportsTo
                        ? <Chip label={reportsTo.name} size="small" icon={<ArrowUpwardIcon sx={{ fontSize:'12px !important' }} />}
                            sx={{ bgcolor:`${style.color}12`, color:style.color, fontWeight:600 }} />
                        : <Chip label="Top Level" size="small"
                            sx={{ bgcolor:'#fef3c7', color:'#d97706', fontWeight:600 }} />}
                    </TableCell>
                    <TableCell>
                      <Chip label={userCount} size="small" icon={<PeopleIcon sx={{ fontSize:'13px !important' }} />}
                        sx={{ bgcolor:'#f1f5f9', fontWeight:600 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(p.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" onClick={()=>openEdit(p)} sx={{ color:'#6366f1' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={()=>setDeleteConfirm(p)} sx={{ color:'#ef4444' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
            Showing {(safePage-1)*perPage+1}–{Math.min(safePage*perPage,filtered.length)} of {filtered.length}
          </Typography>
          <Pagination count={pageCount} page={safePage} onChange={(_,v)=>setPage(v)}
            size="small" shape="rounded" color="primary" />
        </Box>
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle sx={{ fontWeight:800, pb:1 }}>
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            {editingPos ? 'Edit Position' : 'New Position'}
            <IconButton size="small" onClick={closeDialog}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt:'8px !important' }}>
          {formError && <Alert severity="error" sx={{ mb:2 }}>{formError}</Alert>}
          <Stack spacing={2.5} sx={{ mt:1 }}>
            <TextField label="Position Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
              fullWidth required autoFocus placeholder="e.g. Senior Developer, HR Manager" />
            <TextField label="Hierarchy Level" type="number" value={form.level}
              onChange={e=>setForm({...form,level:e.target.value})}
              fullWidth required inputProps={{ min:1 }}
              helperText="1 = highest (e.g. CEO), 2 = next level down, etc." />
            <FormControl fullWidth>
              <InputLabel>Reports To (optional)</InputLabel>
              <Select value={form.reportsTo} onChange={e=>setForm({...form,reportsTo:e.target.value as string})} label="Reports To (optional)">
                <MenuItem value="">No Higher Position (Top Level)</MenuItem>
                {(positions as any[])
                  .filter(p=>!editingPos||p.id!==editingPos.id)
                  .sort((a,b)=>a.level-b.level)
                  .map(p=>(
                    <MenuItem key={p.id} value={String(p.id)}>
                      {p.name}
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml:1 }}>(Level {p.level})</Typography>
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
            {createMutation.isPending||updateMutation.isPending ? 'Saving…' : editingPos ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={!!deleteConfirm} onClose={()=>setDeleteConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx:{ borderRadius:3 } }}>
        <DialogTitle fontWeight={800}>Delete Position?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will fail if users
            or subordinate positions are assigned to it.
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

export default PositionManagement;
