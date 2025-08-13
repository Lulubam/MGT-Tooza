import React, { useState, useEffect } from 'react';
import { API_URL } from './config';
import { socket, initSocket } from './socket';
import './App.css'; // Your existing CSS

function App() {
  const [gameState, setGameState] = useState(null);
  const [player, setPlayer] = useState(null);

  // Initialize socket when component mounts
  useEffect(() => {
    initSocket();
    socket.connect();

    // Listen for game updates
    socket.on('gameUpdate', (state) => setGameState(state));

    return () => {
      socket.off('gameUpdate');
      socket.disconnect();
    };
  }, []);

  // Join room function
  const joinRoom = async (playerName, roomCode) => {
    try {
      const response = await fetch(`${API_URL}/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode })
      });
      const data = await response.json();
      setPlayer(data.player);
    } catch (err) {
      console.error('Join room error:', err);
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
          <div className="cards">
            {gameState?.players.map(p => (
              <div key={p.id} className="player">
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
