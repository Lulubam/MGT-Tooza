// App.js - Enhanced Tooza Card Game with Realistic Design
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// =========================================================================
// AI Players Configuration
// =========================================================================
const AI_PLAYERS = {
  'otu': { name: 'Otu', level: 'beginner', avatar: '🤖' },
  'ase': { name: 'Ase', level: 'beginner', avatar: '🎭' },
  'dede': { name: 'Dede', level: 'intermediate', avatar: '🎪' },
  'ogbologbo': { name: 'Ogbologbo', level: 'advanced', avatar: '🎯' },
  'agba': { name: 'Agba', level: 'advanced', avatar: '👑' }
};

// =========================================================================
// Realistic Card Component with Outlines
// =========================================================================
const Card = ({ card, onClick, disabled, selected, isTopCard }) => {
  const suitColors = {
    '♠': 'text-black',
    '♣': 'text-black', 
    '♥': 'text-red-600',
    '♦': 'text-red-600'
  };

  const suitSymbols = {
    '♠': '♠',
    '♣': '♣', 
    '♥': '♥',
    '♦': '♦'
  };

  return (
    <div 
      className={`
        relative bg-white rounded-xl shadow-lg transform transition-all duration-300 cursor-pointer
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-2 hover:rotate-1'}
        ${selected ? 'ring-4 ring-blue-400 -translate-y-3 rotate-2 z-10' : ''}
        ${isTopCard ? 'ring-2 ring-yellow-400' : ''}
        w-20 h-28 border-2 border-gray-800
      `}
      onClick={() => !disabled && onClick && onClick(card)}
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: disabled ? '2px 2px 8px rgba(0,0,0,0.1)' : '4px 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      {/* Card Border Pattern */}
      <div className="absolute inset-1 border border-gray-400 rounded-lg"></div>
      
      {/* Top Left Corner */}
      <div className={`absolute top-1 left-1 flex flex-col items-center ${suitColors[card.suit]} font-bold text-xs leading-tight`}>
        <span className="text-sm">{card.rank}</span>
        <span className="text-base -mt-1">{suitSymbols[card.suit]}</span>
      </div>
      
      {/* Center Symbol */}
      <div className={`absolute inset-0 flex items-center justify-center ${suitColors[card.suit]} text-3xl font-bold`}>
        {suitSymbols[card.suit]}
      </div>
      
      {/* Bottom Right Corner (Rotated) */}
      <div className={`absolute bottom-1 right-1 flex flex-col items-center ${suitColors[card.suit]} font-bold text-xs leading-tight transform rotate-180`}>
        <span className="text-sm">{card.rank}</span>
        <span className="text-base -mt-1">{suitSymbols[card.suit]}</span>
      </div>
      
      {/* Special Card Indicator */}
      {card.isSpecial && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600 transform translate-x-1 -translate-y-1">
          <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Card Back Component
// =========================================================================
const CardBack = ({ className = '' }) => (
  <div className={`
    relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 
    rounded-xl shadow-lg border-2 border-gray-800 w-20 h-28 ${className}
  `}>
    {/* Decorative Pattern */}
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
// Player Display Component
// =========================================================================
const PlayerDisplay = ({ player, isCurrentPlayer, isYou, position = 'bottom' }) => {
  const getPlayerTypeIcon = (username) => {
    const aiPlayer = Object.values(AI_PLAYERS).find(ai => ai.name === username);
    return aiPlayer ? aiPlayer.avatar : '👤';
  };

  const getPlayerLevel = (username) => {
    const aiPlayer = Object.values(AI_PLAYERS).find(ai => ai.name === username);
    return aiPlayer ? ` (${aiPlayer.level})` : '';
  };

  const positionClasses = {
    bottom: 'flex-row',
    top: 'flex-row', 
    left: 'flex-col',
    right: 'flex-col'
  };

  return (
    <div className={`
      relative p-4 rounded-xl border-3 transition-all duration-500 backdrop-blur-sm
      ${isCurrentPlayer ? 
        'border-yellow-400 bg-yellow-100/80 shadow-lg shadow-yellow-300/50 animate-pulse' : 
        'border-gray-300 bg-white/80'
      }
      ${isYou ? 'ring-3 ring-blue-400 ring-opacity-70' : ''}
    `}>
      <div className={`flex items-center space-x-3 ${positionClasses[position]}`}>
        <div className="relative">
          <span className="text-3xl">{getPlayerTypeIcon(player.username)}</span>
          {isCurrentPlayer && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-gray-800">
              {player.username}{getPlayerLevel(player.username)}
            </span>
            {isYou && <span className="text-blue-600 font-medium text-sm bg-blue-100 px-2 py-1 rounded-full">You</span>}
            {player.isDealer && <span className="text-purple-600 font-medium text-sm bg-purple-100 px-2 py-1 rounded-full">👑 Dealer</span>}
          </div>
          
          <div className="flex space-x-4 mt-1">
            <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              Cards: {player.cards?.length || 0}
            </div>
            <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              Points: {player.points || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// Solitaire-style Background Component
// =========================================================================
const SolitaireBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Felt texture overlay */}
    <div 
      className="absolute inset-0 opacity-20"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)
        `
      }}
    />
    
    {/* Floating cards */}
    <div className="absolute top-10 left-10 opacity-10 transform -rotate-12">
      <CardBack className="w-16 h-24" />
    </div>
    <div className="absolute top-20 right-20 opacity-15 transform rotate-12">
      <CardBack className="w-16 h-24" />
    </div>
    <div className="absolute bottom-20 left-20 opacity-10 transform rotate-45">
      <CardBack className="w-16 h-24" />
    </div>
    <div className="absolute bottom-10 right-10 opacity-15 transform -rotate-12">
      <CardBack className="w-16 h-24" />
    </div>
    <div className="absolute top-1/2 left-1/4 opacity-5 transform -rotate-45">
      <CardBack className="w-12 h-18" />
    </div>
    <div className="absolute top-1/3 right-1/3 opacity-8 transform rotate-12">
      <CardBack className="w-12 h-18" />
    </div>
    
    {/* Subtle pattern overlay */}
    <div className="absolute inset-0" style={{
      backgroundImage: `
        radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)
      `,
      backgroundSize: '50px 50px'
    }} />
  </div>
);

// =========================================================================
// AI Management Panel
// =========================================================================
const AIManagementPanel = ({ gameState, socket }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAIAction = (action, aiKey) => {
    if (socket) {
      socket.emit('manage-ai', { action, aiKey });
    }
  };

  const getAvailableAI = () => {
    const existingAI = gameState.players
      .filter(p => p.isAI)
      .map(p => p.username);
    
    return Object.entries(AI_PLAYERS).filter(([key, ai]) => 
      !existingAI.includes(ai.name)
    );
  };

  const getExistingAI = () => {
    return gameState.players
      .filter(p => p.isAI)
      .map(p => ({
        key: Object.keys(AI_PLAYERS).find(k => AI_PLAYERS[k].name === p.username),
        player: p
      }));
  };

  if (gameState.status === 'playing') return null; // Only show when not playing

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
      >
        <span>🤖</span>
        <span>Manage AI Players</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border-2 border-purple-200 p-4 z-50 min-w-80">
          <h3 className="font-bold text-gray-800 mb-3">AI Players Management</h3>
          
          {/* Available AI to Add */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Add AI Players:</h4>
            {getAvailableAI().length > 0 ? (
              <div className="space-y-2">
                {getAvailableAI().map(([key, ai]) => (
                  <button
                    key={key}
                    onClick={() => handleAIAction('add', key)}
                    className="w-full flex items-center justify-between p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-xl">{ai.avatar}</span>
                      <span className="font-medium">{ai.name}</span>
                      <span className="text-gray-500 text-sm">({ai.level})</span>
                    </span>
                    <span className="text-green-600 font-bold">+ Add</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">All AI players are already in the game</p>
            )}
          </div>
          
          {/* Existing AI to Remove */}
          {getExistingAI().length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Remove AI Players:</h4>
              <div className="space-y-2">
                {getExistingAI().map(({ key, player }) => (
                  <button
                    key={key}
                    onClick={() => handleAIAction('remove', key)}
                    className="w-full flex items-center justify-between p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-xl">{AI_PLAYERS[key]?.avatar}</span>
                      <span className="font-medium">{player.username}</span>
                      <span className="text-gray-500 text-sm">({AI_PLAYERS[key]?.level})</span>
                    </span>
                    <span className="text-red-600 font-bold">✕ Remove</span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
      <SolitaireBackground />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-green-800 mb-2">🃏 Tooza</h1>
            <p className="text-gray-600">The Ultimate Card Game</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                id="playerName"
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
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Create a room to play with friends, or join an existing room with a code
            </p>
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
          setMessages(prev => prev.slice(1));
        }, 5000);
      });

      return () => {
        socket.off('game-message');
      };
    }
  }, [socket]);

  if (!room || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative">
        <SolitaireBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-gray-800">Loading game room...</div>
          </div>
        </div>
      </div>
    );
  }

  const handleStartGame = () => {
    if (socket && player) {
      socket.emit('game-action', {
        action: 'startGame',
        data: {}
      });
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { playerId: player._id, roomCode });
      window.location.reload();
    }
  };

  const handlePlayCard = () => {
    if (socket && selectedCard) {
      socket.emit('game-action', {
        action: 'playCard',
        data: { cardId: selectedCard.id }
      });
      setSelectedCard(null);
    }
  };

  const handleDrawCard = () => {
    if (socket) {
      socket.emit('game-action', {
        action: 'drawCard',
        data: {}
      });
    }
  };

  const currentPlayer = room.players?.find(p => p.id === player._id || p._id === player._id);
  const isDealer = currentPlayer?.isDealer || false;
  const canStartGame = room.status === 'waiting' && isDealer && room.players?.length >= 2;
  const isMyTurn = currentPlayer?.isCurrent && room.status === 'playing';
  const topCard = room.lastPlayedCard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative">
      <SolitaireBackground />
      
      {/* Game Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in"
          >
            {msg.message}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-green-800 flex items-center space-x-2">
                <span>🃏</span>
                <span>Room: {roomCode}</span>
              </h1>
              <p className="text-gray-600 mt-1">Playing as: <span className="font-semibold">{player.name || currentPlayer?.username}</span></p>
            </div>
            <div className="flex space-x-3">
              {room.status === 'waiting' && (
                <AIManagementPanel gameState={room} socket={socket} />
              )}
              {canStartGame && (
                <button
                  onClick={handleStartGame}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
                >
                  🎮 Start Game
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
              >
                🚪 Leave Room
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              room.status === 'waiting' ? 'bg-yellow-200 text-yellow-800' :
              room.status === 'playing' ? 'bg-green-200 text-green-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              Status: {room.status}
            </span>
            <span className="px-4 py-2 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
              Phase: {room.gamePhase}
            </span>
            {room.round && (
              <span className="px-4 py-2 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                Round: {room.round}
              </span>
            )}
            {room.gameDirection === -1 && (
              <span className="px-4 py-2 bg-orange-200 text-orange-800 rounded-full text-sm font-medium">
                🔄 Reversed
              </span>
            )}
          </div>
        </div>

        {/* Players Grid */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span>👥</span>
            <span>Players ({room.players?.length || 0}/4)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.players && room.players.length > 0 ? (
              room.players.map((p, index) => (
                <PlayerDisplay
                  key={p.id || p._id || index}
                  player={p}
                  isCurrentPlayer={p.isCurrent}
                  isYou={p.id === player._id || p._id === player._id}
                />
              ))
            ) : (
              <div className="col-span-2 text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">🤷‍♂️</div>
                <p>No players found</p>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        {room.status === 'playing' && (
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
              <span>🎯</span>
              <span>Game Table</span>
            </h2>
            
            {/* Game Table Center */}
            <div className="flex justify-center items-center space-x-8 mb-8">
              {/* Deck */}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Draw Pile</h3>
                <div className="relative cursor-pointer" onClick={handleDrawCard}>
                  <CardBack />
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-2 py-1 rounded text-xs">
                    {room.deck?.length || 0} cards
                  </div>
                </div>
              </div>

              {/* Top Card */}
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Current Card</h3>
                {topCard ? (
                  <Card card={topCard} disabled={true} isTopCard={true} />
                ) : (
                  <div className="w-20 h-28 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-400">
                    <span className="text-xs">No Card</span>
                  </div>
                )}
              </div>
            </div>

            {/* Player's Hand */}
            {currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
              <div className="bg-green-100/50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Your Hand</h3>
                  <div className="flex items-center space-x-4">
                    {isMyTurn && (
                      <div className="flex items-center space-x-2 bg-yellow-200 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full animate-ping"></div>
                        <span className="text-sm font-medium text-yellow-800">Your Turn</span>
                      </div>
                    )}
                    <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                      {currentPlayer.cards.length} card{currentPlayer.cards.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {currentPlayer.cards.map((card, index) => (
                    <Card
                      key={card.id || index}
                      card={card}
                      onClick={isMyTurn ? setSelectedCard : null}
                      disabled={!isMyTurn}
                      selected={selectedCard?.id === card.id}
                    />
                  ))}
                </div>
                
                {selectedCard && isMyTurn && (
                  <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-800 mb-1">
                          Selected: {selectedCard.rank} of {selectedCard.suit}
                        </p>
                        {selectedCard.isSpecial && (
                          <p className="text-sm text-blue-600">⭐ Special Card</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handlePlayCard}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg"
                        >
                          🎯 Play Card
                        </button>
                        <button
                          onClick={() => setSelectedCard(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Game Rules Reminder */}
            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">🎯 Tooza Rules:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Match the suit OR rank of the top card</li>
                <li>• Special cards: A (Reverse), 2 (Draw 2), 8 (Skip), J (Play Again), K (All Draw 1)</li>
                <li>• First player to empty their hand wins the round</li>
                <li>• Game ends when someone reaches 100+ points</li>
              </ul>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {room.status === 'gameOver' && (
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h2>
            <p className="text-lg text-gray-600 mb-6">
              Congratulations to the winner!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              🎮 Play Again
            </button>
          </div>
        )}
      </div>
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

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to game server. Please try again.');
      setLoading(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
      setLoading(false);
    });

    newSocket.on('game-state', (gameState) => {
      console.log('Received game state:', gameState);
      setRoom(gameState);
      setLoading(false);
    });

    newSocket.on('player-joined', (data) => {
      console.log('Player joined:', data);
    });

    newSocket.on('game-over', (data) => {
      console.log('Game over:', data);
      alert(`Game Over! ${data.message}`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
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
        ? 'https://mgt-toozabackend.onrender.com'
        : 'http://localhost:3001';

      const res = await fetch(`${serverUrl}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
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
          socket.emit('join-game', { 
            playerId: data.playerId, 
            roomCode: data.roomCode 
          });
        } else {
          throw new Error('Socket not connected');
        }
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Create room error:', error);
      setError(`Error creating room: ${error.message}`);
      setLoading(false);
    }
  };

  const joinExistingRoom = async (playerName, roomCodeInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const serverUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mgt-toozabackend.onrender.com'
        : 'http://localhost:3001';

      const res = await fetch(`${serverUrl}/api/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode: roomCodeInput }),
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
          socket.emit('join-game', { 
            playerId: data.playerId, 
            roomCode: roomCodeInput 
          });
        } else {
          throw new Error('Socket not connected');
        }
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Join room error:', error);
      setError(`Error joining room: ${error.message}`);
      setLoading(false);
    }
  };

  const handleJoinOrCreate = (playerName, roomCodeInput) => {
    if (roomCodeInput && roomCodeInput.trim()) {
      joinExistingRoom(playerName, roomCodeInput.trim().toUpperCase());
    } else {
      createRoom(playerName);
    }
  };

  return (
    <div className="app font-sans">
      {/* Custom Styles */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <p>{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Loading Screen */}
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative">
          <SolitaireBackground />
          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <div className="bg-white/95 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center">
              <div className="text-4xl mb-4">🃏</div>
              <div className="text-2xl text-green-800 mb-4 font-bold">Loading...</div>
              <div className="text-gray-600 mb-6">
                {player ? `Joining room as ${player.name}...` : 'Connecting to server...'}
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            </div>
          </div>
        </div>
      ) : !room ? (
        <Lobby onJoin={handleJoinOrCreate} />
      ) : (
        <GameRoom
          socket={socket}
          room={room}
          player={player}
          roomCode={roomCode}
        />
      )}
    </div>
  );
}
