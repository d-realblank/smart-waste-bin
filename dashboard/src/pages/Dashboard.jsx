import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Delete as BinIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await axios.get('/api/dashboard/overview');
      setOverview(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  const stats = [
    {
      title: 'Total Bins',
      value: overview?.totalBins || 0,
      icon: <BinIcon sx={{ fontSize: 40 }} />,
      color: 'primary.main',
    },
    {
      title: 'Full Bins',
      value: overview?.fullBins || 0,
      icon: <ErrorIcon sx={{ fontSize: 40 }} />,
      color: 'error.main',
    },
    {
      title: 'Warning Bins',
      value: overview?.warningBins || 0,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: 'warning.main',
    },
    {
      title: 'Active Alerts',
      value: overview?.activeAlerts || 0,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: 'warning.main',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h3">{stat.value}</Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Fill Level
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={overview?.avgFillLevel || 0}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="h6">
                  {overview?.avgFillLevel?.toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
