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

const Lobby = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = () => {
    if (playerName.trim()) {
      onJoin(playerName, roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🃏 Trick Game</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your name"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Code (optional)</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter code to join"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!playerName.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50"
          >
            {roomCode ? '🚪 Join Room' : '🎮 Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PlayerDisplay = ({ player, isCurrentPlayer }) => {
  const icon = player.isAI
    ? Object.values(AI_PLAYERS).find(ai => ai.name === player.username)?.avatar || '🤖'
    : '👤';

  return (
    <div className={`p-4 rounded-xl border-2 ${
      isCurrentPlayer ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-gray-200'
    } ${player.isEliminated ? 'opacity-60' : ''}`}>
      <div className="flex items-center space-x-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <div className="font-bold text-gray-800">{player.username}</div>
          <div className="text-sm text-gray-600">
            Cards: {player.cards?.length || 0} | Points: {player.points || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

const GameRoom = ({ room, player, roomCode, socket }) => {
  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;

  const handlePlayCard = (card) => {
    if (socket && isMyTurn) {
      socket.emit('game-action', { action: 'playCard', cardId: card.id });
    }
  };

  const handleStartGame = () => {
    if (socket) {
      socket.emit('game-action', { action: 'startGame' });
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-6 text-white">
        <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
        >
          Leave Room
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.players.map((p, i) => (
              <PlayerDisplay key={i} player={p} isCurrentPlayer={p.isCurrent && !p.isEliminated} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {['waiting', 'dealing'].includes(room.gamePhase) && (
            <div className="bg-white/90 p-4 rounded-xl shadow-lg">
              <h3 className="font-bold text-gray-800 mb-3">🤖 AI Players</h3>
              {Object.entries(AI_PLAYERS).map(([key, config]) => {
                const isAdded = room.players.some(p => p.username === config.name && p.isAI);
                return (
                  <button
                    key={key}
                    onClick={() => socket.emit('manage-ai', { action: isAdded ? 'remove' : 'add', aiKey: key })}
                    disabled={room.players.length >= 6 && !isAdded}
                    className={`w-full p-2 rounded text-sm ${isAdded ? 'bg-red-100' : 'bg-green-100'} disabled:opacity-50`}
                  >
                    {isAdded ? '❌ Remove ' : '✅ Add '} {config.name}
                  </button>
                );
              })}
            </div>
          )}

          {room.players.filter(p => !p.isEliminated).length >= 2 && (
            <button
              onClick={handleStartGame}
              className="w-full bg-green-600 text-white py-2 rounded"
            >
              Start Game
            </button>
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
                className="bg-white p-1 rounded shadow"
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

export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const serverUrl = process.env.NODE_ENV === 'production'
      ? 'https://mgt-toozabackend.onrender.com'
      : 'http://localhost:3001';

    const newSocket = io(serverUrl, {
      transports: ['websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket error:', err);
      setError('Failed to connect to server');
    });

    newSocket.on('game-state', (state) => setRoom(state));
    newSocket.on('error', (data) => setError(data.message));

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const createRoom = async (playerName) => {
    setLoading(true);
    setError('');
    try {
      const serverUrl = process.env.NODE_ENV === 'production'
        ? 'https://mgt-toozabackend.onrender.com'
        : 'http://localhost:3001';

      const res = await fetch(`${serverUrl}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
      } else {
        throw new Error(data.error || 'Failed to create room');
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
      const serverUrl = process.env.NODE_ENV === 'production'
        ? 'https://mgt-toozabackend.onrender.com'
        : 'http://localhost:3001';

      const res = await fetch(`${serverUrl}/api/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode: code })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(code);
        socket.emit('join-game', { playerId: data.playerId, roomCode: code });
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (name, code) => {
    if (code) joinRoom(name, code);
    else createRoom(name);
  };

  if (!player) {
    return (
      <>
        <Lobby onJoin={handleJoin} />
        {loading && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">Loading...</div>}
        {error && <div className="bg-red-600 text-white p-3">{error}</div>}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      {error && <div className="bg-red-600 text-white p-3 rounded mb-4">{error}</div>}
      <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />
    </div>
  );
}
