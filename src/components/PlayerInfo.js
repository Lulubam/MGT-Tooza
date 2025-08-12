import React from 'react';
import './PlayerInfo.css';

const PlayerInfo = ({ player, isCurrent }) => {
  return (
    <div className={`player-info ${isCurrent ? 'current-player' : ''}`}>
      <div className="player-header">
        <span className="player-avatar">{player.avatar}</span>
        <span className="player-name">{player.name}</span>
        {player.isDealer && <span className="dealer-icon">👑</span>}
      </div>

      <div className="player-status">
        <span className="card-count">{player.cards?.length || 0} cards</span>
        <span className="points">{player.points || 0} points</span>
      </div>

      <div className="player-rings">
        {player.rings?.gold > 0 && (
          <span className="gold-ring">🥇×{player.rings.gold}</span>
        )}
        {player.rings?.platinum > 0 && (
          <span className="platinum-ring">🥈×{player.rings.platinum}</span>
        )}
        {player.rings?.diamond > 0 && (
          <span className="diamond-ring">💎</span>
        )}
      </div>
    </div>
  );
};

export default PlayerInfo;
