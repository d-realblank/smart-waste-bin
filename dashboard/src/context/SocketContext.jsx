import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    // Listen for bin updates
    socketInstance.on('binUpdate', (data) => {
      console.log('📡 Bin update received:', data);
    });

    // Listen for new alerts
    socketInstance.on('newAlert', (alert) => {
      console.log('🚨 New alert:', alert);
      
      const severity = alert.priority === 'CRITICAL' ? 'error' : 
                      alert.priority === 'HIGH' ? 'warning' : 'info';
      
      toast[severity](`New Alert: ${alert.message}`, {
        position: 'top-right',
        autoClose: 5000,
      });
    });

    // Listen for bin emptied
    socketInstance.on('binEmptied', (bin) => {
      console.log('✅ Bin emptied:', bin);
      toast.success(`Bin ${bin.binId} has been emptied`);
    });

    // Listen for route started
    socketInstance.on('routeStarted', (route) => {
      console.log('🚀 Route started:', route);
      toast.info(`Collection route started: ${route.routeName}`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribeToBin = (binId) => {
    if (socket) {
      socket.emit('subscribe', binId);
    }
  };

  const unsubscribeFromBin = (binId) => {
    if (socket) {
      socket.emit('unsubscribe', binId);
    }
  };

  const value = {
    socket,
    connected,
    subscribeToBin,
    unsubscribeFromBin,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
