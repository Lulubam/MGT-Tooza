import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './Lobby';
import GameRoom from './GameRoom';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null); // {code, players, yourHand}
  const [player, setPlayer] = useState(null); // {id, name}

  // Initialize socket
  useEffect(() => {
    const newSocket = io('https://mgt-toozabackend.onrender.com', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected, transport:', newSocket.io.engine.transport.name);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error.message);
      // Notify user (e.g., show error message in UI)
    });

    newSocket.on('game-state', (state) => {
      const filteredState = {
        ...state,
        players: state.players.map(p => ({
          ...p,
          cards: p.id === player?.id ? p.cards : []
        }))
      };
      setRoom(filteredState);
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [player?.id]);

  const joinRoom = async (name, code, isCreating) => {
    try {
      const endpoint = isCreating ? 'create-room' : 'join-room';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`https://mgt-toozabackend.onrender.com/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ playerName: name, roomCode: code }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success) {
        setPlayer({ id: data.playerId, name });
        socket.emit('join-game', { 
          playerId: data.playerId, 
          roomCode: data.roomCode 
        });
      } else {
        console.error('Join room failed:', data.error);
        // Notify user
      }
    } catch (error) {
      console.error('Join room error:', error.message);
      // Notify user
    }
  };

  return (
    <div className="app">
      {!room ? (
        <Lobby onJoin={joinRoom} />
      ) : (
        <GameRoom 
          socket={socket} 
          room={room} 
          player={player} 
        />
      )}
    </div>
  );
}
