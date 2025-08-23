// App.jsv8claude - Enhanced Version with Casino Theme and Manual Controls
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const AI_PLAYERS = {
  otu: { name: 'Otu', level: 'beginner', avatar: '🤖' },
  ase: { name: 'Ase', level: 'beginner', avatar: '🎭' },
  dede: { name: 'Dede', level: 'intermediate', avatar: '🎪' },
  ogbologbo: { name: 'Ogbologbo', level: 'advanced', avatar: '🎯' },
  agba: { name: 'Agba', level: 'advanced', avatar: '🏆' }
};

// Lobby Component with Casino Theme
const Lobby = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = () => {
    if (playerName.trim()) {
      onJoin(playerName, roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-1 rounded-2xl shadow-2xl">
        <div className="bg-gradient-to-br from-red-800 to-red-900 p-8 rounded-xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">🎰 ROYAL TRICKS 🎰</h1>
            <div className="text-yellow-200 text-sm">Premium Card Game Experience</div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-1">Player Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-yellow-600 bg-black text-yellow-100 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter your royal name"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-yellow-200 mb-1">Room Code (optional)</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-lg border-2 border-yellow-600 bg-black text-yellow-100 focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="Enter code to join royal table"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black py-3 px-4 rounded-lg font-bold text-lg shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
            >
              {roomCode ? '🚪 Join Royal Table' : '👑 Create Royal Table'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Card Component with Proper Colors and Casino Style
const Card = ({ card, onClick, disabled, selected, isPlayedCard, isSmall }) => {
  if (!card) return null;

  // Fix: Proper color mapping for suits
  const getSuitColor = (suit) => {
    switch (suit) {
      case '♥': case '♦': return 'text-red-600';
      case '♠': case '♣': return 'text-black';
      default: return 'text-black';
    }
  };

  const suitColor = getSuitColor(card.suit);
  
  if (isPlayedCard || isSmall) {
    const size = isSmall ? 'w-12 h-16' : 'w-16 h-22';
    return (
      <div className={`relative bg-white rounded-lg shadow-md border ${size} mx-1`}>
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
        if (disabled) return;
        if (!card?.id) return;
        onClick(card);
      }}
      disabled={disabled}
      className={`relative bg-white rounded-xl shadow-lg border-2 w-24 h-32 transition-all duration-200 hover:shadow-2xl ${
        selected ? 'ring-4 ring-yellow-400 -translate-y-3 z-10 shadow-yellow-400/50' : 'hover:-translate-y-1'
      } ${disabled ? 'opacity-60' : 'hover:scale-105 transform'}`}
    >
      <div className="absolute inset-1 border border-gray-300 rounded-lg bg-gradient-to-br from-white to-gray-50"></div>
      <div className={`absolute top-2 left-2 text-sm font-bold ${suitColor}`}>
        <div className="text-lg">{card.rank}</div>
        <div className="text-xl -mt-1">{card.suit}</div>
      </div>
      <div className="absolute bottom-2 right-2 text-sm font-bold transform rotate-180">
        <div className="text-lg">{card.rank}</div>
        <div className={`${suitColor} text-xl -mt-1`}>{card.suit}</div>
      </div>
      
      {/* Casino-style center decoration */}
      <div className={`absolute inset-0 flex items-center justify-center ${suitColor} opacity-10`}>
        <div className="text-6xl">{card.suit}</div>
      </div>
    </button>
  );
};

// Current Trick Display with Casino Theme
const CurrentTrick = ({ trick, callingSuit }) => {
  if (!trick || trick.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-green-800 to-green-900 p-6 rounded-xl border-2 border-yellow-600 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-yellow-400 font-bold text-xl">🎯 Current Trick</h3>
        {callingSuit && (
          <div className="bg-black px-3 py-1 rounded-full border border-yellow-600">
            <span className="text-yellow-400 text-sm font-medium">Leading Suit: </span>
            <span className="text-2xl">{callingSuit}</span>
          </div>
        )}
      </div>
      <div className="flex justify-center space-x-4 bg-black/20 p-4 rounded-lg">
        {trick.map((play, i) => (
          <div key={i} className="text-center">
            <Card card={play.card} isPlayedCard={true} />
            <div className="text-yellow-200 text-sm mt-2 bg-black/40 px-2 py-1 rounded">
              <span className="mr-1">{play.avatar}</span>
              <span>{play.player}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Point Adjustment Modal
const PointAdjustmentModal = ({ isOpen, onClose, players, onAdjust }) => {
  const [targetPlayer, setTargetPlayer] = useState('');
  const [adjustment, setAdjustment] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (targetPlayer && adjustment !== 0) {
      onAdjust(targetPlayer, parseInt(adjustment));
      setTargetPlayer('');
      setAdjustment(0);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-red-800 to-red-900 p-6 rounded-xl border-2 border-yellow-600 max-w-md w-full mx-4">
        <h3 className="text-yellow-400 font-bold text-xl mb-4">🎯 Adjust Points</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-yellow-200 mb-2">Select Player:</label>
            <select 
              value={targetPlayer} 
              onChange={(e) => setTargetPlayer(e.target.value)}
              className="w-full p-2 rounded bg-black text-yellow-100 border border-yellow-600"
            >
              <option value="">Choose player...</option>
              {players.map(p => (
                <option key={p._id} value={p._id}>{p.username} (Current: {p.points})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-yellow-200 mb-2">Point Adjustment:</label>
            <input
              type="number"
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
              className="w-full p-2 rounded bg-black text-yellow-100 border border-yellow-600"
              placeholder="+/- points"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleSubmit}
              disabled={!targetPlayer || adjustment === 0}
              className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black py-2 rounded font-bold disabled:opacity-50"
            >
              Apply
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Player Display with Casino Theme
const PlayerDisplay = ({ player, isCurrentPlayer, isMyself }) => {
  const icon = Object.values(AI_PLAYERS).find(ai => ai.name === player.username)?.avatar || player.avatar || '👤';

  return (
    <div className={`p-4 rounded-xl border-2 transition-all shadow-lg ${
      isCurrentPlayer ? 'bg-gradient-to-br from-yellow-200 to-yellow-100 border-yellow-600 shadow-yellow-400/50 ring-2 ring-yellow-400' : 'bg-gradient-to-br from-gray-100 to-white border-gray-300'
    } ${player.isEliminated ? 'opacity-60 grayscale' : ''} ${isMyself ? 'ring-2 ring-blue-400' : ''}`}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-2xl shadow-lg">
            {icon}
          </div>
          {isCurrentPlayer && !player.isEliminated && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
          )}
          {player.isDealer && (
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold border-2 border-white">D</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <div className="font-bold text-gray-800 text-lg">{player.username}</div>
            {isMyself && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">You</span>}
            {player.isEliminated && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">Eliminated</span>}
            {player.isAI && <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">AI</span>}
          </div>
          <div className="text-sm text-gray-700 font-medium">
            <span className="bg-black/10 px-2 py-1 rounded mr-2">Cards: {player.cards?.length || 0}</span>
            <span className={`px-2 py-1 rounded ${player.points >= 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              Points: {player.points || 0}
              {player.points >= 10 && <span className="ml-1">⚠️</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Game Room Component
const GameRoom = ({ room, player, roomCode, socket }) => {
  const [dealerSelectionCards, setDealerSelectionCards] = useState([]);
  const [showPointAdjustment, setShowPointAdjustment] = useState(false);
  
  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;
  const activePlayers = room?.players?.filter(p => !p.isEliminated) || [];

  const handlePlayCard = (card) => {
    if (!socket?.connected || !isMyTurn || !card?.id) return;
    socket.emit('game-action', { action: 'playCard', cardId: card.id });
  };

  const handleStartGame = (isManual = false) => {
    if (socket) {
      socket.emit('game-action', { 
        action: 'startGame', 
        data: { isManual }
      });
    }
  };

  const handleOptOut = () => {
    if (socket) {
      socket.emit('game-action', { action: 'optOutLastTrick' });
    }
  };

  const handleContinueRound = () => {
    if (socket) {
      socket.emit('game-action', { action: 'continueToNextRound' });
    }
  };

  const handlePointAdjustment = (targetPlayerId, adjustment) => {
    if (socket) {
      socket.emit('game-action', { 
        action: 'adjustPoints',
        data: { targetPlayerId, adjustment }
      });
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('dealer-selected', (data) => {
        if (data.dealerSelectionCards) {
          setDealerSelectionCards(data.dealerSelectionCards);
          setTimeout(() => setDealerSelectionCards([]), 7000);
        }
      });

      return () => socket.off('dealer-selected');
    }
  }, [socket]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-900">
      {/* Header with Casino Theme */}
      <header className="bg-gradient-to-r from-red-800 to-red-900 border-b-4 border-yellow-600 p-4 shadow-2xl">
        <div className="flex justify-between items-center text-yellow-400">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">🎰 Room: {roomCode}</h1>
            <div className="text-sm bg-black/40 px-3 py-1 rounded-full">
              Round: {room?.round || 1} | Phase: {room?.gamePhase || 'waiting'}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPointAdjustment(true)}
              className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1 rounded font-medium text-sm"
            >
              ⚙️ Adjust Points
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-medium"
            >
              🚪 Leave Table
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Dealer Selection Display */}
        {dealerSelectionCards.length > 0 && (
          <div className="bg-gradient-to-br from-purple-800 to-purple-900 border-2 border-yellow-600 p-4 rounded-xl">
            <h3 className="font-bold text-yellow-400 mb-3">🎴 Dealer Selection - Highest Card Wins!</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {dealerSelectionCards.map((draw, i) => (
                <div key={i} className="text-center">
                  <Card card={draw.card} isSmall={true} />
                  <div className="text-yellow-200 text-sm mt-1 font-medium">{draw.player}</div>
                  <div className="text-yellow-400 text-xs bg-black/40 px-2 py-1 rounded">Rank: {draw.rank}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-3 space-y-6">
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

            {/* Game Status Messages */}
            {room?.gamePhase === 'lastTrickChoice' && (
              <div className="bg-gradient-to-br from-orange-800 to-orange-900 p-4 rounded-xl border-2 border-yellow-600">
                <h3 className="text-yellow-400 font-bold text-xl mb-2">⚠️ Final Trick Decision</h3>
                <p className="text-yellow-200 mb-4">
                  This is the last trick! You can opt out to avoid penalty points, but risk getting them if the player before you wins.
                </p>
                <button
                  onClick={handleOptOut}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-bold mr-2"
                >
                  🚫 Opt Out
                </button>
                <button
                  onClick={() => {}} 
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold"
                >
                  🎯 Play Final Trick
                </button>
              </div>
            )}

            {/* Round End */}
            {room?.gamePhase === 'roundEnd' && (
              <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-4 rounded-xl border-2 border-yellow-600">
                <h3 className="text-yellow-400 font-bold text-xl mb-2">🏁 Round Complete!</h3>
                <p className="text-yellow-200 mb-4">Round {(room?.round || 1) - 1} is finished. Ready for the next round?</p>
                <button
                  onClick={handleContinueRound}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-lg"
                >
                  ▶️ Start Next Round
                </button>
              </div>
            )}

            {/* Game End */}
            {room?.gamePhase === 'gameEnd' && (
              <div className="bg-gradient-to-br from-purple-800 to-purple-900 p-6 rounded-xl border-4 border-yellow-400 text-center">
                <h2 className="text-yellow-400 font-bold text-3xl mb-4">🎉 GAME OVER! 🎉</h2>
                <div className="text-2xl text-yellow-200 mb-4">
                  👑 Winner: <span className="text-yellow-400 font-bold">{room?.roundWinner?.username || 'None'}</span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-8 py-3 rounded-lg font-bold text-lg"
                >
                  🎮 New Game
                </button>
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            {/* Game Start Controls */}
            {room?.status === 'waiting' && activePlayers.length >= 2 && (
              <div className="bg-gradient-to-br from-green-800 to-green-900 p-4 rounded-xl border-2 border-yellow-600">
                <h3 className="text-yellow-400 font-bold mb-3">🎮 Start Game</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleStartGame(false)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold text-lg"
                  >
                    ⚡ Auto Deal & Start
                  </button>
                  <button
                    onClick={() => handleStartGame(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium"
                  >
                    🎴 Manual Dealing
                  </button>
                </div>
              </div>
            )}

            {/* AI Management */}
            <div className="bg-gradient-to-br from-purple-800 to-purple-900 p-4 rounded-xl border-2 border-yellow-600">
              <h3 className="font-bold text-yellow-400 mb-3">🤖 AI Players</h3>
              <div className="space-y-2">
                {Object.entries(AI_PLAYERS).map(([key, config]) => {
                  const isAdded = room?.players?.some(p => p.username === config.name && p.isAI);
                  return (
                    <button
                      key={key}
                      onClick={() => socket.emit('manage-ai', { action: isAdded ? 'remove' : 'add', aiKey: key })}
                      disabled={room?.players?.length >= 6 && !isAdded}
                      className={`w-full p-2 rounded text-sm font-medium transition flex items-center justify-between ${
                        isAdded
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-green-600 hover:bg-green-500 text-white'
                      } disabled:opacity-50`}
                    >
                      <span className="flex items-center">
                        <span className="mr-2">{config.avatar}</span>
                        <span>{config.name}</span>
                        <span className="ml-1 text-xs">({config.level})</span>
                      </span>
                      <span>{isAdded ? '❌' : '✅'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game Statistics */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border-2 border-yellow-600">
              <h3 className="font-bold text-yellow-400 mb-3">📊 Game Stats</h3>
              <div className="text-yellow-200 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Players:</span>
                  <span>{room?.players?.length || 0}/6</span>
                </div>
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span>{activePlayers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tricks Played:</span>
                  <span>{room?.tricksInRound || 0}/5</span>
                </div>
                {room?.trickHistory && (
                  <div className="flex justify-between">
                    <span>Total Tricks:</span>
                    <span>{room.trickHistory.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rules Reference */}
            <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 p-4 rounded-xl border-2 border-yellow-600">
              <h3 className="font-bold text-yellow-400 mb-2">📜 Quick Rules</h3>
              <div className="text-yellow-200 text-xs space-y-1">
                <div>• Follow suit if possible</div>
                <div>• Highest rank of lead suit wins</div>
                <div>• 12+ points = elimination</div>
                <div>• Black 3♠ = 12 points</div>
                <div>• Other 3s = 6 points</div>
                <div>• 4s = 4 points, Aces = 2 points</div>
                <div>• Others = 1 point</div>
              </div>
            </div>
          </div>
        </div>

        {/* Player's Hand */}
        {isMyTurn && currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-green-800 to-green-900 p-6 rounded-xl border-2 border-yellow-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-yellow-400 font-bold text-2xl">🃏 Your Royal Hand</h3>
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-600 text-black px-4 py-2 rounded-full font-bold animate-pulse">
                  👑 YOUR TURN 👑
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center bg-black/20 p-4 rounded-lg">
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
              <div className="text-center mt-4">
                <div className="inline-flex items-center bg-black/40 px-4 py-2 rounded-full border border-yellow-600">
                  <span className="text-yellow-400 font-medium mr-2">Must follow suit:</span>
                  <span className="text-3xl">{room.callingSuit}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Waiting Indicator */}
        {!isMyTurn && room?.gamePhase === 'playing' && (
          <div className="text-center mt-8">
            <div className="inline-block bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-yellow-600 p-6 rounded-xl">
              <div className="text-yellow-400 font-bold text-xl mb-2">
                ⏳ Waiting for {room?.players?.find(p => p.isCurrent)?.username || 'other player'}...
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Point Adjustment Modal */}
      <PointAdjustmentModal
        isOpen={showPointAdjustment}
        onClose={() => setShowPointAdjustment(false)}
        players={room?.players || []}
        onAdjust={handlePointAdjustment}
      />
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
      // You could show these messages in a toast notification
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
          <div className="fixed bottom-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 border border-red-400">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-2 text-white hover:text-gray-200 font-bold">✕</button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
        <div className="text-center">
          <div className="text-yellow-400 text-3xl font-bold mb-4">🎰 Loading Royal Table... 🎰</div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />
      {error && (
        <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 border border-red-400 max-w-md">
          <div className="flex items-start justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError('')} className="ml-2 text-white hover:text-gray-200 font-bold">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
