import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Check as CompleteIcon,
  Cancel as CancelIcon,
  Map as MapIcon,
  DirectionsCar as CarIcon,
  Timer as TimerIcon,
  Straighten as DistanceIcon,
  AutoMode as AutoModeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RoutesPage = () => {
  const { token } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generatedRoute, setGeneratedRoute] = useState(null);
  
  // New Route Form State
  const [newRouteData, setNewRouteData] = useState({
    routeName: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
    notes: ''
  });

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/routes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRoutes(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRoutes();
    }
  }, [token]);

  const handleGenerateOptimized = async () => {
    try {
      setOptimizing(true);
      const response = await axios.get('http://localhost:3000/api/routes/optimize', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const { bins, estimatedDuration, totalDistance } = response.data.data;
        
        if (bins.length === 0) {
          alert('No bins need collection at this time.');
          setOptimizing(false);
          return;
        }

        setGeneratedRoute({
          bins,
          estimatedDuration,
          totalDistance
        });
        
        setNewRouteData(prev => ({
          ...prev,
          routeName: `Optimized Route - ${new Date().toLocaleDateString()}`,
          scheduledDate: new Date().toISOString().split('T')[0]
        }));
        
        setOpenDialog(true);
      }
    } catch (err) {
      console.error('Error optimizing route:', err);
      alert('Failed to generate optimized route.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleSaveRoute = async () => {
    try {
      if (!generatedRoute) return;

      const payload = {
        ...newRouteData,
        bins: generatedRoute.bins,
        estimatedDuration: generatedRoute.estimatedDuration,
        totalDistance: generatedRoute.totalDistance,
        status: 'PLANNED'
      };

      const response = await axios.post('http://localhost:3000/api/routes', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOpenDialog(false);
        setGeneratedRoute(null);
        fetchRoutes();
      }
    } catch (err) {
      console.error('Error saving route:', err);
      alert('Failed to save route.');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/routes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRoutes();
    } catch (err) {
      console.error('Error deleting route:', err);
      alert('Failed to delete route.');
    }
  };

  const handleStatusChange = async (id, action) => {
    try {
      let endpoint = '';
      if (action === 'start') endpoint = `/start`;
      else if (action === 'cancel') endpoint = `/cancel`;
      
      // For cancel, we might need a reason, but keeping it simple for now
      const payload = action === 'cancel' ? { reason: 'Cancelled by user' } : {};

      await axios.post(`http://localhost:3000/api/routes/${id}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRoutes();
    } catch (err) {
      console.error(`Error ${action}ing route:`, err);
      alert(`Failed to ${action} route.`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNED': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Collection Routes</Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchRoutes}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={optimizing ? <CircularProgress size={24} color="inherit" /> : <AutoModeIcon />}
            onClick={handleGenerateOptimized}
            disabled={optimizing}
          >
            {optimizing ? 'Optimizing...' : 'Generate Optimized Route'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : routes.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No routes found. Generate an optimized route to get started.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {routes.map((route) => (
            <Grid item xs={12} md={6} lg={4} key={route._id}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" noWrap title={route.routeName}>
                      {route.routeName}
                    </Typography>
                    <Chip 
                      label={route.status} 
                      color={getStatusColor(route.status)} 
                      size="small" 
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimerIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Est. Duration: {route.estimatedDuration} mins
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DistanceIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Distance: {(route.totalDistance / 1000).toFixed(2)} km
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Bins: {route.bins.length}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    {route.status === 'PLANNED' && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        startIcon={<StartIcon />}
                        onClick={() => handleStatusChange(route._id, 'start')}
                      >
                        Start
                      </Button>
                    )}
                    
                    {route.status === 'IN_PROGRESS' && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary"
                        disabled
                      >
                        In Progress
                      </Button>
                    )}

                    <Box>
                      {route.status !== 'COMPLETED' && route.status !== 'CANCELLED' && (
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleStatusChange(route._id, 'cancel')}
                          title="Cancel Route"
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteRoute(route._id)}
                        title="Delete Route"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Route Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Save Optimized Route</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Route Name"
                value={newRouteData.routeName}
                onChange={(e) => setNewRouteData({ ...newRouteData, routeName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Scheduled Date"
                value={newRouteData.scheduledDate}
                onChange={(e) => setNewRouteData({ ...newRouteData, scheduledDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Priority"
                value={newRouteData.priority}
                onChange={(e) => setNewRouteData({ ...newRouteData, priority: e.target.value })}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Route Summary:</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip icon={<TimerIcon />} label={`${generatedRoute?.estimatedDuration || 0} mins`} />
                <Chip icon={<DistanceIcon />} label={`${((generatedRoute?.totalDistance || 0) / 1000).toFixed(2)} km`} />
                <Chip icon={<CarIcon />} label={`${generatedRoute?.bins?.length || 0} bins`} />
              </Box>
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Bins to Collect:</Typography>
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                <List dense>
                  {generatedRoute?.bins?.map((bin, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{index + 1}</Typography>
                      </ListItemIcon>
                      <ListItemText 
                        primary={`Bin ID: ${bin.binId}`} 
                        secondary={`Fill Level: ${bin.fillLevel}%`} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRoute} variant="contained" color="primary">
            Save Route
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoutesPage;
