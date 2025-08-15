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
const GameRoom = ({ room, player, roomCode }) => {
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
        <h1 className="text-3xl font-bold mb-4 text-center text-teal-400">Game Room: {roomCode}</h1>
        <div className="mb-6">
          <p className="text-lg font-semibold text-gray-300">Your Name: {player.name}</p>
          <p className="text-sm text-gray-400">Player ID: {player._id}</p>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-gray-200">Game Status:</h2>
        <div className="bg-gray-700 p-4 rounded-lg mb-6">
          <p className="text-lg">Status: <span className="font-bold text-teal-400">{room.status}</span></p>
          <p className="text-lg">Phase: <span className="font-bold text-teal-400">{room.gamePhase}</span></p>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-200">Players in Room:</h2>
        <ul className="space-y-2 mb-6">
          {room.players && room.players.length > 0 ? (
            room.players.map((p, index) => (
              <li key={p._id || index} className={`p-4 rounded-lg ${p._id === player._id ? 'bg-teal-700 font-bold' : 'bg-gray-700'}`}>
                <span className="font-semibold">{p.username || p.name || `Player ${index + 1}`}</span>
                {p._id === player._id && <span className="ml-2 text-teal-200">(You)</span>}
              </li>
            ))
          ) : (
            <li className="p-4 rounded-lg bg-gray-700 text-gray-400">No players found</li>
          )}
        </ul>

        <h2 className="text-2xl font-bold mt-6 mb-4 text-gray-200">Full Game State:</h2>
        <pre className="bg-gray-700 p-4 rounded-lg overflow-x-auto text-sm text-gray-100">
          {JSON.stringify(room, null, 2)}
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
  const [roomCode, setRoomCode] = useState(null);
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
      setLoading(false);
    });

    // Handle game state updates from the server - FIXED
    newSocket.on('game-state', (gameState) => {
      console.log('Received game state:', gameState);
      
      // Set the room state directly from gameState
      setRoom(gameState);
      setLoading(false); // Stop loading once game state is received
      
      // If we don't have players populated yet, try to get room info
      if (!gameState.players || gameState.players.length === 0) {
        console.warn('Game state has no players');
      }
    });

    setSocket(newSocket);
    // Disconnect socket on component unmount
    return () => newSocket.disconnect();
  }, []);

  // Function to create a new room
  const createRoom = async (playerName) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating room for player:', playerName);
      
      const res = await fetch('https://mgt-toozabackend.onrender.com/api/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log('Create room response:', data);
      
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        
        // After creating the room via HTTP, join it via WebSocket
        if (socket && socket.connected) {
          console.log('Joining game via WebSocket...');
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

  // Function to join an existing room
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
        const errorText = await res.text();
        throw new Error(`HTTP error ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log('Join room response:', data);
      
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        
        // After joining the room via HTTP, join it via WebSocket
        if (socket && socket.connected) {
          console.log('Joining game via WebSocket...');
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

  // This function decides whether to create or join a room
  const handleJoinOrCreate = (playerName, roomCodeInput) => {
    if (roomCodeInput && roomCodeInput.trim()) {
      joinExistingRoom(playerName, roomCodeInput.trim().toUpperCase());
    } else {
      createRoom(playerName);
    }
  };

  return (
    <div className="app">
      {error && (
        <div className="bg-red-500 text-white p-4 text-center rounded-lg m-4">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-sm"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
          <div className="text-center">
            <div className="text-xl text-gray-400 mb-4">Loading...</div>
            <div className="text-sm text-gray-500">
              {player ? `Joining room as ${player.name}...` : 'Setting up connection...'}
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
