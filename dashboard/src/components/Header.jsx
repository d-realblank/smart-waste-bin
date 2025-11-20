import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle,
} from '@mui/material/Icon';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'white',
        color: 'text.primary',
        boxShadow: 1,
      }}
    >
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Smart Waste Management System
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: connected ? 'success.light' : 'error.light',
              color: 'white',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'white',
              }}
            />
            <Typography variant="caption">
              {connected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Box>

          <IconButton color="inherit">
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.firstName} {user?.lastName}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.role}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
