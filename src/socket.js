import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,  // Increased from 3 (better UX)
  reconnectionDelay: 1000,  // Add delay between attempts
  withCredentials: true,
  transports: ["websocket", "polling"]  // Explicitly specify transports
});

export const initSocket = () => {
  socket.on('connect', () => {
    console.log('Connected to backend. Socket ID:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected. Reason:', reason);
    if (reason === 'io server disconnect') {
      socket.connect(); // Reconnect if server kicked us
    }
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
  });
};
