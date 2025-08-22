// App.jsv6claude - Fixed Version
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// AI Players Configuration
const AI_PLAYERS = {
  otu: { name: 'Otu', level: 'beginner', avatar: '🤖' },
  ase: { name: 'Ase', level: 'beginner', avatar: '🎭' },
  dede: { name: 'Dede', level: 'intermediate', avatar: '🎪' },
  ogbologbo: { name: 'Ogbologbo', level: 'advanced', avatar: '🎯' },
  agba: { name: 'Agba', level: 'advanced', avatar: '🏆' }
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

// Card Component with Proper Color
const Card = ({ card, onClick, disabled, selected, isPlayedCard }) => {
  if (!card) return null;

  const suitColor = (card.suit === '♥' || card.suit === '♦') ? 'text-red-600' : 'text-black';
  
  if (isPlayedCard) {
    // Smaller cards for played cards display
    return (
      <div className="relative bg-white rounded-lg shadow-md border w-16 h-22 mx-1">
        <div className="absolute inset-1 border border-gray-300 rounded"></div>
        <div className={`absolute top-0.5 left-0.5 text-xs font-bold ${suitColor}`}>
          <div>{card.rank}</div>
          <div className="text-sm -mt-0.5">{card.suit}</div>
        </div>
        <div className="absolute bottom-0.5 right-0.5 text-xs font-bold transform rotate-180">
          <div>{card.rank}</div>
          <div className={`${suitColor} text-sm -mt-0.5`}>{card.suit}</div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        if (disabled) {
          console.warn('Card click blocked: disabled');
          return;
        }
        if (!card?.id) {
          console.error('Card click failed: missing card ID', card);
          return;
        }
        console.log('Card clicked:', card);
        onClick(card);
      }}
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

// Current Trick Display
const CurrentTrick = ({ trick, callingSuit }) => {
  if (!trick || trick.length === 0) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">Current Trick</h3>
        {callingSuit && (
          <div className="text-white text-sm">
            Calling Suit: <span className="text-lg">{callingSuit}</span>
          </div>
        )}
      </div>
      <div className="flex justify-center space-x-2">
        {trick.map((play, i) => (
          <div key={i} className="text-center">
            <Card card={play.card} isPlayedCard={true} />
            <div className="text-white text-xs mt-1 flex items-center justify-center">
              <span className="mr-1">{play.avatar}</span>
              <span>{play.player}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dealer Selection Display
const DealerSelection = ({ dealerSelectionCards }) => {
  if (!dealerSelectionCards || dealerSelectionCards.length === 0) return null;

  return (
    <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded-xl mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">🎴 Dealer Selection</h3>
      <div className="flex flex-wrap gap-2">
        {dealerSelectionCards.map((draw, i) => (
          <div key={i} className="text-center">
            <Card card={draw.card} isPlayedCard={true} />
            <div className="text-xs text-yellow-800 mt-1">{draw.player}</div>
            <div className="text-xs text-yellow-600">Rank: {draw.rank}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Player Display Component
const PlayerDisplay = ({ player, isCurrentPlayer, isMyself }) => {
  const icon = Object.values(AI_PLAYERS).find(ai => ai.name === player.username)?.avatar || player.avatar || '👤';

  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      isCurrentPlayer ? 'bg-yellow-100 border-yellow-400 shadow-lg ring-2 ring-yellow-300' : 'bg-white border-gray-200'
    } ${player.isEliminated ? 'opacity-60 grayscale' : ''} ${isMyself ? 'ring-2 ring-blue-300' : ''}`}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <span className="text-3xl">{icon}</span>
          {isCurrentPlayer && !player.isEliminated && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          )}
          {player.isDealer && (
            <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs px-1 rounded">D</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="font-bold text-gray-800">{player.username}</div>
            {isMyself && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">You</span>}
            {player.isEliminated && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Out</span>}
          </div>
          <div className="text-sm text-gray-600">
            Cards: {player.cards?.length || 0} | Points: {player.points || 0}
            {player.points >= 10 && <span className="text-red-600 font-bold"> ⚠️</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Game Room Component
const GameRoom = ({ room, player, roomCode, socket }) => {
  const [dealerSelectionCards, setDealerSelectionCards] = useState([]);
  
  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;
  const activePlayers = room?.players?.filter(p => !p.isEliminated) || [];

  const handlePlayCard = (card) => {
    console.log('Attempting to play card:', card);
    if (!socket?.connected) {
      console.error('Socket not connected');
      return;
    }
    if (!isMyTurn) {
      console.warn('Not your turn');
      return;
    }
    if (!card?.id) {
      console.error('Invalid card ID');
      return;
    }
    socket.emit('game-action', { action: 'playCard', cardId: card.id });
  };

  const handleStartGame = () => {
    if (socket) {
      socket.emit('game-action', { action: 'startGame', playerId: player._id });
    }
  };

  // Listen for dealer selection info
  useEffect(() => {
    if (socket) {
      socket.on('dealer-selected', (data) => {
        if (data.dealerSelectionCards) {
          setDealerSelectionCards(data.dealerSelectionCards);
          // Clear after 5 seconds
          setTimeout(() => setDealerSelectionCards([]), 5000);
        }
      });

      return () => socket.off('dealer-selected');
    }
  }, [socket]);

  return (
    <div>
      <header className="flex justify-between items-center mb-6 text-white">
        <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            Round: {room?.round || 1} | Phase: {room?.gamePhase || 'waiting'}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* Dealer Selection Display */}
      <DealerSelection dealerSelectionCards={dealerSelectionCards} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players Display */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current Trick */}
          {room?.currentTrick && room.currentTrick.length > 0 && (
            <CurrentTrick trick={room.currentTrick} callingSuit={room.callingSuit} />
          )}

          {/* Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room?.players?.map((p, i) => (
              <PlayerDisplay 
                key={p._id || i} 
                player={p} 
                isCurrentPlayer={p.isCurrent && !p.isEliminated}
                isMyself={p._id === player._id}
              />
            ))}
          </div>
        </div>

        {/* Controls and AI Management */}
        <div className="space-y-4">
          {room?.status === 'waiting' && activePlayers.length >= 2 && (
            <button
              onClick={handleStartGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-lg"
            >
              🎮 Start Game
            </button>
          )}

          {/* AI Management */}
          <div className="bg-white/90 p-4 rounded-xl shadow-lg">
            <h3 className="font-bold text-gray-800 mb-3">🤖 AI Players</h3>
            <div className="space-y-2">
              {Object.entries(AI_PLAYERS).map(([key, config]) => {
                const isAdded = room?.players?.some(p => p.username === config.name && p.isAI);
                return (
                  <button
                    key={key}
                    onClick={() => socket.emit('manage-ai', { action: isAdded ? 'remove' : 'add', aiKey: key })}
                    disabled={room?.players?.length >= 6 && !isAdded}
                    className={`w-full p-2 rounded text-sm transition flex items-center justify-between ${
                      isAdded
                        ? 'bg-red-100 text-red-800 hover:bg-red-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">{config.avatar}</span>
                      <span>{config.name}</span>
                      <span className="ml-1 text-xs">({config.level})</span>
                    </span>
                    <span>{isAdded ? '❌ Remove' : '✅ Add'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game Status */}
          <div className="bg-white/90 p-4 rounded-xl shadow-lg">
            <h3 className="font-bold text-gray-800 mb-2">Game Status</h3>
            <div className="text-sm space-y-1">
              <div>Players: {room?.players?.length || 0}/6</div>
              <div>Active: {activePlayers.length}</div>
              {room?.trickHistory && (
                <div>Tricks Played: {room.trickHistory.length}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player's Cards */}
      {isMyTurn && currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-xl">🃏 Your Cards</h3>
            <div className="flex items-center space-x-2 bg-yellow-200 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-ping"></div>
              <span className="text-sm font-medium text-yellow-800">Your Turn</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {currentPlayer.cards.map((card, i) => (
              <Card 
                key={card.id || i} 
                card={card} 
                onClick={handlePlayCard}
                disabled={!isMyTurn}
              />
            ))}
          </div>
          {room?.callingSuit && (
            <div className="text-center mt-2 text-white">
              Follow suit if possible: <span className="text-2xl">{room.callingSuit}</span>
            </div>
          )}
        </div>
      )}

      {/* Other Player's Turn Indicator */}
      {!isMyTurn && room?.gamePhase === 'playing' && (
        <div className="mt-8 text-center">
          <div className="bg-blue-100 border border-blue-300 p-4 rounded-xl inline-block">
            <div className="text-blue-800 font-semibold">
              Waiting for {room?.players?.find(p => p.isCurrent)?.username || 'other player'}...
            </div>
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
      console.log('✅ Socket connected:', newSocket.id);
      setError(null);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      setError('Failed to connect to server');
    });

    newSocket.on('game-state', (state) => {
      if (state) {
        console.log('🔄 Received game state:', state);
        setRoom(state);
      }
    });

    newSocket.on('error', (data) => {
      console.error('❌ Server error:', data.message || data);
      setError(data.message || 'An error occurred');
    });

    newSocket.on('game-message', (data) => {
      console.log('💬 Game message:', data.message);
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('❌ Create room error:', err);
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(code);
        socket.emit('join-game', { playerId: data.playerId, roomCode: code });
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (err) {
      console.error('❌ Join room error:', err);
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
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-white hover:text-gray-200">✕</button>
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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-white hover:text-gray-200">✕</button>
        </div>
      )}
      <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />
    </div>
  );
}
