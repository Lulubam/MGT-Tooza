// App.jsv3claude
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

const Card = ({ card, onClick, disabled, selected, small = false }) => {
  const suitColor = card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black';
  const cardSize = small ? 'w-12 h-16 text-xs' : 'w-20 h-28 text-sm';
  
  return (
    <button
      onClick={() => !disabled && onClick && onClick(card)}
      disabled={disabled}
      className={`relative bg-white rounded-lg shadow-lg border-2 ${cardSize} transition-all duration-200 ${
        selected ? 'ring-4 ring-blue-400 -translate-y-3 z-10' : 'hover:shadow-xl hover:-translate-y-1'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
    >
      <div className="absolute inset-1 border border-gray-300 rounded-md"></div>
      <div className={`absolute top-1 left-1 font-bold ${suitColor} ${small ? 'text-xs' : 'text-sm'}`}>
        <div>{card.rank}</div>
        <div className={`${small ? 'text-sm -mt-0.5' : 'text-base -mt-1'}`}>{card.suit}</div>
      </div>
      <div className={`absolute bottom-1 right-1 font-bold transform rotate-180 ${suitColor} ${small ? 'text-xs' : 'text-sm'}`}>
        <div>{card.rank}</div>
        <div className={`${small ? 'text-sm -mt-0.5' : 'text-base -mt-1'}`}>{card.suit}</div>
      </div>
    </button>
  );
};

const PlayerDisplay = ({ player, isCurrentPlayer, isMyself }) => {
  const icon = Object.values(AI_PLAYERS).find(ai => ai.name === player.username)?.avatar || '👤';
  const borderColor = isCurrentPlayer ? 'border-yellow-400 bg-yellow-100' : 'border-gray-200 bg-white';
  const eliminatedStyle = player.isEliminated ? 'opacity-50 bg-red-100' : '';
  
  return (
    <div className={`p-4 rounded-xl border-2 ${borderColor} ${eliminatedStyle} ${
      isCurrentPlayer ? 'shadow-lg ring-2 ring-yellow-300' : ''
    } ${isMyself ? 'ring-2 ring-blue-300' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <div className="font-bold text-gray-800 flex items-center space-x-2">
              <span>{player.username}</span>
              {player.isDealer && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">DEALER</span>}
              {isMyself && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">YOU</span>}
              {player.isEliminated && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">OUT</span>}
            </div>
            <div className="text-sm text-gray-600">
              Cards: {player.cards?.length || 0} | Points: {player.points || 0}/12
            </div>
          </div>
        </div>
        {isCurrentPlayer && !player.isEliminated && (
          <div className="text-right">
            <div className="text-xs text-yellow-700 font-semibold">YOUR TURN</div>
            <div className="text-xs text-yellow-600">⏰</div>
          </div>
        )}
      </div>
    </div>
  );
};

const DealerSelection = ({ dealerSelection }) => {
  if (!dealerSelection || dealerSelection.length === 0) return null;

  return (
    <div className="bg-white/90 p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🎴 Dealer Selection</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {dealerSelection.map((draw, i) => (
          <div key={i} className={`p-3 rounded-lg border-2 ${draw.isWinner ? 'bg-yellow-100 border-yellow-400' : 'bg-gray-50 border-gray-200'}`}>
            <div className="text-center">
              <div className="font-semibold text-gray-800">{draw.player}</div>
              {draw.isWinner && <div className="text-xs text-yellow-700 font-bold">👑 DEALER</div>}
              <div className="mt-2 flex justify-center">
                <Card card={draw.card} small={true} disabled={true} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CurrentTrick = ({ currentTrick, callingSuit }) => {
  if (!currentTrick || currentTrick.length === 0) return null;

  return (
    <div className="bg-white/90 p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        🃏 Current Trick {callingSuit && <span className="text-sm text-gray-600">- Following: {callingSuit}</span>}
      </h3>
      <div className="flex flex-wrap gap-4 justify-center">
        {currentTrick.map((play, i) => (
          <div key={i} className="text-center">
            <div className="font-semibold text-gray-800 mb-2">{play.player}</div>
            <Card card={play.card} disabled={true} />
          </div>
        ))}
      </div>
    </div>
  );
};

const DealingChoicePanel = ({ socket, roomCode, playerId }) => {
  const [autoDeal, setAutoDeal] = useState(true);
  const [highCard, setHighCard] = useState(true);

  const handleStartGame = () => {
    // First set the dealing mode
    socket.emit('game-action', {
      action: 'set-dealing-mode',
      autoDeal,
      highCard,
      playerId
    });
    
    // Then start the game
    setTimeout(() => {
      socket.emit('game-action', { action: 'startGame', playerId });
    }, 100);
  };

  return (
    <div className="bg-white/90 p-6 rounded-xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🎴 Dealer Options</h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Dealing Mode</h4>
          <div className="flex gap-4">
            <button
              onClick={() => setAutoDeal(true)}
              className={`px-4 py-2 rounded-lg ${autoDeal ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              🤖 Auto Deal
            </button>
            <button
              onClick={() => setAutoDeal(false)}
              className={`px-4 py-2 rounded-lg ${!autoDeal ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              👋 Manual Deal
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-2">Dealer Selection</h4>
          <div className="flex gap-4">
            <button
              onClick={() => setHighCard(true)}
              className={`px-4 py-2 rounded-lg ${highCard ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              🏆 Highest Card
            </button>
            <button
              onClick={() => setHighCard(false)}
              className={`px-4 py-2 rounded-lg ${!highCard ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              🥉 Lowest Card
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleStartGame}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
      >
        🚀 Start Game
      </button>
    </div>
  );
};

const GameRoom = ({ room, player, roomCode, socket }) => {
  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;
  const isDealer = currentPlayer?.isDealer;

  const handlePlayCard = (card) => {
    if (socket && isMyTurn) {
      socket.emit('game-action', { action: 'playCard', cardId: card.id });
    }
  };

  const handleDealCard = () => {
    if (socket) {
      socket.emit('game-action', { action: 'deal-next-card' });
    }
  };

  const activePlayers = room?.players?.filter(p => !p.isEliminated) || [];
  const gameStatus = room?.status || 'waiting';
  const gamePhase = room?.gamePhase || 'waiting';

  return (
    <div>
      <header className="flex justify-between items-center mb-6 text-white">
        <div>
          <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
          <p className="text-sm opacity-80">
            Status: {gameStatus} | Phase: {gamePhase} | Round: {room?.round || 1}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
        >
          Leave Room
        </button>
      </header>

      {/* Dealer Selection Results */}
      {room?.dealerSelection && <DealerSelection dealerSelection={room.dealerSelection} />}

      {/* Current Trick Display */}
      <CurrentTrick currentTrick={room?.currentTrick} callingSuit={room?.callingSuit} />

      {/* Dealer Choice Panel */}
      {gameStatus === 'waiting' && isDealer && (
        <DealingChoicePanel socket={socket} roomCode={roomCode} playerId={player._id} />
      )}

      {/* Manual Dealing */}
      {gamePhase === 'manual-dealing' && (
        <div className="bg-white/90 p-4 rounded-xl shadow-lg mb-4 text-center">
          <h3 className="font-bold text-gray-800 mb-2">🎴 Manual Dealing</h3>
          <p>Next to deal: <strong>{room.nextPlayerToDeal}</strong></p>
          <p className="text-sm text-gray-600">Phase: {room.dealingPhase} | Cards dealt: {room.players.reduce((sum, p) => sum + (p.cards?.length || 0), 0)}</p>
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
              <PlayerDisplay 
                key={i} 
                player={p} 
                isCurrentPlayer={p.isCurrent && !p.isEliminated}
                isMyself={p._id === player._id}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Game Status */}
          <div className="bg-white/90 p-4 rounded-xl shadow-lg">
            <h3 className="font-bold text-gray-800 mb-2">📊 Game Status</h3>
            <div className="text-sm space-y-1">
              <p>Active Players: {activePlayers.length}</p>
              <p>Current Round: {room?.round || 1}</p>
              <p>Tricks Played: {room?.trickHistory?.length || 0}</p>
              {room?.callingSuit && <p>Following Suit: {room.callingSuit}</p>}
            </div>
          </div>

          {/* AI Management */}
          <div className="bg-white/90 p-4 rounded-xl shadow-lg">
            <h3 className="font-bold text-gray-800 mb-3">🤖 AI Players</h3>
            <div className="space-y-2">
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
                    {isAdded ? '❌ Remove' : '✅ Add'} {config.avatar} {config.name} ({config.level})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Player's Hand */}
      {currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold">🃏 Your Hand ({currentPlayer.cards.length} cards)</h3>
            {isMyTurn && (
              <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                Your Turn!
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {currentPlayer.cards.map((card, i) => (
              <Card 
                key={i} 
                card={card} 
                onClick={isMyTurn ? handlePlayCard : undefined}
                disabled={!isMyTurn}
              />
            ))}
          </div>
          {isMyTurn && (
            <p className="text-white text-center mt-2 text-sm">
              Click a card to play it. {room?.callingSuit ? `You must follow suit: ${room.callingSuit}` : 'Any card allowed.'}
            </p>
          )}
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
  const [messages, setMessages] = useState([]);

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
      setError('');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket error:', err);
      setError('Failed to connect to server');
    });

    newSocket.on('game-state', (state) => {
      console.log('Received game state:', state);
      if (state) setRoom(state);
    });

    newSocket.on('game-message', (data) => {
      console.log('Game message:', data);
      setMessages(prev => [...prev.slice(-4), data.message]);
      setTimeout(() => setMessages(prev => prev.slice(1)), 5000);
    });

    newSocket.on('error', (data) => {
      console.error('Game error:', data);
      setError(data.message || 'An error occurred');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const createRoom = async (playerName) => {
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
      setError(err.message);
    }
  };

  const joinRoom = async (playerName, code) => {
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
      setError(err.message);
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
          <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg">
            {error} 
            <button onClick={() => setError('')} className="float-right ml-2">✕</button>
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
      {/* Error Messages */}
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50">
          {error} 
          <button onClick={() => setError('')} className="float-right ml-2">✕</button>
        </div>
      )}

      {/* Game Messages */}
      {messages.length > 0 && (
        <div className="fixed top-20 left-4 right-4 space-y-2 z-40">
          {messages.map((msg, i) => (
            <div key={i} className="bg-blue-600 text-white p-3 rounded-lg shadow-lg opacity-90">
              {msg}
            </div>
          ))}
        </div>
      )}

      <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />
    </div>
  );
}
