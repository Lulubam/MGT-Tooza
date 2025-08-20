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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoin(playerName, roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🃏 Trick Game</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Enter name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Code (optional)</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Join room"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
          >
            {roomCode ? 'Join Room' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

const PlayerDisplay = ({ player, isCurrentPlayer }) => {
  const getAvatar = () => {
    const ai = Object.values(AI_PLAYERS).find(ai => ai.name === player.username);
    return ai ? ai.avatar : '👤';
  };

  return (
    <div className={`p-4 rounded-xl border-2 ${
      player.isEliminated 
        ? 'bg-red-100 border-red-300 opacity-60' 
        : isCurrentPlayer 
          ? 'bg-yellow-100 border-yellow-400 shadow-lg' 
          : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        <span className="text-3xl">{getAvatar()}</span>
        <div>
          <div className="flex items-center space-x-2">
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

const AIManagementPanel = ({ onAIAction, gameState }) => {
  const added = gameState?.players?.filter(p => p.isAI).map(p => p.username) || [];

  return (
    <div className="bg-white/90 p-4 rounded-xl shadow-lg mb-4">
      <h3 className="font-bold text-gray-800 mb-3">🤖 AI Players</h3>
      <div className="space-y-2">
        {Object.entries(AI_PLAYERS).map(([key, config]) => {
          const isAdded = added.includes(config.name);
          return (
            <button
              key={key}
              onClick={() => onAIAction(isAdded ? 'remove' : 'add', key)}
              disabled={gameState?.players?.length >= 6 && !isAdded}
              className={`w-full p-2 rounded flex items-center space-x-2 text-sm ${
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
  );
};

const GameRoom = ({ room, player, roomCode, socket }) => {
  const currentPlayer = room?.players?.find(p => p._id === player._id);
  const isMyTurn = currentPlayer?.isCurrent && !currentPlayer.isEliminated;

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave-room', { playerId: player._id, roomCode });
      window.location.reload();
    }
  };

  const handlePlayCard = (card) => {
    if (socket && isMyTurn) {
      socket.emit('game-action', {
        action: 'playCard',
        data: { cardId: card.id }
      });
    }
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-6 text-white">
        <h1 className="text-2xl font-bold">Room: {roomCode}</h1>
        <button onClick={handleLeave} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">
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
            <>
              <AIManagementPanel onAIAction={(action, aiKey) => {
                socket.emit('manage-ai', { action, aiKey, roomCode });
              }} gameState={room} />
              <button
                onClick={() => socket.emit('game-action', { action: 'startGame' })}
                disabled={room.players.filter(p => !p.isEliminated).length < 2}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white py-3 rounded-lg"
              >
                Start Game ({room.players.filter(p => !p.isEliminated).length}/2+)
              </button>
            </>
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
                className="bg-white p-1 rounded shadow hover:scale-105 transition"
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
  const [roomCode, setRoomCode] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const serverUrl = process.env.NODE_ENV === 'production'
      ? 'https://mgt-toozabackend.onrender.com'
      : 'http://localhost:3001';

    const newSocket = io(serverUrl, { transports: ['websocket', 'polling'], withCredentials: true });
    setSocket(newSocket);

    newSocket.on('connect', () => console.log('Connected'));
    newSocket.on('error', (err) => setError(err.message));
    newSocket.on('game-state', (gs) => setRoom(gs));

    return () => newSocket.close();
  }, []);

  const createRoom = async (name) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name })
      });

      if (!res.ok) throw new Error('Failed to create room');

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name });
        setRoomCode(data.roomCode);
        socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
      } else throw new Error(data.error);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (name, code) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name, roomCode: code })
      });

      if (!res.ok) throw new Error('Failed to join room');

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name });
        setRoomCode(code);
        socket.emit('join-game', { playerId: data.playerId, roomCode: code });
      } else throw new Error(data.error);
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

  if (!player) return <Lobby onJoin={handleJoin} />;
  if (!room) return <div className="text-white">Loading game...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 p-4">
      {error && <div className="bg-red-600 text-white p-2 rounded mb-4">{error}</div>}
      <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />
    </div>
  );
}
