import { io } from 'socket.io-client';

const SOCKET_URL = 'https://mgt-toozabackend.onrender.com';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  autoConnect: false,
  reconnectionAttempts: 5,
  auth: {
    token: localStorage.getItem('jwt')
  }
});

// Renamed to match what App.js expects
export const initSocket = () => {
  socket.connect();
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });
};
