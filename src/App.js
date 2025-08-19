// App.js
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const AI_PLAYERS = {
  otu: { name: 'Otu', level: 'beginner', avatar: '🤖' },
  ase: { name: 'Ase', level: 'beginner', avatar: '🎭' },
  dede: { name: 'Dede', level: 'intermediate', avatar: '🎪' },
  ogbologbo: { name: 'Ogbologbo', level: 'advanced', avatar: '🎯' },
  agba: { name: 'Agba', level: 'advanced', avatar: '👑' }
};

function App() {
  const [player, setPlayer] = useState(null);
  const [room, setRoom] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const serverUrl = process.env.NODE_ENV === 'production'
      ? 'https://mgt-toozabackend.onrender.com'
      : 'http://localhost:3001';

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connect error:', err);
      setError('Failed to connect to server');
    });

    newSocket.on('game-state', (gameState) => {
      setRoom(gameState);
    });

    newSocket.on('game-message', (data) => {
      setMessages(prev => [...prev.slice(-4), { ...data, id: Date.now() }]);
      setTimeout(() => setMessages(prev => prev.slice(1)), 5000);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const createRoom = async (playerName) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });
      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (playerName, code) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode: code })
      });
      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(code);
        socket.emit('join-game', { playerId: data.playerId, roomCode: code });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (name, code) => {
    if (code) joinRoom(name, code.trim().toUpperCase());
    else createRoom(name);
  };

  const handleAIAction = (action, aiKey) => {
    if (socket && roomCode) {
      socket.emit('manage-ai', { action, aiKey, roomCode });
    }
  };

  const handleStartGame = () => {
    if (socket && player && roomCode) {
      socket.emit('game-action', { action: 'start-game', playerId: player._id });
    }
  };

  const currentPlayer = room?.players?.find(p => p._id === player?._id);

  if (!player) {
    return <Lobby onJoin={handleJoin} />;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6 text-white">
          <h1 className="text-2xl font-bold">Trick-Taking Game</h1>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Leave Room
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <GameDisplay room={room} player={player} />
          </div>
          <div className="lg:col-span-1">
            <AIManagementPanel onAIAction={handleAIAction} gameState={room} />
            <button
              onClick={handleStartGame}
              disabled={room.players.filter(p => !p.isEliminated).length < 2}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white py-3 rounded-lg mt-4"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add your components: Lobby, GameDisplay, AIManagementPanel, etc.
// (Kept as in original for brevity)

export default App;
