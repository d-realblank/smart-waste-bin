import React from 'react';
import { Typography } from '@mui/material';

const BinsPage = () => {
  return (
    <div>
      <Typography variant="h4">Bins Management</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        This page will display all waste bins with real-time status, fill levels, and management controls.
      </Typography>
    </div>
  );
};

export default BinsPage;
