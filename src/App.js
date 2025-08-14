import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
// =========================================================================
// Main App Component
// This is the root component that handles state and routing.
// =========================================================================
export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connect to the backend Socket.IO server
    const newSocket = io('https://mgt-toozabackend.onrender.com', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    // Set up event listeners for the socket
    newSocket.on('connect', () => {
      console.log('Socket connected, transport:', newSocket.io.engine.transport.name);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setError('Failed to connect to server');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed after 3 attempts');
      setError('Failed to reconnect to server');
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error.message);
      setError(error.message);
    });

    // Handle game state updates from the server
    newSocket.on('game-state', (state) => {
      // Filter out other players' cards for security and to prevent cheating
      const filteredState = {
        ...state,
        players: state.players.map(p => ({
          ...p,
          cards: p._id === player?._id ? p.cards : []
        }))
      };
      setRoom(filteredState);
    });

    setSocket(newSocket);
    // Disconnect socket on component unmount
    return () => newSocket.disconnect();
  }, [player?._id]);

  // Function to create a new room
  const createRoom = async (playerName) => {
    try {
      setError(null);
      const res = await fetch('https://mgt-toozabackend.onrender.com/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        // After creating the room via HTTP, join it via WebSocket
        socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Create room error:', error.message);
      setError(error.message);
    }
  };

  // Function to join an existing room
  const joinExistingRoom = async (playerName, roomCode) => {
    try {
      setError(null);
      const res = await fetch('https://mgt-toozabackend.onrender.com/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        // After joining the room via HTTP, join it via WebSocket
        socket.emit('join-game', { playerId: data.playerId, roomCode });
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Join room error:', error.message);
      setError(error.message);
    }
  };

  // This function decides whether to create or join a room
  const handleJoinOrCreate = (playerName, roomCode) => {
    if (roomCode) {
      joinExistingRoom(playerName, roomCode);
    } else {
      createRoom(playerName);
    }
  };

  return (
    <div className="app">
      {error && <div className="error">{error}</div>}
      {!room ? (
        <Lobby onJoin={handleJoinOrCreate} />
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
