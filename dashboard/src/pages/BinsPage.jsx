import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  BatteryFull as BatteryIcon,
  SignalCellularAlt as SignalIcon,
  DeleteSweep as EmptyIcon,
  RestartAlt as RebootIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';

const BinsPage = () => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBin, setEditingBin] = useState(null);
  const [formData, setFormData] = useState({
    binId: '',
    location: '',
    height: 100,
  });
  
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configBin, setConfigBin] = useState(null);
  const [configData, setConfigData] = useState({
    height: 100,
    interval: 30,
  });

  const { socket } = useSocket();

  useEffect(() => {
    fetchBins();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      console.log('Polling for bin updates...');
      fetchBins(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleBinUpdate = (updatedBin) => {
      console.log('Received real-time bin update:', updatedBin);
      setBins(prevBins => {
        const index = prevBins.findIndex(b => b.binId === updatedBin.binId);
        if (index !== -1) {
          const newBins = [...prevBins];
          newBins[index] = updatedBin;
          return newBins;
        } else {
          return [updatedBin, ...prevBins];
        }
      });
    };

    socket.on('binUpdate', handleBinUpdate);

    return () => {
      socket.off('binUpdate', handleBinUpdate);
    };
  }, [socket]);

  const fetchBins = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      // Add timestamp to prevent caching
      const response = await axios.get(`/api/bins?_t=${new Date().getTime()}`);
      setBins(response.data.data);
    } catch (error) {
      console.error('Error fetching bins:', error);
      // Only show toast on initial load failure to avoid spamming
      if (!isBackground) toast.error('Failed to load bins');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleOpenDialog = (bin = null) => {
    if (bin) {
      setEditingBin(bin);
      setFormData({
        binId: bin.binId,
        location: bin.location,
        height: bin.height || 100,
      });
    } else {
      setEditingBin(null);
      setFormData({
        binId: '',
        location: '',
        height: 100,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBin(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingBin) {
        await axios.put(`/api/bins/${editingBin.binId}`, formData);
        toast.success('Bin updated successfully');
      } else {
        await axios.post('/api/bins', formData);
        toast.success('Bin created successfully');
      }
      handleCloseDialog();
      fetchBins();
    } catch (error) {
      console.error('Error saving bin:', error);
      toast.error(error.response?.data?.message || 'Failed to save bin');
    }
  };

  const handleDelete = async (binId) => {
    if (window.confirm('Are you sure you want to delete this bin?')) {
      try {
        await axios.delete(`/api/bins/${binId}`);
        toast.success('Bin deleted successfully');
        fetchBins();
      } catch (error) {
        console.error('Error deleting bin:', error);
        toast.error('Failed to delete bin');
      }
    }
  };

  const handleEmptyBin = async (binId) => {
    try {
      await axios.post(`/api/bins/${binId}/empty`);
      toast.success('Bin marked as emptied');
      fetchBins();
    } catch (error) {
      console.error('Error emptying bin:', error);
      toast.error('Failed to empty bin');
    }
  };

  const handleReboot = async (binId) => {
    if (window.confirm('Are you sure you want to reboot this bin?')) {
      try {
        await axios.post(`/api/bins/${binId}/command`, { type: 'REBOOT', value: 'true' });
        toast.success('Reboot command sent');
      } catch (error) {
        console.error('Error sending reboot command:', error);
        toast.error('Failed to send reboot command');
      }
    }
  };

  const handleOpenConfigDialog = (bin) => {
    setConfigBin(bin);
    setConfigData({
      height: bin.binHeight || 100,
      interval: bin.reportInterval ? bin.reportInterval / 1000 : 30,
    });
    setConfigDialogOpen(true);
  };

  const handleCloseConfigDialog = () => {
    setConfigDialogOpen(false);
    setConfigBin(null);
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfigData({
      ...configData,
      [name]: value,
    });
  };

  const handleSaveConfig = async () => {
    try {
      // Send Height Command
      if (configData.height) {
        await axios.post(`/api/bins/${configBin.binId}/command`, { 
          type: 'HEIGHT', 
          value: configData.height.toString() 
        });
      }
      
      // Send Interval Command (convert seconds to ms)
      if (configData.interval) {
        await axios.post(`/api/bins/${configBin.binId}/command`, { 
          type: 'INTERVAL', 
          value: (configData.interval * 1000).toString() 
        });
      }

      toast.success('Configuration commands sent');
      handleCloseConfigDialog();
    } catch (error) {
      console.error('Error sending config commands:', error);
      toast.error('Failed to send configuration');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'FULL': return 'error';
      case 'WARNING': return 'warning';
      case 'NORMAL': return 'success';
      case 'OFFLINE': return 'default';
      default: return 'default';
    }
  };

  const getFillColor = (level) => {
    if (level >= 85) return 'error';
    if (level >= 70) return 'warning';
    return 'success';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Bins Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenDialog()}
        >
          Add Bin
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : bins.length === 0 ? (
        <Alert severity="info">No bins found. Add a bin to get started.</Alert>
      ) : (
        <Grid container spacing={3}>
          {bins.map((bin) => (
            <Grid item xs={12} sm={6} md={4} key={bin._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {bin.binId}
                    </Typography>
                    <Chip 
                      label={bin.status} 
                      color={getStatusColor(bin.status)} 
                      size="small" 
                    />
                  </Box>
                  
                  <Typography color="text.secondary" gutterBottom>
                    Location: {bin.location}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Height: {bin.binHeight || 100}cm
                  </Typography>
                  
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Fill Level</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Number(bin.fillLevel).toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={bin.fillLevel} 
                      color={getFillColor(bin.fillLevel)}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Tooltip title="Battery Level">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BatteryIcon fontSize="small" color="action" />
                        <Typography variant="caption">{bin.batteryLevel}%</Typography>
                      </Box>
                    </Tooltip>
                    <Tooltip title="Signal Strength">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SignalIcon fontSize="small" color="action" />
                        <Typography variant="caption">{bin.rssi || 'N/A'} dBm</Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                  
                  <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                    Last Updated: {bin.lastUpdate ? format(new Date(bin.lastUpdate), 'MMM d, HH:mm:ss') : 'Never'}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="Mark as Emptied">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleEmptyBin(bin.binId)}
                        disabled={bin.fillLevel === 0}
                      >
                        <EmptyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reboot Bin">
                      <IconButton 
                        color="warning" 
                        onClick={() => handleReboot(bin.binId)}
                      >
                        <RebootIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Configure Bin">
                      <IconButton 
                        onClick={() => handleOpenConfigDialog(bin)}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpenDialog(bin)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(bin.binId)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{editingBin ? 'Edit Bin' : 'Add New Bin'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="binId"
            label="Bin ID"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.binId}
            onChange={handleInputChange}
            disabled={!!editingBin} // Cannot change ID of existing bin
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="location"
            label="Location"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.location}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="height"
            label="Height (cm)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.height}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBin ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onClose={handleCloseConfigDialog}>
        <DialogTitle>Configure Bin: {configBin?.binId}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            These settings will be sent to the bin as commands. They will take effect when the bin next reports in.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            name="height"
            label="Bin Height (cm)"
            type="number"
            fullWidth
            variant="outlined"
            value={configData.height}
            onChange={handleConfigChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="interval"
            label="Report Interval (seconds)"
            type="number"
            fullWidth
            variant="outlined"
            value={configData.interval}
            onChange={handleConfigChange}
            helperText="How often the bin sends status updates"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfigDialog}>Cancel</Button>
          <Button onClick={handleSaveConfig} variant="contained" color="primary">
            Send Commands
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BinsPage;
