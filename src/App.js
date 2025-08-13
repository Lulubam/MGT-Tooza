import React, { useState, useEffect } from 'react';
import { API_URL } from './config';
import { socket, initSocketEvents, connectSocket } from './socket'; // Updated imports
import './App.css';

function App() {
  const [gameState, setGameState] = useState(null);
  const [player, setPlayer] = useState(null);

  // Initialize socket connection and events
  useEffect(() => {
    initSocketEvents(); // Initialize event listeners first
    connectSocket(); // Then connect

    socket.on('gameUpdate', (state) => {
      console.log('Game state update:', state);
      setGameState(state);
    });

    return () => {
      socket.off('gameUpdate');
      socket.disconnect();
    };
  }, []);

  const joinRoom = async (playerName, roomCode) => {
    try {
      const response = await fetch(`${API_URL}/join-room`, {
        method: 'POST',
        credentials: 'include', // Needed for cookies
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt')}` // If using JWT
        },
        body: JSON.stringify({ playerName, roomCode })
      });

      if (!response.ok) throw new Error('Join failed');
      
      const data = await response.json();
      setPlayer(data.player);
      
      // Reconnect socket with auth token if needed
      socket.auth.token = data.token || localStorage.getItem('jwt');
      socket.connect();
      
    } catch (err) {
      console.error('Join room error:', err);
      alert(`Join failed: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      {!player ? (
        <div className="lobby">
          <button onClick={() => joinRoom('Player1', 'ROOM123')}>
            Join Test Room
          </button>
        </div>
      ) : (
        <div className="game-table">
          <h2>Room: {gameState?.roomCode}</h2>
          <div className="players">
            {gameState?.players?.map(p => (
              <div key={p.id} className={`player ${p.id === player.id ? 'you' : ''}`}>
                {p.name} ({p.cards?.length} cards)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
