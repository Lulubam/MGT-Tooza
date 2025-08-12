import React, { useState } from 'react';
import { io } from 'socket.io-client';
import GameLobby from './components/GameLobby';
import GameTable from './components/GameTable';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [player, setPlayer] = useState(null);

  const handleJoin = (playerData) => {
    const newPlayer = {
      ...playerData,
      id: Date.now().toString(),
      rings: { gold: 0, platinum: 0, diamond: 0 }
    };
    
    setPlayer(newPlayer);
    
    if (playerData.roomCode) {
      socket.emit('joinRoom', { 
        roomCode: playerData.roomCode,
        player: newPlayer
      });
    } else {
      socket.emit('createRoom', newPlayer);
    }
    
    socket.on('roomCreated', (roomCode) => {
      setCurrentRoom(roomCode);
    });
    
    socket.on('roomUpdated', (room) => {
      // Handle room updates
    });
  };

  return (
    <div className="app">
      {!currentRoom ? (
        <GameLobby onJoin={handleJoin} />
      ) : (
        <GameTable 
          socket={socket} 
          roomCode={currentRoom} 
          player={player} 
        />
      )}
    </div>
  );
}

export default App;
