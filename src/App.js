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
// Card Component
// =========================================================================
const Card = ({ card, onClick, disabled }) => {
  const suitColors = {
    '♠': 'text-black',
    '♣': 'text-black', 
    '♥': 'text-red-500',
    '♦': 'text-red-500'
  };

  return (
    <div 
      className={`
        bg-white border-2 border-gray-300 rounded-lg p-2 m-1 cursor-pointer
        hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}
        w-16 h-20 flex flex-col items-center justify-center text-sm font-bold
      `}
      onClick={() => !disabled && onClick && onClick(card)}
    >
      <div className={`${suitColors[card.suit]} text-lg`}>
        {card.rank}
      </div>
      <div className={`${suitColors[card.suit]} text-2xl`}>
        {card.suit}
      </div>
    </div>
  );
};

// =========================================================================
// Player Display Component
// =========================================================================
const PlayerDisplay = ({ player, isCurrentPlayer, isYou }) => {
  const getPlayerTypeIcon = (username) => {
    const aiPlayer = Object.values(AI_PLAYERS).find(ai => ai.name === username);
    return aiPlayer ? aiPlayer.avatar : '👤';
  };

  const getPlayerLevel = (username) => {
    const aiPlayer = Object.values(AI_PLAYERS).find(ai => ai.name === username);
    return aiPlayer ? ` (${aiPlayer.level})` : '';
  };

  return (
    <div className={`
      p-3 rounded-lg border-2 transition-all duration-300
      ${isCurrentPlayer ? 'border-yellow-400 bg-yellow-100' : 'border-gray-300 bg-white'}
      ${isYou ? 'ring-2 ring-blue-400' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getPlayerTypeIcon(player.username)}</span>
          <div>
            <span className="font-semibold text-gray-800">
              {player.username}{getPlayerLevel(player.username)}
            </span>
            {isYou && <span className="text-blue-600 font-medium ml-2">(You)</span>}
            {player.isDealer && <span className="text-purple-600 font-medium ml-2">👑 Dealer</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Cards: {player.cards?.length || 0}</div>
          <div className="text-sm text-gray-600">Points: {player.points || 0}</div>
        </div>
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
  const [selectedAIPlayers, setSelectedAIPlayers] = useState([]);
  const [showAISelection, setShowAISelection] = useState(false);

  const handleSubmit = () => {
    if (playerName.trim()) {
      onJoin(playerName, roomCode, selectedAIPlayers);
    }
  };

  const toggleAIPlayer = (aiKey) => {
    setSelectedAIPlayers(prev => 
      prev.includes(aiKey) 
        ? prev.filter(key => key !== aiKey)
        : [...prev, aiKey]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 flex items-center justify-center p-4">
      {/* Solitaire-style background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">♠</div>
        <div className="absolute top-20 right-20 text-6xl text-red-500">♥</div>
        <div className="absolute bottom-20 left-20 text-6xl text-red-500">♦</div>
        <div className="absolute bottom-10 right-10 text-6xl">♣</div>
        <div className="absolute top-1/2 left-1/4 text-4xl transform -rotate-12">🃏</div>
        <div className="absolute top-1/3 right-1/3 text-4xl transform rotate-12">🎴</div>
      </div>
      
      <div className="relative bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold mb-6 text-center text-green-800">Whot! Card Game</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">Your Name</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-1 block w-full p-3 rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">Room Code (optional)</label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="mt-1 block w-full p-3 rounded-lg border border-gray-300 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter code to join existing room"
            />
          </div>

          {!roomCode && (
            <div>
              <button
                type="button"
                onClick={() => setShowAISelection(!showAISelection)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200 mb-3"
              >
                {showAISelection ? 'Hide AI Players' : 'Add AI Players'}
              </button>
              
              {showAISelection && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold text-gray-700 mb-2">Select AI Opponents:</h3>
                  {Object.entries(AI_PLAYERS).map(([key, ai]) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAIPlayers.includes(key)}
                        onChange={() => toggleAIPlayer(key)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xl">{ai.avatar}</span>
                      <span className="text-sm font-medium">
                        {ai.name} <span className="text-gray-500">({ai.level})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={!playerName.trim()}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {roomCode ? 'Join Room' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// GameRoom Component
// =========================================================================
const GameRoom = ({ room, player, roomCode, socket }) => {
  const [selectedCard, setSelectedCard] = useState(null);

  if (!room || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 flex items-center justify-center">
        <div className="text-white text-xl">Loading game room...</div>
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
      // Reset the local state
      window.location.reload(); // Simple way to return to lobby
    }
  };

  const handlePlayCard = (card) => {
    if (socket && selectedCard) {
      socket.emit('game-action', {
        action: 'playCard',
        data: { cardId: selectedCard.id }
      });
      setSelectedCard(null);
    }
  };

  const currentPlayer = room.players?.find(p => p.id === player._id || p._id === player._id);
  const isDealer = currentPlayer?.isDealer || false;
  const canStartGame = room.status === 'waiting' && isDealer && room.players?.length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 p-4">
      {/* Solitaire-style background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-8xl">♠</div>
        <div className="absolute top-20 right-20 text-8xl text-red-500">♥</div>
        <div className="absolute bottom-20 left-20 text-8xl text-red-500">♦</div>
        <div className="absolute bottom-10 right-10 text-8xl">♣</div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-green-800">Room: {roomCode}</h1>
              <p className="text-gray-600">Playing as: {player.name}</p>
            </div>
            <div className="flex space-x-3">
              {canStartGame && (
                <button
                  onClick={handleStartGame}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  🎮 Start Game
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                🚪 Leave Room
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              room.status === 'waiting' ? 'bg-yellow-200 text-yellow-800' :
              room.status === 'playing' ? 'bg-green-200 text-green-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              Status: {room.status}
            </span>
            <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
              Phase: {room.gamePhase}
            </span>
            {room.round && (
              <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                Round: {room.round}
              </span>
            )}
          </div>
        </div>

        {/* Players */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Players ({room.players?.length || 0})</h2>
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
                No players found
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        {room.status === 'playing' && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Area</h2>
            
            {/* Current Trick */}
            {room.currentTrick && room.currentTrick.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Current Trick:</h3>
                <div className="flex flex-wrap gap-2">
                  {room.currentTrick.map((play, index) => (
                    <div key={index} className="text-center">
                      <Card card={play.card} disabled={true} />
                      <div className="text-sm text-gray-600 mt-1">{play.playerName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player's Hand */}
            {currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Your Cards:</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentPlayer.cards.map((card, index) => (
                    <Card
                      key={card.id || index}
                      card={card}
                      onClick={setSelectedCard}
                      disabled={!currentPlayer.isCurrent}
                    />
                  ))}
                </div>
                
                {selectedCard && currentPlayer.isCurrent && (
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <p className="mb-2">Selected: {selectedCard.rank} {selectedCard.suit}</p>
                    <button
                      onClick={() => handlePlayCard(selectedCard)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold mr-2"
                    >
                      Play Card
                    </button>
                    <button
                      onClick={() => setSelectedCard(null)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Debug Info</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify({ room, player }, null, 2)}
          </pre>
        </div>
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
    const newSocket = io('https://mgt-toozabackend.onrender.com', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setError(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to server. Please check the backend service.');
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
      // Game state will be updated via 'game-state' event
    });

    newSocket.on('player-left', (data) => {
      console.log('Player left:', data);
      // Game state will be updated via 'game-state' event
    });

    newSocket.on('game-started', (data) => {
      console.log('Game started:', data);
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const createRoom = async (playerName, aiPlayers = []) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating room for player:', playerName, 'with AI players:', aiPlayers);
      
      const res = await fetch('https://mgt-toozabackend.onrender.com/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, aiPlayers }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      console.log('Create room response:', data);
      
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        
        if (socket && socket.connected) {
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
      console.log('Joining room:', roomCodeInput, 'as player:', playerName);
      
      const res = await fetch('https://mgt-toozabackend.onrender.com/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode: roomCodeInput }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      console.log('Join room response:', data);
      
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        
        if (socket && socket.connected) {
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

  const handleJoinOrCreate = (playerName, roomCodeInput, aiPlayers = []) => {
    if (roomCodeInput && roomCodeInput.trim()) {
      joinExistingRoom(playerName, roomCodeInput.trim().toUpperCase());
    } else {
      createRoom(playerName, aiPlayers);
    }
  };

  return (
    <div className="app">
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-2xl text-center">
            <div className="text-2xl text-green-800 mb-4">🎴 Loading...</div>
            <div className="text-gray-600">
              {player ? `Joining room as ${player.name}...` : 'Setting up connection...'}
            </div>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
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
