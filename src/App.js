// App.js - Final Corrected Version
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// =========================================================================
// AI Players Configuration
// =========================================================================
const AI_PLAYERS = {
  otu: { name: 'Otu', level: 'beginner', avatar: '🤖' },
  ase: { name: 'Ase', level: 'beginner', avatar: '🎭' },
  dede: { name: 'Dede', level: 'intermediate', avatar: '🎪' },
  ogbologbo: { name: 'Ogbologbo', level: 'advanced', avatar: '🎯' },
  agba: { name: 'Agba', level: 'advanced', avatar: '👑' }
};

// =========================================================================
// Lobby Component
// =========================================================================
const Lobby = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onJoin(playerName, roomCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🃏 Trick Game</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Code (optional)</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
              placeholder="Join existing room"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
          >
            {roomCode ? '🚪 Join Room' : '🎮 Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// GameRoom Component
// =========================================================================
const GameRoom = ({ room, player, roomCode, socket }) => {
  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;

  const handleLeaveRoom = () => {
    if (socket && player && roomCode) {
      socket.emit('leave-room', { playerId: player._id, roomCode });
      window.location.reload();
    }
  };

  const handlePlayCard = (card) => {
    if (socket && isMyTurn) {
      socket.emit('game-action', {
        action: 'playCard',
        data: { cardId: card.id }
      });
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-6 text-white">
        <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
        <button
          onClick={handleLeaveRoom}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
        >
          Leave Room
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.players.map((p, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border-2 ${
                  p.isEliminated
                    ? 'bg-red-100 border-red-300 opacity-60'
                    : p.isCurrent
                      ? 'bg-yellow-100 border-yellow-400 shadow-lg'
                      : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">
                    {p.isAI ? AI_PLAYERS[p.username.toLowerCase()]?.avatar || '🤖' : '👤'}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-bold text-gray-800">{p.username}</span>
                      {p.isAI && <span className="text-xs bg-gray-200 px-2 py-1 rounded">AI</span>}
                      {p.isDealer && <span className="text-xs bg-blue-200 px-2 py-1 rounded">Dealer</span>}
                    </div>
                    <div className="text-sm text-gray-600">
                      Cards: {p.cards?.length || 0} | Points: {p.points || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {['waiting', 'dealing'].includes(room.gamePhase) && (
            <>
              <div className="bg-white/90 p-4 rounded-xl shadow-lg">
                <h3 className="font-bold text-gray-800 mb-3">🤖 AI Players</h3>
                <div className="space-y-2">
                  {Object.entries(AI_PLAYERS).map(([key, config]) => {
                    const isAdded = room.players.some(p => p.username === config.name);
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (socket && roomCode) {
                            socket.emit('manage-ai', {
                              action: isAdded ? 'remove' : 'add',
                              aiKey: key,
                              roomCode
                            });
                          }
                        }}
                        disabled={room.players.length >= 6 && !isAdded}
                        className={`w-full p-2 rounded flex items-center space-x-2 text-sm transition ${
                          isAdded
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } disabled:opacity-50`}
                      >
                        <span>{config.avatar}</span>
                        <span>{config.name} ({config.level})</span>
                        <span className="ml-auto font-bold">
                          {isAdded ? '❌ Remove' : '✅ Add'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  if (socket && player) {
                    socket.emit('game-action', { action: 'startGame' });
                  }
                }}
                disabled={room.players.filter(p => !p.isEliminated).length < 2}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white py-3 rounded-lg"
              >
                Start Game ({room.players.filter(p => !p.isEliminated).length}/2+)
              </button>
            </>
          )}
        </div>
      </div>

      {isMyTurn && currentPlayer && (
        <div className="mt-8">
          <h3 className="text-white font-bold mb-4">Your Cards</h3>
          <div className="flex gap-2 flex-wrap">
            {currentPlayer.cards.map((card, i) => (
              <button
                key={i}
                onClick={() => handlePlayCard(card)}
                className="bg-white p-1 rounded shadow hover:scale-105 transition transform"
              >
                <div className="w-16 h-24 border-2 border-gray-300 rounded flex items-center justify-center text-xl font-bold">
                  {card.rank} {card.suit}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Main App Component
// =========================================================================
export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ Fixed: Removed trailing spaces in URL
    const serverUrl = process.env.NODE_ENV === 'production'
      ? 'https://mgt-toozabackend.onrender.com' // ← No extra spaces!
      : 'http://localhost:3001';

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      setError('Failed to connect to game server. Please try again.');
      setLoading(false);
    });

    newSocket.on('error', (data) => {
      console.error('❌ Server error:', data);
      setError(data.message || 'An error occurred');
    });

    newSocket.on('game-state', (gameState) => {
      console.log('🟢 Received game state:', gameState);
      setRoom(gameState);
      setLoading(false);
    });

    newSocket.on('player-joined', (data) => {
      console.log('👥 Player joined:', data);
    });

    newSocket.on('game-over', (data) => {
      console.log('🏆 Game over:', data);
      alert(`Game Over! ${data.message}`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  const createRoom = async (playerName) => {
    setLoading(true);
    setError(null);

    try {
      const serverUrl = process.env.NODE_ENV === 'production'
        ? 'https://mgt-toozabackend.onrender.com' // ✅ Fixed
        : 'http://localhost:3001';

      const res = await fetch(`${serverUrl}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);

        if (socket?.connected) {
          console.log('🎯 Emitting join-game:', { playerId: data.playerId, roomCode: data.roomCode });
          socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
        } else {
          throw new Error('Socket not connected');
        }
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('❌ Error creating room:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const joinRoom = async (playerName, code) => {
    setLoading(true);
    setError(null);

    try {
      const serverUrl = process.env.NODE_ENV === 'production'
        ? 'https://mgt-toozabackend.onrender.com' // ✅ Fixed
        : 'http://localhost:3001';

      const res = await fetch(`${serverUrl}/api/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode: code }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(code);

        if (socket?.connected) {
          console.log('🎯 Emitting join-game:', { playerId: data.playerId, roomCode: code });
          socket.emit('join-game', { playerId: data.playerId, roomCode: code });
        } else {
          throw new Error('Socket not connected');
        }
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (err) {
      console.error('❌ Error joining room:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJoin = (playerName, code) => {
    if (code && code.trim()) {
      joinRoom(playerName, code.trim().toUpperCase());
    } else {
      createRoom(playerName);
    }
  };

  if (!player) {
    return (
      <>
        <Lobby onJoin={handleJoin} />
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Connecting to game...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}
      </>
    );
  }

  return <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />;
}
