// App.jsv7qwen - Trick-Taking Card Game with Casino Theme
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
// Realistic Card Component with Colors
// =========================================================================
const Card = ({ card, onClick, disabled, selected, canPlay = true, inTrick = false }) => {
  const suitColors = {
    '♠': 'text-black',
    '♣': 'text-black',
    '♥': 'text-red-600',
    '♦': 'text-red-600'
  };

  const getCardValue = (card) => {
    if (card.rank === '3' && card.suit === '♠') return '12pts';
    if (card.rank === '3') return '6pts';
    if (card.rank === '4') return '4pts';
    if (card.rank === 'A') return '2pts';
    return '1pt';
  };

  const isSpecial = card.rank === '3' && card.suit === '♠';

  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg transform transition-all duration-300 cursor-pointer
        ${disabled ? 'opacity-60 cursor-not-allowed' : 
          canPlay ? 'hover:shadow-xl hover:-translate-y-2 ring-2 ring-green-400' : 
          'hover:shadow-xl hover:-translate-y-1'}
        ${selected ? 'ring-4 ring-blue-400 -translate-y-3 rotate-2 z-10' : ''}
        ${isSpecial ? 'ring-2 ring-yellow-400' : ''}
        ${inTrick ? 'w-16 h-22' : 'w-20 h-28'} border-2 border-gray-800`}
      onClick={() => !disabled && onClick && onClick(card)}
      style={{
        fontFamily: 'serif',
        transformOrigin: 'bottom'
      }}
    >
      <div className="absolute inset-1 border border-gray-300 rounded-lg"></div>
      
      {/* Top Left */}
      <div className="absolute top-1 left-1 text-xs font-bold">
        <div>{card.rank}</div>
        <div className={`text-base -mt-1 ${suitColors[card.suit]}`}>{card.suit}</div>
      </div>

      {/* Bottom Right (rotated) */}
      <div className="absolute bottom-1 right-1 text-xs font-bold transform rotate-180">
        <div>{card.rank}</div>
        <div className={`text-base -mt-1 ${suitColors[card.suit]}`}>{card.suit}</div>
      </div>

      {/* Point Value Indicator */}
      {!inTrick && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl-lg rounded-tr-xl">
          {getCardValue(card)}
        </div>
      )}

      {/* Special Card Indicator (Black 3) */}
      {isSpecial && (
        <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full border border-red-700 transform -translate-x-1 -translate-y-1">
          <div className="absolute inset-0 bg-red-400 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Playable indicator */}
      {canPlay && !disabled && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
      )}
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
        ? 'bg-red-100 border-red-300 opacity-50' 
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
// Dealing Choice Panel
// =========================================================================
const DealingChoicePanel = ({ socket, roomCode, playerId }) => {
  const handleChoice = (mode) => {
    socket.emit('game-action', {
      action: 'set-dealing-mode',
      mode,
      playerId
    });
  };

  return (
    <div className="bg-white/90 p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🃏 Dealer Options</h3>
      <p className="text-gray-700 mb-4">Choose dealing style:</p>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Dealing Mode</h4>
          <div className="flex gap-4">
            <button
              onClick={() => handleChoice('auto')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              🤖 Auto Deal
            </button>
            <button
              onClick={() => handleChoice('manual')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              👐 Manual Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// Trick Display Component
// =========================================================================
const TrickDisplay = ({ currentTrick, callingSuit, players }) => {
  if (!currentTrick || currentTrick.length === 0) {
    return (
      <div className="bg-green-100/50 rounded-xl p-6 border-2 border-green-200 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Trick</h3>
        <div className="text-gray-500">No cards played yet</div>
        {callingSuit && (
          <div className="mt-2 text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full inline-block">
            Must follow: {callingSuit}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-green-100/50 rounded-xl p-6 border-2 border-green-200">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">Current Trick</h3>
      <div className="flex flex-wrap gap-3">
        {currentTrick.map((play, i) => (
          <div key={i} className="text-center">
            <Card card={play.card} inTrick />
            <div className="text-xs mt-1 text-gray-600">{play.player}</div>
          </div>
        ))}
      </div>
      {callingSuit && (
        <div className="mt-3 text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full inline-block">
          Calling: {callingSuit}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Game Rules Modal
// =========================================================================
const GameRulesDisplay = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
      >
        <span>📋</span>
        <span>Game Rules</span>
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl border-2 border-blue-200 p-6 z-50 max-w-md">
          <h3 className="font-bold text-gray-800 mb-4">🎯 Trick-Taking Game Rules</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">📜 Objective:</h4>
              <p>Avoid winning tricks. First to 12+ points is eliminated. Last player standing wins.</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">🃏 Card Points:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>♠ 3 = 12 points</li>
                <li>Red 3 = 6 points</li>
                <li>4 = 4 points</li>
                <li>A = 2 points</li>
                <li>Others = 1 point</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">✅ Gameplay:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Must follow suit if possible</li>
                <li>♠ is trump suit</li>
                <li>Dealer chosen by highest card</li>
                <li>After 5 tricks, new round starts</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
          >
            Got it!
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Lobby Component
// =========================================================================
const Lobby = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = () => {
    if (playerName.trim()) {
      onJoin(playerName, roomCode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 opacity-10 transform -rotate-12">
          <div className="w-16 h-24 bg-gradient-to-b from-yellow-200 to-yellow-400 border-2 border-yellow-600 rounded"></div>
        </div>
        <div className="absolute top-20 right-20 opacity-15 transform rotate-12">
          <div className="w-16 h-24 bg-gradient-to-b from-yellow-200 to-yellow-400 border-2 border-yellow-600 rounded"></div>
        </div>
        <div className="absolute bottom-20 left-20 opacity-10 transform rotate-45">
          <div className="w-16 h-24 bg-gradient-to-b from-yellow-200 to-yellow-400 border-2 border-yellow-600 rounded"></div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🃏 Trick Game</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your name"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">Room Code (optional)</label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter code to join existing room"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!playerName.trim()}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg"
            >
              {roomCode ? '🚪 Join Room' : '🎮 Create Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// Game Room Component
// =========================================================================
const GameRoom = ({ room, player, roomCode, socket }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('game-message', (data) => {
        setMessages(prev => [...prev.slice(-4), { ...data, id: Date.now() }]);
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== data.id));
        }, 5000);
      });

      return () => {
        socket.off('game-message');
      };
    }
  }, [socket]);

  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;
  const activePlayers = room?.players?.filter(p => !p.isEliminated) || [];

  const handlePlayCard = (card) => {
    if (socket && isMyTurn) {
      socket.emit('game-action', { action: 'playCard', cardId: card.id });
      setSelectedCard(null);
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      <header className="flex justify-between items-center mb-6 text-white">
        <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
        <div className="flex items-center space-x-4">
          <GameRulesDisplay />
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in">
              {msg.message}
            </div>
          ))}
        </div>
      )}

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
          <TrickDisplay 
            currentTrick={room.currentTrick} 
            callingSuit={room.callingSuit} 
            players={room.players} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
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
                  className={`w-full p-2 rounded flex items-center space-x-2 text-sm transition ${
                    isAdded
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  } disabled:opacity-50`}
                >
                  <span>{config.avatar}</span>
                  <span>{config.name} ({config.level})</span>
                  <span className="ml-auto font-bold">{isAdded ? '❌ Remove' : '✅ Add'}</span>
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
            {currentPlayer.cards.map((card, i) => {
              const canPlay = room.currentTrick.length === 0 || 
                !room.callingSuit || 
                card.suit === room.callingSuit || 
                !currentPlayer.cards.some(c => c.suit === room.callingSuit);

              return (
                <Card
                  key={i}
                  card={card}
                  onClick={handlePlayCard}
                  selected={selectedCard?.id === card.id}
                  canPlay={canPlay}
                />
              );
            })}
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
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        if (socket?.connected) {
          socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
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
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(code);
        if (socket?.connected) {
          socket.emit('join-game', { playerId: data.playerId, roomCode: code });
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

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
        <div className="text-white text-2xl font-semibold">Loading game room...</div>
      </div>
    );
  }

  return (
    <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />
  );
}
