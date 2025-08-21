// App.jsvs2aqwen
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// AI Players Configuration
const AI_PLAYERS = {
  otu: { name: 'Otu', level: 'beginner', avatar: '🤖' },
  ase: { name: 'Ase', level: 'beginner', avatar: '🎭' },
  dede: { name: 'Dede', level: 'intermediate', avatar: '🎪' },
  ogbologbo: { name: 'Ogbologbo', level: 'advanced', avatar: '🎯' },
  agba: { name: 'Agba', level: 'advanced', avatar: '👑' }
};

// Lobby Component
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
              required
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

// Card Component with Color
const Card = ({ card, onClick, disabled, selected }) => {
  const suitColor = card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black';

  return (
    <button
      onClick={() => !disabled && onClick && onClick(card)}
      disabled={disabled}
      className={`relative bg-white rounded-xl shadow-lg border-2 w-20 h-28 transition-all duration-200 ${
        selected ? 'ring-4 ring-blue-400 -translate-y-3 z-10' : 'hover:shadow-xl hover:-translate-y-1'
      } ${disabled ? 'opacity-60' : 'hover:scale-105'}`}
    >
      <div className="absolute inset-1 border border-gray-300 rounded-lg"></div>
      <div className={`absolute top-1 left-1 text-xs font-bold ${suitColor}`}>
        <div>{card.rank}</div>
        <div className="text-base -mt-1">{card.suit}</div>
      </div>
      <div className="absolute bottom-1 right-1 text-xs font-bold transform rotate-180">
        <div>{card.rank}</div>
        <div className={`${suitColor} text-base -mt-1`}>{card.suit}</div>
      </div>
    </button>
  );
};

// Player Display Component
const PlayerDisplay = ({ player, isCurrentPlayer }) => {
  const icon = Object.values(AI_PLAYERS).find(ai => ai.name === player.username)?.avatar || '👤';

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
          <span className="text-3xl">{icon}</span>
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

// Dealing Choice Panel (Visible only to dealer)
const DealingChoicePanel = ({ socket, roomCode, playerId }) => {
  const handleChoice = (mode, selection) => {
    socket.emit('game-action', {
      action: 'set-dealing-mode',
      mode,
      selection,
      playerId
    });
  };

  return (
    <div className="bg-white/90 p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🃏 Dealer Options</h3>
      <p className="text-gray-700 mb-4">Choose how to deal:</p>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Dealing Mode</h4>
          <div className="flex gap-4">
            <button
              onClick={() => handleChoice('auto', 'highest')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              🤖 Auto Deal
            </button>
            <button
              onClick={() => handleChoice('manual', 'highest')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              👐 Manual Deal
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Dealer Selection</h4>
          <div className="flex gap-4">
            <button
              onClick={() => handleChoice('auto', 'highest')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
            >
              🏆 Highest Card Wins
            </button>
            <button
              onClick={() => handleChoice('auto', 'lowest')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
            >
              🥉 Lowest Card Wins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Game Room Component
const GameRoom = ({ room, player, roomCode, socket }) => {
  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;
  const activePlayers = room?.players?.filter(p => !p.isEliminated) || [];

  const handlePlayCard = (card) => {
    if (socket && isMyTurn) {
      socket.emit('game-action', { action: 'playCard', cardId: card.id });
    }
  };

  const handleStartGame = () => {
    if (socket) {
      socket.emit('game-action', { action: 'startGame', playerId: player._id });
    }
  };

  const handleDealCard = () => {
    if (socket) {
      socket.emit('game-action', { action: 'deal-next-card' });
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

      {/* Dealer Choice Panel */}
      {room.status === 'waiting' && currentPlayer?.isDealer && (
        <DealingChoicePanel socket={socket} roomCode={roomCode} playerId={player._id} />
      )}

      {/* Manual Dealing */}
      {room.gamePhase === 'manual-dealing' && (
        <div className="bg-white/90 p-4 rounded-xl shadow-lg mb-4 text-center">
          <h3 className="font-bold text-gray-800 mb-2">🎴 Manual Dealing</h3>
          <p>Next to deal: <strong>{room.nextPlayerToDeal}</strong></p>
          <button
            onClick={handleDealCard}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Deal Next Card
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.players.map((p, i) => (
              <PlayerDisplay key={i} player={p} isCurrentPlayer={p.isCurrent && !p.isEliminated} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {room.status === 'waiting' && activePlayers.length >= 2 && (
            <button
              onClick={handleStartGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
            >
              Start Game
            </button>
          )}

          <div className="bg-white/90 p-4 rounded-xl shadow-lg">
            <h3 className="font-bold text-gray-800 mb-3">🤖 AI Players</h3>
            {Object.entries(AI_PLAYERS).map(([key, config]) => {
              const isAdded = room.players.some(p => p.username === config.name && p.isAI);
              return (
                <button
                  key={key}
                  onClick={() => socket.emit('manage-ai', { action: isAdded ? 'remove' : 'add', aiKey: key })}
                  disabled={room.players.length >= 6 && !isAdded}
                  className={`w-full p-2 rounded text-sm transition ${
                    isAdded
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  {isAdded ? '❌ Remove' : '✅ Add'} {config.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isMyTurn && currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold">Your Cards</h3>
            <div className="flex items-center space-x-2 bg-yellow-200 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-ping"></div>
              <span className="text-sm font-medium text-yellow-800">Your Turn</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {currentPlayer.cards.map((card, i) => (
              <Card key={i} card={card} onClick={handlePlayCard} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
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
      console.error('Socket connection error:', err);
      setError('Failed to connect to server');
    });

    newSocket.on('game-state', (state) => {
      if (state) setRoom(state);
    });

    newSocket.on('error', (data) => {
      setError(data.message || 'An error occurred');
    });

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
        body: JSON.stringify({ playerName: playerName.trim() })
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
        body: JSON.stringify({ playerName: playerName.trim(), roomCode: code })
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
    if (code && code.trim()) {
      joinRoom(name, code.trim().toUpperCase());
    } else {
      createRoom(name);
    }
  };

  if (!player) {
    return (
      <>
        <Lobby onJoin={handleJoin} />
        {error && <div className="bg-red-600 text-white p-3">{error}</div>}
      </>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
        <div className="text-white text-2xl font-semibold">Loading game room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      {error && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          {error} <button onClick={() => setError('')} className="float-right">✕</button>
        </div>
      )}
      <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />
    </div>
  );
}
