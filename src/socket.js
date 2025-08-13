import { io } from 'socket.io-client';

// Your existing socket instance
export const socket = io('https://mgt-toozabackend.onrender.com', {
  auth: {
    token: localStorage.getItem('jwt') || document.cookie.replace(/(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/, '$1')
  },
  withCredentials: true,
  transports: ['websocket']
});

// Add this initialization function
export const initSocket = () => {
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  // Add other event listeners as needed
};
