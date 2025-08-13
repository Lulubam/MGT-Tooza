import { io } from 'socket.io-client';

const SOCKET_URL = 'https://mgt-toozabackend.onrender.com';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  autoConnect: false, // Connect manually after auth
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  auth: {
    token: localStorage.getItem('jwt') || ''
  }
});

// Connection management
export const connectSocket = () => {
  socket.connect();
};

export const initSocketEvents = () => {
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
