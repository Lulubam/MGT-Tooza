import { io } from 'socket.io-client';

export const socket = io('https://mgt-toozabackend.onrender.com', {
  auth: {
    token: localStorage.getItem('jwt') || document.cookie.replace(/(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/, '$1')
  },
  withCredentials: true,
  transports: ['websocket']
});
