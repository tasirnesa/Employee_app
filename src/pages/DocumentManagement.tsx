import React, { useState, useMemo } from 'react';
import { 
  Box, Typography, Grid, Paper, Button, TextField, 
  IconButton, Chip, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemIcon, ListItemText,
  InputAdornment, Tooltip, Alert, CircularProgress,
  Container, ListItemButton
} from '@mui/material';
import { 
  CloudUpload, Folder, Description, Search, 
  Delete, Visibility, Warning, 
  Category, Event, FilterList, CheckCircle
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDocuments, getCategories, uploadDocument, 
  deleteDocument, type Document, type DocumentCategory 
} from '../api/documentApi';
import { format } from 'date-fns';

const DocumentManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Queries
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => getDocuments(),
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['document-categories'],
    queryFn: getCategories,
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsUploadOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] })
  });

  // Filtering
  const filteredDocs = useMemo(() => {
    return documents.filter((doc: Document) => {
      const matchesCategory = selectedCategory === 'all' || doc.categoryId === selectedCategory;
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [documents, selectedCategory, searchQuery]);

  const expiringSoon = useMemo(() => {
    const today = new Date();
    return documents.filter((doc: Document) => {
      if (!doc.expiryDate || doc.status !== 'Active') return false;
      const expiry = new Date(doc.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= doc.remindDaysBefore && diffDays > 0;
    });
  }, [documents]);

  const getStatusChip = (doc: Document) => {
    if (doc.status === 'Expired') return <Chip icon={<Warning />} label="Expired" color="error" variant="outlined" />;
    
    const today = new Date();
    if (doc.expiryDate) {
      const expiry = new Date(doc.expiryDate);
      if (expiry < today) return <Chip icon={<Warning />} label="Expired" color="error" variant="outlined" />;
      
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= doc.remindDaysBefore) return <Chip icon={<Event />} label={`Expires in ${diffDays}d`} color="warning" variant="outlined" />;
    }

    return <Chip label="Active" color="primary" variant="outlined" />;
  };

  if (docsLoading || catsLoading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
            Document Management
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage employee documents, tracking validity and renewals.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<CloudUpload />}
          onClick={() => setIsUploadOpen(true)}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Upload New Document
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Sidebar: Categories */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={2} display="flex" alignItems="center">
              <Category sx={{ mr: 1, fontSize: 20 }} /> Categories
            </Typography>
            <List component="nav">
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  selected={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemIcon><Folder color={selectedCategory === 'all' ? 'primary' : 'inherit'} /></ListItemIcon>
                  <ListItemText primary="All Documents" />
                </ListItemButton>
              </ListItem>
              {categories.map((cat: DocumentCategory) => (
                <ListItem key={cat.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    selected={selectedCategory === cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemIcon><Folder color={selectedCategory === cat.id ? 'primary' : 'inherit'} /></ListItemIcon>
                    <ListItemText primary={cat.name} secondary={`${cat._count?.documents || 0} files`} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>

          {expiringSoon.length > 0 && (
            <Alert severity="warning" icon={<Warning />} sx={{ mt: 3, borderRadius: 3 }}>
              {expiringSoon.length} document{expiringSoon.length > 1 ? 's are' : ' is'} expiring soon.
            </Alert>
          )}
        </Grid>

        {/* Main Content: Search and List */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(0,0,0,0.08)', minHeight: '70vh' }}>
            <Box mb={4} display="flex" gap={2}>
              <TextField 
                fullWidth
                variant="outlined"
                placeholder="Search documents by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <IconButton sx={{ bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 2 }}>
                <FilterList />
              </IconButton>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDocs.map((doc: Document) => (
                    <TableRow key={doc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Description sx={{ mr: 2, color: 'primary.light' }} />
                          <Box>
                            <Typography variant="body1" fontWeight="500">{doc.title}</Typography>
                            <Typography variant="caption" color="textSecondary">{doc.fileType?.toUpperCase() || 'FILE'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{doc.category?.name}</TableCell>
                      <TableCell>
                        {doc.expiryDate ? format(new Date(doc.expiryDate), 'MMM dd, yyyy') : 'No Expiry'}
                      </TableCell>
                      <TableCell>{getStatusChip(doc)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View File">
                          <IconButton size="small" component="a" href={doc.fileUrl} target="_blank">
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(doc.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDocs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                        <Typography variant="body1" color="textSecondary">
                          No documents found matching your criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle fontWeight="bold">Upload Document</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Document Title" required />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category" required>
                  {categories.map((c: DocumentCategory) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Expiry Date" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Remind Before (Days)" type="number" defaultValue={30} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />}>
                Select File
                <input type="file" hidden />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setIsUploadOpen(false)}>Upload</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentManagement;
