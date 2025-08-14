import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Lobby from './Lobby';
import GameRoom from './GameRoom';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null); // {code, players, yourHand}
  const [player, setPlayer] = useState(null); // {id, name}

  // Initialize socket
  useEffect(() => {
    const newSocket = io('https://your-backend.onrender.com');
    
    newSocket.on('game-state', (state) => {
      // Filter other players' cards
      const filteredState = {
        ...state,
        players: state.players.map(p => ({
          ...p,
          cards: p.id === player?.id ? p.cards : [] // Hide others' cards
        }))
      };
      setRoom(filteredState);
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [player?.id]);

  const joinRoom = async (name, code, isCreating) => {
    const endpoint = isCreating ? 'create-room' : 'join-room';
    const res = await fetch(`https://your-backend.onrender.com/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: name, roomCode: code })
    });
    
    const data = await res.json();
    if (data.success) {
      setPlayer({ id: data.playerId, name });
      socket.emit('join-game', { 
        playerId: data.playerId, 
        roomCode: data.roomCode 
      });
    }
  };

  return (
    <div className="app">
      {!room ? (
        <Lobby onJoin={joinRoom} />
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
