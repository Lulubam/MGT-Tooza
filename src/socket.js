import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

// Initialize Socket.IO connection
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Connect manually after user joins
  reconnectionAttempts: 3,
  withCredentials: true
});

// Socket event handlers
export const initSocket = () => {
  socket.on('connect', () => console.log('Connected to backend'));
  socket.on('disconnect', () => console.log('Disconnected'));
};
