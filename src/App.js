// App.js - Trick-Taking Card Game with Manual Dealing
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
// Realistic Card Component
// =========================================================================
const Card = ({ card, onClick, disabled, selected, canPlay, inTrick = false }) => {
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

  return (
    <div 
      className={`
        relative bg-white rounded-xl shadow-lg transform transition-all duration-300 cursor-pointer
        ${disabled ? 'opacity-60 cursor-not-allowed' : 
          canPlay ? 'hover:shadow-xl hover:-translate-y-2 hover:rotate-1 ring-2 ring-green-400' : 
          'hover:shadow-xl hover:-translate-y-1'}
        ${selected ? 'ring-4 ring-blue-400 -translate-y-3 rotate-2 z-10' : ''}
        ${card.isSpecial ? 'ring-2 ring-yellow-400' : ''}
        ${inTrick ? 'w-16 h-22' : 'w-20 h-28'} border-2 border-gray-800
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
        <span className={inTrick ? "text-sm" : "text-sm"}>{card.rank}</span>
        <span className={`${inTrick ? "text-lg" : "text-base"} -mt-1`}>{card.suit}</span>
      </div>
      
      {/* Center Symbol */}
      <div className={`absolute inset-0 flex items-center justify-center ${suitColors[card.suit]} ${inTrick ? "text-2xl" : "text-3xl"} font-bold`}>
        {card.suit}
      </div>
      
      {/* Bottom Right Corner (Rotated) */}
      <div className={`absolute bottom-1 right-1 flex flex-col items-center ${suitColors[card.suit]} font-bold text-xs leading-tight transform rotate-180`}>
        <span className={inTrick ? "text-sm" : "text-sm"}>{card.rank}</span>
        <span className={`${inTrick ? "text-lg" : "text-base"} -mt-1`}>{card.suit}</span>
      </div>
      
      {/* Point Value Indicator */}
      {!inTrick && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl-lg rounded-tr-xl">
          {getCardValue(card)}
        </div>
      )}
      
      {/* Special Card Indicator (Black 3) */}
      {card.isSpecial && (
        <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full border border-red-700 transform -translate-x-1 -translate-y-1">
          <div className="absolute inset-0 bg-red-400 rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* Playable indicator */}
      {canPlay && !disabled && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
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
// Dealer Selection Component
// =========================================================================
const DealerSelectionPanel = ({ gameState, socket, currentPlayer }) => {
  const [hasDrawn, setHasDrawn] = useState(false);
  
  const playerCount = gameState?.players?.length || 0;
  const playersWhoDrawn = gameState?.players?.filter(p => p.dealerCard)?.length || 0;
  const allPlayersDrawn = playersWhoDrawn >= playerCount;
  const canDraw = !hasDrawn && !currentPlayer?.dealerCard;

  const handleDrawCard = () => {
    if (socket && canDraw) {
      socket.emit('game-action', {
        action: 'drawDealerCard',
        data: {}
      });
      setHasDrawn(true);
    }
  };

  const handleConfirmDealer = () => {
    if (socket) {
      socket.emit('game-action', {
        action: 'confirmDealer',
        data: {}
      });
    }
  };

  if (gameState?.status !== 'dealerSelection') return null;

  const sortedPlayers = [...(gameState?.players || [])].sort((a, b) => {
    if (!a.dealerCard && !b.dealerCard) return 0;
    if (!a.dealerCard) return 1;
    if (!b.dealerCard) return -1;
    
    // Card ranking for dealer selection: A > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3
    const rankOrder = { 'A': 14, '10': 13, '9': 12, '8': 11, '7': 10, '6': 9, '5': 8, '4': 7, '3': 6 };
    return (rankOrder[b.dealerCard.rank] || 0) - (rankOrder[a.dealerCard.rank] || 0);
  });

  const topPlayer = sortedPlayers[0];

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-purple-800 flex items-center justify-center space-x-2 mb-2">
          <span>🎯</span>
          <span>Dealer Selection</span>
        </h3>
        <p className="text-gray-700 text-sm">
          Each player draws one card. The player with the highest rank becomes the dealer.
        </p>
      </div>

      {/* Draw Card Section */}
      <div className="text-center mb-6">
        {canDraw ? (
          <button
            onClick={handleDrawCard}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🎴 Draw Your Card
          </button>
        ) : currentPlayer?.dealerCard ? (
          <div className="bg-green-100 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium mb-2">You drew:</p>
            <div className="flex justify-center">
              <Card card={currentPlayer.dealerCard} disabled={true} inTrick={true} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 inline-block">
            <p className="text-gray-600">Waiting for your turn to draw...</p>
          </div>
        )}
      </div>

      {/* Players and Their Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {gameState?.players?.map((player, index) => (
          <div key={player.id || index} className={`p-4 rounded-lg border-2 ${
            player.dealerCard ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{player.username}</span>
                {player.id === currentPlayer?.id && (
                  <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded-full">You</span>
                )}
              </div>
              <div className="text-right">
                {player.dealerCard ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-green-700 text-sm">Card Drawn</span>
                    <Card card={player.dealerCard} disabled={true} inTrick={true} />
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">...Waiting</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Section */}
      {allPlayersDrawn && topPlayer && (
        <div className="text-center mt-6">
          <p className="text-lg font-semibold text-purple-900 mb-2">
            The dealer is: {topPlayer.username}
          </p>
          {currentPlayer?.id === topPlayer.id && (
            <button
              onClick={handleConfirmDealer}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors mt-2"
            >
              🎉 Confirm & Deal Cards
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// AI Management Component
// =========================================================================
const AIManagementPanel = ({ gameState, socket, player }) => {
  const { players } = gameState;
  const humanPlayers = players.filter(p => !p.isAI);
  const aiPlayers = players.filter(p => p.isAI);
  const playersInRoom = players.length;

  const handleAIAction = (action, key) => {
    if (socket) {
      socket.emit('manage-ai', { 
        roomCode: player.roomCode,
        playerId: player._id,
        action,
        aiKey: key 
      });
    }
  };

  const handleQuickStart = () => {
    if (socket) {
      socket.emit('game-action', {
        action: 'quickStart',
        data: {}
      });
    }
  };

  return (
    <div className="bg-gray-100 border-2 border-gray-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Manage AI Players</h3>
        <p className="text-sm text-gray-600">
          Players: {humanPlayers.length}/{playersInRoom}/4
        </p>
      </div>
      
      {/* Quick Start Button */}
      {playersInRoom >= 2 && gameState.status === 'waiting' && (
        <div className="text-center mb-4">
          <button
            onClick={handleQuickStart}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🚀 Quick Start Game
          </button>
        </div>
      )}

      {/* Add AI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {Object.keys(AI_PLAYERS).map(key => {
          const ai = AI_PLAYERS[key];
          const isAdded = aiPlayers.some(p => p.username === ai.name);
          const isRoomFull = playersInRoom >= 4;

          return (
            <div key={key} className={`p-3 rounded-lg border-2 text-center transition-colors ${
              isAdded ? 'bg-green-200 border-green-300' : 
              isRoomFull ? 'bg-gray-300 border-gray-400' : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}>
              <div className="text-3xl mb-1">{ai.avatar}</div>
              <p className="font-semibold text-sm">{ai.name}</p>
              <p className="text-xs text-gray-500 capitalize">{ai.level}</p>
              <button 
                onClick={() => handleAIAction(isAdded ? 'remove' : 'add', key)}
                disabled={isRoomFull && !isAdded}
                className={`mt-2 w-full text-xs font-semibold py-1 rounded-full transition-colors ${
                  isAdded ? 'bg-red-500 hover:bg-red-600 text-white' : 
                  isRoomFull ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isAdded ? 'Remove' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// Lobby Component
// =========================================================================
const Lobby = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Please enter your name.');
      return;
    }
    onJoin(playerName, roomCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
          Trickster
        </h1>
        <p className="text-gray-600 mb-6">Enter your name and join a room!</p>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Room Code (optional)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {roomCode.trim() ? 'Join Room' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// Main App Component
// =========================================================================
function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setSocket(newSocket);
      setLoading(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setSocket(null);
      setGameState(null);
      setRoom(null);
      setPlayer(null);
    });

    newSocket.on('game-state', (state) => {
      console.log('Received new game state:', state);
      setGameState(state);
    });

    newSocket.on('player-update', ({ room, player }) => {
      console.log('Received player update:', player);
      setRoom(room);
      setPlayer(player);
      // Reconnect to game after a successful join/create
      if (socket?.connected) {
        socket.emit('join-game', {
          playerId: player._id,
          roomCode: room.code
        });
      }
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const createRoom = async (playerName) => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });
      const data = await res.json();
      if (data.success) {
        setRoom({ code: data.roomCode });
        setPlayer({ _id: data.playerId, username: playerName });
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const joinRoom = async (playerName, roomCode) => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode }),
      });
      const data = await res.json();
      if (data.success) {
        setRoom({ code: data.roomCode });
        setPlayer({ _id: data.playerId, username: playerName });
        setError(null);
        if (socket?.connected) {
          socket.emit('join-game', { 
            playerId: data.playerId, 
            roomCode: data.roomCode 
          });
        } else {
          throw new Error('Socket not connected');
        }
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleJoin = (playerName, roomCode) => {
    if (roomCode && roomCode.trim()) {
      joinRoom(playerName, roomCode.trim().toUpperCase());
    } else {
      createRoom(playerName);
    }
  };

  if (!room) {
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
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
            <div className="flex justify-between items-center space-x-4">
              <p>{error}</p>
              <button 
                onClick={() => setError(null)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full text-sm font-semibold"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Once a room is joined, show the game view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 text-white flex flex-col p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trickster!</h1>
        {room && (
          <div className="bg-green-700/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
            Room: {room.code}
          </div>
        )}
      </header>
      
      {gameState && (
        <>
          {/* Game State Panels */}
          {gameState.status === 'waiting' && (
            <div className="flex-grow flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-sm p-8 rounded-xl text-center">
                <p className="text-2xl font-bold mb-2">Waiting for more players...</p>
                <p className="text-sm">Current players: {gameState.players.length}/4</p>
              </div>
            </div>
          )}
          {gameState.status === 'dealerSelection' && (
            <DealerSelectionPanel 
              gameState={gameState} 
              socket={socket} 
              currentPlayer={player} 
            />
          )}

          {/* AI Management Panel */}
          {(gameState.status === 'waiting' || gameState.status === 'dealerSelection') && (
            <AIManagementPanel 
              gameState={gameState} 
              socket={socket} 
              player={player}
            />
          )}

          {/* Players in Room */}
          <h3 className="text-lg font-bold mt-8 mb-4">Players in Room</h3>
          <ul className="flex flex-wrap gap-4">
            {gameState.players.map(p => (
              <li key={p._id} className="bg-white/20 backdrop-blur-sm p-4 rounded-xl flex items-center space-x-4">
                <span className="text-3xl">{p.avatar}</span>
                <p className="font-semibold">{p.username}</p>
                {p.isAI && <span className="text-xs bg-gray-500 px-2 py-1 rounded-full">AI</span>}
                {p._id === player._id && <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">You</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className="mt-8 text-center text-gray-200 text-sm">
        <p>A simple card game built with React and Socket.IO</p>
      </footer>
    </div>
  );
}

export default App;
