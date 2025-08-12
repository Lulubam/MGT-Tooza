import React, { useState } from 'react';
import { avatars } from '../data/avatars';
import './GameLobby.css';

const GameLobby = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="game-lobby">
      <h1>Card Game</h1>
      
      <div className="avatar-selection">
        <h3>Choose Avatar</h3>
        <div className="avatar-grid">
          {avatars.map(avatar => (
            <div 
              key={avatar}
              className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
              onClick={() => setSelectedAvatar(avatar)}
            >
              {avatar}
            </div>
          ))}
        </div>
      </div>

      <div className="player-info">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="room-actions">
        <button 
          onClick={() => onJoin({ name, avatar: selectedAvatar })}
          disabled={!name}
        >
          Create New Room
        </button>

        <div className="join-room">
          <input
            type="text"
            placeholder="Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          <button 
            onClick={() => onJoin({ name, avatar: selectedAvatar, roomCode })}
            disabled={!name || !roomCode}
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
