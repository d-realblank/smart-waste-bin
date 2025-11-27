import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert as MuiAlert,
} from '@mui/material';
import {
  CheckCircle as ResolveIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [filter, setFilter] = useState('ACTIVE'); // ACTIVE, RESOLVED, ALL

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      let url = '/api/alerts';
      if (filter !== 'ALL') {
        url += `?status=${filter}`;
      }
      
      const response = await axios.get(url);
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClick = (alert) => {
    setSelectedAlert(alert);
    setResolveNotes('');
    setResolveDialogOpen(true);
  };

  const handleResolveSubmit = async () => {
    try {
      await axios.put(`/api/alerts/${selectedAlert._id}/resolve`, {
        notes: resolveNotes
      });
      
      toast.success('Alert resolved successfully');
      setResolveDialogOpen(false);
      fetchAlerts(); // Refresh list
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Alerts Management</Typography>
        <Box>
          <Button 
            variant={filter === 'ACTIVE' ? 'contained' : 'outlined'} 
            onClick={() => setFilter('ACTIVE')}
            sx={{ mr: 1 }}
          >
            Active
          </Button>
          <Button 
            variant={filter === 'RESOLVED' ? 'contained' : 'outlined'} 
            onClick={() => setFilter('RESOLVED')}
            sx={{ mr: 1 }}
          >
            Resolved
          </Button>
          <Button 
            variant={filter === 'ALL' ? 'contained' : 'outlined'} 
            onClick={() => setFilter('ALL')}
          >
            All
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : alerts.length === 0 ? (
        <MuiAlert severity="info">No alerts found matching current filter.</MuiAlert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Bin ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert._id}>
                  <TableCell>
                    {format(new Date(alert.createdAt), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell>{alert.binId}</TableCell>
                  <TableCell>{alert.alertType}</TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell>
                    <Chip 
                      label={alert.priority} 
                      color={getPriorityColor(alert.priority)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={alert.status} 
                      color={alert.status === 'ACTIVE' ? 'error' : 'success'} 
                      variant={alert.status === 'ACTIVE' ? 'filled' : 'outlined'}
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {alert.status === 'ACTIVE' && (
                      <IconButton 
                        color="success" 
                        onClick={() => handleResolveClick(alert)}
                        title="Resolve Alert"
                      >
                        <ResolveIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)}>
        <DialogTitle>Resolve Alert</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {selectedAlert?.message}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Resolution Notes"
            fullWidth
            multiline
            rows={3}
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResolveSubmit} variant="contained" color="primary">
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsPage;
