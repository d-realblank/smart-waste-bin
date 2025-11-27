import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');
  const [stats, setStats] = useState(null);
  const [efficiency, setEfficiency] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, efficiencyRes, alertsRes] = await Promise.all([
        axios.get(`/api/dashboard/stats?period=${timeRange}`),
        axios.get(`/api/dashboard/collection-efficiency?period=${timeRange}`),
        axios.get('/api/dashboard/alerts-summary')
      ]);

      setStats(statsRes.data.data);
      setEfficiency(efficiencyRes.data.data);
      setAlertsSummary(alertsRes.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Analytics & Reports</Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7">Last 7 Days</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 3 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Collection Efficiency
              </Typography>
              <Typography variant="h4">
                {efficiency?.avgEfficiency || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Route completion vs estimated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Collections
              </Typography>
              <Typography variant="h4">
                {stats?.collections?.total || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bins emptied in period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Alert Resolution Rate
              </Typography>
              <Typography variant="h4">
                {stats?.alerts?.resolutionRate || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.alerts?.resolved} of {stats?.alerts?.total} alerts resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg Collection Time
              </Typography>
              <Typography variant="h4">
                {stats?.collections?.avgTime || 0}m
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Per route
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Fill Level Trends */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Fill Level Trends (Daily Average)
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={stats?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id.date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgFillLevel" 
                  name="Avg Fill %" 
                  stroke="#1976d2" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="maxFillLevel" 
                  name="Max Fill %" 
                  stroke="#dc004e" 
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Alerts Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Alerts by Type
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={alertsSummary?.byType || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {(alertsSummary?.byType || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Route Completion Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Route Completion Statistics
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={[
                  {
                    name: 'Routes',
                    Completed: efficiency?.completedRoutes || 0,
                    Cancelled: efficiency?.cancelledRoutes || 0,
                    Total: efficiency?.totalRoutes || 0,
                  }
                ]}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Completed" fill="#4caf50" />
                <Bar dataKey="Cancelled" fill="#f44336" />
                <Bar dataKey="Total" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
