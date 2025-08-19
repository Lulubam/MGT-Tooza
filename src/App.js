// App.js - Trick-Taking Card Game with Manual Dealing
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

  const handleSubmit = () => {
    if (playerName.trim()) {
      onJoin(playerName, roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🃏 Trick Game</h1>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
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
// Player Display Component
// =========================================================================
const PlayerDisplay = ({ player, isCurrentPlayer }) => {
  const getPlayerTypeIcon = (username) => {
    const ai = Object.values(AI_PLAYERS).find(ai => ai.name === username);
    return ai ? ai.avatar : '👤';
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      player.isEliminated 
        ? 'bg-red-100 border-red-300 opacity-60' 
        : isCurrentPlayer 
          ? 'bg-yellow-100 border-yellow-400 shadow-lg' 
          : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <span className="text-3xl">{getPlayerTypeIcon(player.username)}</span>
          {isCurrentPlayer && !player.isEliminated && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          )}
          {player.isEliminated && (
            <div className="absolute -top-1 -right-1 text-red-500 text-xl">❌</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-bold text-gray-800">{player.username}</span>
            {player.isAI && <span className="text-xs bg-gray-200 px-2 py-1 rounded">AI</span>}
            {player.isDealer && <span className="text-xs bg-blue-200 px-2 py-1 rounded">Dealer</span>}
          </div>
          <div className="text-sm text-gray-600">
            Cards: {player.cards?.length || 0} | Points: {player.points || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// Trick Display Component
// =========================================================================
const TrickDisplay = ({ currentTrick }) => {
  if (currentTrick.length === 0) return null;

  return (
    <div className="bg-white/90 p-4 rounded-xl shadow-lg mb-4">
      <h3 className="font-semibold text-gray-800 mb-2">Current Trick</h3>
      <div className="flex gap-2 justify-center flex-wrap">
        {currentTrick.map((play, index) => (
          <div key={index} className="text-center">
            <div className="text-sm font-medium text-gray-700">{play.player}</div>
            <div className="w-16 h-24 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center text-2xl">
              {play.card.rank[0]}{play.card.suit[0]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// AI Management Panel
// =========================================================================
const AIManagementPanel = ({ onAIAction, gameState }) => {
  const addedAIs = gameState?.players?.filter(p => p.isAI).map(p => p.username) || [];

  return (
    <div className="bg-white/90 p-4 rounded-xl shadow-lg mb-4">
      <h3 className="font-bold text-gray-800 mb-3">🤖 AI Players</h3>
      <div className="space-y-2">
        {Object.entries(AI_PLAYERS).map(([key, config]) => {
          const isAdded = addedAIs.includes(config.name);
          return (
            <button
              key={key}
              onClick={() => onAIAction(isAdded ? 'remove' : 'add', key)}
              disabled={gameState?.players?.length >= 4 && !isAdded}
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
  );
};

// =========================================================================
// Manual Dealing Panel
// =========================================================================
const ManualDealingPanel = ({ gameState, socket, currentPlayer }) => {
  const handleStartGame = () => {
    if (socket && currentPlayer) {
      socket.emit('game-action', { action: 'start-game', data: { playerId: currentPlayer._id } });
    }
  };

  const activePlayers = gameState?.players?.filter(p => !p.isEliminated) || [];
  const canStart = activePlayers.length >= 2 && gameState?.status === 'waiting';

  return (
    <div className="bg-white/90 p-4 rounded-xl shadow-lg mb-4">
      <h3 className="font-bold text-gray-800 mb-3">🎮 Game Control</h3>
      <button
        onClick={handleStartGame}
        disabled={!canStart}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          canStart
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Start Game ({activePlayers.length}/2+)
      </button>
    </div>
  );
};

// =========================================================================
// Game Rules Display
// =========================================================================
const GameRulesDisplay = () => (
  <div className="bg-white/90 p-4 rounded-xl shadow-lg mb-4">
    <h3 className="font-bold text-gray-800 mb-3">📜 Rules</h3>
    <ul className="text-sm text-gray-700 space-y-1">
      <li>• Avoid winning tricks (1 point each)</li>
      <li>• Black 3 (♠3) = 12 points</li>
      <li>• Red 3 = 6 points, 4 = 4 points, A = 2 points</li>
      <li>• First to 12+ points is eliminated</li>
      <li>• Last player standing wins</li>
    </ul>
  </div>
);

// =========================================================================
// Card Back Component
// =========================================================================
const CardBack = ({ className = '' }) => (
  <div className={`relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 rounded-xl shadow-lg border-2 border-gray-800 w-20 h-28 ${className}`}>
    <div className="absolute inset-2 border border-blue-400 rounded-lg">
      <div className="absolute inset-2 border border-blue-300 rounded-md">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-blue-200 text-2xl font-bold">T</div>
        </div>
      </div>
    </div>
  </div>
);

// =========================================================================
// Game Room Component
// =========================================================================
const GameRoom = ({ room, player, roomCode, socket }) => {
  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { playerId: player._id, roomCode });
      window.location.reload();
    }
  };

  const handlePlayCard = (card) => {
    if (socket && isMyTurn) {
      socket.emit('game-action', {
        action: 'play-card',
        data: {
          playerId: player._id,
          cardId: card.id
        }
      });
    }
  };

  if (!room) {
    return (
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-800">Loading game room...</div>
        </div>
      </div>
    );
  }

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

      <TrickDisplay currentTrick={room.currentTrick} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.players.map((p, index) => (
              <PlayerDisplay
                key={index}
                player={p}
                isCurrentPlayer={p.isCurrent && !p.isEliminated}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {['waiting', 'dealing'].includes(room.gamePhase) && (
            <>
              <AIManagementPanel onAIAction={(action, aiKey) => {
                socket.emit('manage-ai', { action, aiKey });
              }} gameState={room} />
              <ManualDealingPanel
                gameState={room}
                socket={socket}
                currentPlayer={currentPlayer}
              />
            </>
          )}
          <GameRulesDisplay />
        </div>
      </div>

      {/* Player's Hand */}
      {isMyTurn && currentPlayer && (
        <div className="mt-8">
          <h3 className="text-white font-bold mb-4">Your Cards</h3>
          <div className="flex gap-2 flex-wrap">
            {currentPlayer.cards.map((card, index) => (
              <button
                key={index}
                onClick={() => handlePlayCard(card)}
                className="bg-white p-1 rounded shadow hover:scale-105 transition transform"
              >
                <div className="w-16 h-24 border-2 border-gray-300 rounded flex items-center justify-center text-xl font-bold">
                  {card.rank} {card.suit[0]}
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
      console.log('Socket connected successfully');
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to game server. Please try again.');
    });

    newSocket.on('game-state', (gameState) => {
      setRoom(gameState);
    });

    newSocket.on('game-message', (data) => {
      console.log('Game Message:', data.message);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const createRoom = async (playerName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });
      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        if (socket?.connected) {
          socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
        } else {
          throw new Error('Socket not connected');
        }
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
    setError(null);
    try {
      const res = await fetch('/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode: code })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(code);
        if (socket?.connected) {
          socket.emit('join-game', { playerId: data.playerId, roomCode: code });
        } else {
          throw new Error('Socket not connected');
        }
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (err) {
      setError(err.message);
    } finally {
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
    return <Lobby onJoin={handleJoin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      {error && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">✕</button>
        </div>
      )}
      <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />
    </div>
  );
}
