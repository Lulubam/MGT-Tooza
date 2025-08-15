import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// =========================================================================
// Lobby Component
// This component handles the user's initial input to create or join a room.
// =========================================================================
const Lobby = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onJoin(playerName, roomCode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">Card Game Lobby</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-400">Player Name</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="mt-1 block w-full p-3 rounded-lg bg-gray-700 border-gray-600 focus:ring-teal-500 focus:border-teal-500 text-white"
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-400">Room Code (optional)</label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="mt-1 block w-full p-3 rounded-lg bg-gray-700 border-gray-600 focus:ring-teal-500 focus:border-teal-500 text-white"
              placeholder="Enter room code to join"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-teal-600 transition-colors duration-200"
          >
            {roomCode ? 'Join Room' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// GameRoom Component
// This component displays the current state of the game.
// =========================================================================
const GameRoom = ({ room, player }) => {
  if (!room || !player) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="text-center text-xl text-gray-400">Loading game room...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-2xl mt-8">
        <h1 className="text-3xl font-bold mb-4 text-center text-teal-400">Game Room: {room.code}</h1>
        <div className="mb-6">
          <p className="text-lg font-semibold text-gray-300">Your Name: {player.name}</p>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-200">Players in Room:</h2>
        <ul className="space-y-2">
          {room.players.map((p) => (
            <li key={p._id} className={`p-4 rounded-lg ${p._id === player._id ? 'bg-teal-700 font-bold' : 'bg-gray-700'}`}>
              <span className="font-semibold">{p.name}</span>
            </li>
          ))}
        </ul>
        <h2 className="text-2xl font-bold mt-6 mb-4 text-gray-200">Game State:</h2>
        <pre className="bg-gray-700 p-4 rounded-lg overflow-x-auto text-sm text-gray-100">
          {JSON.stringify(room.gameState, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// =========================================================================
// Main App Component
// This is the root component that handles state and routing.
// =========================================================================
export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Connect to the backend Socket.IO server
    const newSocket = io('https://mgt-toozabackend.onrender.com', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    // Set up event listeners for the socket
    newSocket.on('connect', () => {
      console.log('Socket connected, transport:', newSocket.io.engine.transport.name);
      setError(null); // Clear any previous errors on successful connection
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setError('Failed to connect to server. Please check the backend service.');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Reconnection failed after 3 attempts');
      setError('Failed to reconnect to server. Please refresh or try again later.');
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error.message);
      setError(error.message);
    });

    // Handle game state updates from the server
    newSocket.on('game-state', (state) => {
      // Filter out other players' cards for security and to prevent cheating
      const filteredState = {
        ...state,
        players: state.players.map(p => ({
          ...p,
          cards: p._id === player?._id ? p.cards : []
        }))
      };
      setRoom(filteredState);
      setLoading(false); // Stop loading once game state is received
    });

    setSocket(newSocket);
    // Disconnect socket on component unmount
    return () => newSocket.disconnect();
  }, [player?._id]);

  // Function to create a new room
  const createRoom = async (playerName) => {
    setLoading(true);
    try {
      setError(null);
      const res = await fetch('https://mgt-toozabackend.onrender.com/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        // After creating the room via HTTP, join it via WebSocket
        if (socket) {
          socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
        } else {
          throw new Error('Socket not available');
        }
      } else {
        throw new Error(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Create room error:', error.message);
      setError(`Error creating room: ${error.message}. This might be a CORS issue on the backend.`);
      setLoading(false);
    }
  };

  // Function to join an existing room
  const joinExistingRoom = async (playerName, roomCode) => {
    setLoading(true);
    try {
      setError(null);
      const res = await fetch('https://mgt-toozabackend.onrender.com/api/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        // After joining the room via HTTP, join it via WebSocket
        if (socket) {
          socket.emit('join-game', { playerId: data.playerId, roomCode });
        } else {
          throw new Error('Socket not available');
        }
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Join room error:', error.message);
      setError(`Error joining room: ${error.message}. This might be a CORS issue on the backend.`);
      setLoading(false);
    }
  };

  // This function decides whether to create or join a room
  const handleJoinOrCreate = (playerName, roomCode) => {
    if (roomCode) {
      joinExistingRoom(playerName, roomCode);
    } else {
      createRoom(playerName);
    }
  };

  return (
    <div className="app">
      {error && <div className="bg-red-500 text-white p-4 text-center rounded-lg m-4">{error}</div>}
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
          <div className="text-center text-xl text-gray-400">Loading...</div>
        </div>
      ) : !room ? (
        <Lobby onJoin={handleJoinOrCreate} />
      ) : (
        <GameRoom
          socket={socket}
          room={room}
          player={player}
        />
      )}
    </div>
  );
}
