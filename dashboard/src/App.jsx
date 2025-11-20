import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BinsPage from './pages/BinsPage';
import AlertsPage from './pages/AlertsPage';
import RoutesPage from './pages/RoutesPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Components
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif',
  },
});

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="bins" element={<BinsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
