import React from 'react';
import { Typography } from '@mui/material';

const AlertsPage = () => {
  return (
    <div>
      <Typography variant="h4">Alerts Management</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        This page will display all system alerts with filtering, acknowledgment, and resolution capabilities.
      </Typography>
    </div>
  );
};

export default AlertsPage;
