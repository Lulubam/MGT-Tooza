// App.js - Trick-Taking Card Game with Manual Dealing
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// =========================================================================
// AI Players Configuration
// =========================================================================
const AI_PLAYERS = {
  'otu': { name: 'Otu', level: 'beginner', avatar: '🤖' },
  'ase': { name: 'Ase', level: 'beginner', avatar: '🎭' },
  'dede': { name: 'Dede', level: 'intermediate', avatar: '🎪' },
  'ogbologbo': { name: 'Ogbologbo', level: 'advanced', avatar: '🎯' },
  'agba': { name: 'Agba', level: 'advanced', avatar: '👑' }
};

// =========================================================================
// Realistic Card Component
// =========================================================================
const Card = ({ card, onClick, disabled, selected, canPlay, inTrick = false }) => {
  const suitColors = {
    '♠': 'text-black',
    '♣': 'text-black', 
    '♥': 'text-red-600',
    '♦': 'text-red-600'
  };

  const getCardValue = (card) => {
    if (card.rank === '3' && card.suit === '♠') return '12pts';
    if (card.rank === '3') return '6pts';
    if (card.rank === '4') return '4pts';
    if (card.rank === 'A') return '2pts';
    return '1pt';
  };

  return (
    <div 
      className={`
        relative bg-white rounded-xl shadow-lg transform transition-all duration-300 cursor-pointer
        ${disabled ? 'opacity-60 cursor-not-allowed' : 
          canPlay ? 'hover:shadow-xl hover:-translate-y-2 hover:rotate-1 ring-2 ring-green-400' : 
          'hover:shadow-xl hover:-translate-y-1'}
        ${selected ? 'ring-4 ring-blue-400 -translate-y-3 rotate-2 z-10' : ''}
        ${card.isSpecial ? 'ring-2 ring-yellow-400' : ''}
        ${inTrick ? 'w-16 h-22' : 'w-20 h-28'} border-2 border-gray-800
      `}
      onClick={() => !disabled && onClick && onClick(card)}
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: disabled ? '2px 2px 8px rgba(0,0,0,0.1)' : '4px 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      {/* Card Border Pattern */}
      <div className="absolute inset-1 border border-gray-400 rounded-lg"></div>
      
      {/* Top Left Corner */}
      <div className={`absolute top-1 left-1 flex flex-col items-center ${suitColors[card.suit]} font-bold text-xs leading-tight`}>
        <span className={inTrick ? "text-sm" : "text-sm"}>{card.rank}</span>
        <span className={`${inTrick ? "text-lg" : "text-base"} -mt-1`}>{card.suit}</span>
      </div>
      
      {/* Center Symbol */}
      <div className={`absolute inset-0 flex items-center justify-center ${suitColors[card.suit]} ${inTrick ? "text-2xl" : "text-3xl"} font-bold`}>
        {card.suit}
      </div>
      
      {/* Bottom Right Corner (Rotated) */}
      <div className={`absolute bottom-1 right-1 flex flex-col items-center ${suitColors[card.suit]} font-bold text-xs leading-tight transform rotate-180`}>
        <span className={inTrick ? "text-sm" : "text-sm"}>{card.rank}</span>
        <span className={`${inTrick ? "text-lg" : "text-base"} -mt-1`}>{card.suit}</span>
      </div>
      
      {/* Point Value Indicator */}
      {!inTrick && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl-lg rounded-tr-xl">
          {getCardValue(card)}
        </div>
      )}
      
      {/* Special Card Indicator (Black 3) */}
      {card.isSpecial && (
        <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full border border-red-700 transform -translate-x-1 -translate-y-1">
          <div className="absolute inset-0 bg-red-400 rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* Playable indicator */}
      {canPlay && !disabled && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Card Back Component
// =========================================================================
const CardBack = ({ className = '' }) => (
  <div className={`
    relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 
    rounded-xl shadow-lg border-2 border-gray-800 w-20 h-28 ${className}
  `}>
    <div className="absolute inset-2 border border-blue-400 rounded-lg">
      <div className="absolute inset-2 border border-blue-300 rounded-md">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-blue-200 text-2xl font-bold">T</div>
        </div>
      </div>
    </div>
  </div>
);

// =========================================================================
// Dealer Selection Component
// =========================================================================
const DealerSelectionPanel = ({ gameState, socket, currentPlayer }) => {
  const [hasDrawn, setHasDrawn] = useState(false);
  
  const playerCount = gameState?.players?.length || 0;
  const playersWhoDrawn = gameState?.players?.filter(p => p.dealerCard)?.length || 0;
  const allPlayersDrawn = playersWhoDrawn >= playerCount;
  const canDraw = !hasDrawn && !currentPlayer?.dealerCard;

  const handleDrawCard = () => {
    if (socket && canDraw) {
      socket.emit('game-action', {
        action: 'drawDealerCard',
        data: {}
      });
      setHasDrawn(true);
    }
  };

  const handleConfirmDealer = () => {
    if (socket) {
      socket.emit('game-action', {
        action: 'confirmDealer',
        data: {}
      });
    }
  };

  if (gameState?.status !== 'dealerSelection') return null;

  const sortedPlayers = [...(gameState?.players || [])].sort((a, b) => {
    if (!a.dealerCard && !b.dealerCard) return 0;
    if (!a.dealerCard) return 1;
    if (!b.dealerCard) return -1;
    
    // Card ranking for dealer selection: A > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3
    const rankOrder = { 'A': 14, '10': 13, '9': 12, '8': 11, '7': 10, '6': 9, '5': 8, '4': 7, '3': 6 };
    return (rankOrder[b.dealerCard.rank] || 0) - (rankOrder[a.dealerCard.rank] || 0);
  });

  const topPlayer = sortedPlayers[0];

  return (
    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-purple-800 flex items-center justify-center space-x-2 mb-2">
          <span>🎯</span>
          <span>Dealer Selection</span>
        </h3>
        <p className="text-gray-700 text-sm">
          Each player draws one card. The player with the highest rank becomes the dealer.
        </p>
      </div>

      {/* Draw Card Section */}
      <div className="text-center mb-6">
        {canDraw ? (
          <button
            onClick={handleDrawCard}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            🎴 Draw Your Card
          </button>
        ) : currentPlayer?.dealerCard ? (
          <div className="bg-green-100 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium mb-2">You drew:</p>
            <div className="flex justify-center">
              <Card card={currentPlayer.dealerCard} disabled={true} inTrick={true} />
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 inline-block">
            <p className="text-gray-600">Waiting for your turn to draw...</p>
          </div>
        )}
      </div>

      {/* Players and Their Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {gameState?.players?.map((player, index) => (
          <div 
            key={player.id || index}
            className={`p-4 rounded-lg border-2 ${
              player.dealerCard ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{player.username}</span>
                {player.id === currentPlayer?.id && (
                  <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded-full">You</span>
                )}
              </div>
              <div className="text-right">
                {player.dealerCard ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-700">
                      {player.dealerCard.rank} of {player.dealerCard.suit}
                    </span>
                    <div className="w-8 h-12 bg-white border border-gray-300 rounded flex items-center justify-center text-xs">
                      {player.dealerCard.suit}
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Not drawn</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {allPlayersDrawn && (
        <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-center">
          <h4 className="font-bold text-yellow-800 mb-2">🏆 Dealer Selected!</h4>
          <p className="text-yellow-700 mb-4">
            <strong>{topPlayer?.username}</strong> drew the highest card ({topPlayer?.dealerCard?.rank} of {topPlayer?.dealerCard?.suit}) and becomes the dealer!
          </p>
          <button
            onClick={handleConfirmDealer}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            ✅ Confirm Dealer & Continue
          </button>
        </div>
      )}

      <div className="text-center text-sm text-gray-600 mt-4">
        Progress: {playersWhoDrawn}/{playerCount} players have drawn cards
      </div>
    </div>
  );
};

// =========================================================================
// Manual Dealing Component
// =========================================================================
const ManualDealingPanel = ({ gameState, socket, currentPlayer }) => {
  const [dealingPhase, setDealingPhase] = useState('not-started'); // 'not-started', 'phase1', 'phase2', 'completed'
  const [cardsDealt, setCardsDealt] = useState({ phase1: 0, phase2: 0 });
  
  const isDealer = currentPlayer?.isDealer;
  const playerCount = gameState?.players?.filter(p => !p.isEliminated)?.length || 0;
  const totalCardsPhase1 = playerCount * 3;
  const totalCardsPhase2 = playerCount * 2;

  const handleStartDealing = () => {
    if (socket) {
      socket.emit('game-action', {
        action: 'startDealing',
        data: {}
      });
      setDealingPhase('phase1');
    }
  };

  const handleQuickStart = () => {
    if (socket) {
      socket.emit('game-action', {
        action: 'quickStart',
        data: {}
      });
    }
  };

  const handleDealCard = (phase) => {
    if (socket) {
      socket.emit('game-action', {
        action: 'dealCard',
        data: { phase, isManual: true }
      });
    }
  };

  const handleFinishPhase = (phase) => {
    if (socket) {
      socket.emit('game-action', {
        action: 'finishDealingPhase',
        data: { phase }
      });
      if (phase === 1) {
        setDealingPhase('phase2');
      } else {
        setDealingPhase('completed');
      }
    }
  };

  if (!isDealer || gameState?.status === 'playing') return null;

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-amber-800 flex items-center space-x-2">
          <span>🃏</span>
          <span>Manual Dealing ({playerCount} players)</span>
        </h3>
        <div className="text-sm text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          You are the dealer
        </div>
      </div>

      {dealingPhase === 'not-started' && (
        <div className="text-center">
          <div className="mb-6">
            <p className="text-gray-700 mb-3">
              📋 <strong>Dealing Options:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1 text-left max-w-md mx-auto mb-6">
              <li>• <strong>Quick Start:</strong> Automatically deal all cards at once</li>
              <li>• <strong>Manual Dealing:</strong> Deal cards one by one following traditional rules</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleQuickStart}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              ⚡ Quick Start Game
            </button>
            <button
              onClick={handleStartDealing}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              🎴 Manual Dealing
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p><strong>Quick Start:</strong> Deals 5 cards to each player instantly</p>
            <p><strong>Manual:</strong> Phase 1 (3 cards each) → Phase 2 (2 cards each)</p>
          </div>
        </div>
      )}

      {dealingPhase === 'phase1' && (
        <div className="space-y-4">
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Phase 1: Deal 3 cards each</h4>
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                Progress: {cardsDealt.phase1}/{totalCardsPhase1} cards dealt
              </div>
              <div className="text-xs text-blue-600">
                Next: {gameState?.nextPlayerToDeal || 'Start from left of dealer'}
              </div>
            </div>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={() => handleDealCard(1)}
                disabled={cardsDealt.phase1 >= totalCardsPhase1}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🎴 Deal Next Card
              </button>
              {cardsDealt.phase1 >= totalCardsPhase1 && (
                <button
                  onClick={() => handleFinishPhase(1)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ✅ Finish Phase 1
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {dealingPhase === 'phase2' && (
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Phase 2: Deal 2 more cards each</h4>
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-700">
                Progress: {cardsDealt.phase2}/{totalCardsPhase2} cards dealt
              </div>
              <div className="text-xs text-green-600">
                Next: {gameState?.nextPlayerToDeal || 'Start from left of dealer'}
              </div>
            </div>
            <div className="mt-3 flex space-x-3">
              <button
                onClick={() => handleDealCard(2)}
                disabled={cardsDealt.phase2 >= totalCardsPhase2}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🎴 Deal Next Card
              </button>
              {cardsDealt.phase2 >= totalCardsPhase2 && (
                <button
                  onClick={() => handleFinishPhase(2)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  🎮 Start Playing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {dealingPhase === 'completed' && (
        <div className="text-center">
          <div className="text-green-600 text-lg font-semibold mb-2">
            ✅ Dealing Complete!
          </div>
          <p className="text-gray-600">All players have received their 5 cards. Game is starting...</p>
        </div>
      )}

      {/* Visual indicator of dealing order */}
      {(dealingPhase === 'phase1' || dealingPhase === 'phase2') && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">Dealing Order:</h5>
          <div className="flex flex-wrap gap-2">
            {gameState?.players
              ?.filter(p => !p.isEliminated)
              ?.map((player, index) => (
                <div 
                  key={player.id || index}
                  className={`px-3 py-1 rounded-full text-xs ${
                    player.isNext ? 'bg-yellow-200 text-yellow-800 font-semibold' :
                    player.username === currentPlayer?.username ? 'bg-purple-200 text-purple-800' :
                    'bg-gray-200 text-gray-700'
                  }`}
                >
                  {player.username} {player.isDealer ? '(Dealer)' : ''}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Current Trick Display
// =========================================================================
const TrickDisplay = ({ currentTrick, callingSuit, players }) => {
  if (!currentTrick || currentTrick.length === 0) {
    return (
      <div className="bg-green-100/50 rounded-xl p-6 border-2 border-green-200 text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Trick</h3>
        <div className="text-gray-500">No cards played yet</div>
        {callingSuit && (
          <div className="mt-2 text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full inline-block">
            Must follow: {callingSuit}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-green-100/50 rounded-xl p-6 border-2 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Current Trick</h3>
        {callingSuit && (
          <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
            Calling Suit: {callingSuit}
          </div>
        )}
      </div>
      
      <div className="flex justify-center items-center space-x-4">
        {currentTrick.map((play, index) => (
          <div key={index} className="text-center">
            <Card card={play.card} disabled={true} inTrick={true} />
            <div className="mt-2 text-sm font-medium text-gray-700">
              {play.player.username}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        Cards played: {currentTrick.length} / {players?.filter(p => !p.isEliminated).length || 0}
      </div>
    </div>
  );
};

// =========================================================================
// Player Display Component
// =========================================================================
const PlayerDisplay = ({ player, isCurrentPlayer, isYou, position = 'bottom' }) => {
  const getPlayerTypeIcon = (username) => {
    const aiPlayer = Object.values(AI_PLAYERS).find(ai => ai.name === username);
    return aiPlayer ? aiPlayer.avatar : '👤';
  };

  const getPlayerLevel = (username) => {
    const aiPlayer = Object.values(AI_PLAYERS).find(ai => ai.name === username);
    return aiPlayer ? ` (${aiPlayer.level})` : '';
  };

  return (
    <div className={`
      relative p-4 rounded-xl border-3 transition-all duration-500 backdrop-blur-sm
      ${isCurrentPlayer ? 
        'border-yellow-400 bg-yellow-100/80 shadow-lg shadow-yellow-300/50 animate-pulse' : 
        'border-gray-300 bg-white/80'
      }
      ${isYou ? 'ring-3 ring-blue-400 ring-opacity-70' : ''}
      ${player.isEliminated ? 'opacity-50 bg-red-100 border-red-300' : ''}
    `}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <span className="text-3xl">{getPlayerTypeIcon(player.username)}</span>
          {isCurrentPlayer && !player.isEliminated && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          )}
          {player.isEliminated && (
            <div className="absolute -top-1 -right-1 text-red-500 text-xl">❌</div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="font-bold text-gray-800">
              {player.username}{getPlayerLevel(player.username)}
            </span>
            {isYou && <span className="text-blue-600 font-medium text-sm bg-blue-100 px-2 py-1 rounded-full">You</span>}
            {player.isDealer && <span className="text-purple-600 font-medium text-sm bg-purple-100 px-2 py-1 rounded-full">🃏 Dealer</span>}
            {player.isEliminated && <span className="text-red-600 font-medium text-sm bg-red-100 px-2 py-1 rounded-full">Eliminated</span>}
          </div>
          
          <div className="flex space-x-4 mt-1">
            <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              Cards: {player.cards?.length || 0}
            </div>
            <div className={`text-sm px-2 py-1 rounded ${
              player.points >= 10 ? 'text-red-700 bg-red-100' : 
              player.points >= 6 ? 'text-orange-700 bg-orange-100' : 
              'text-gray-600 bg-gray-100'
            }`}>
              Points: {player.points || 0}/12
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// AI Management Panel
// =========================================================================
const AIManagementPanel = ({ gameState, socket }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAIAction = (action, aiKey) => {
    if (socket) {
      socket.emit('manage-ai', { action, aiKey });
    }
  };

  const getAvailableAI = () => {
    const existingAI = gameState.players
      .filter(p => p.isAI)
      .map(p => p.username);
    
    return Object.entries(AI_PLAYERS).filter(([key, ai]) => 
      !existingAI.includes(ai.name)
    );
  };

  const getExistingAI = () => {
    return gameState.players
      .filter(p => p.isAI)
      .map(p => ({
        key: Object.keys(AI_PLAYERS).find(k => AI_PLAYERS[k].name === p.username),
        player: p
      }))
      .filter(item => item.key);
  };

  if (gameState.status === 'playing' || gameState.status === 'dealing' || gameState.status === 'dealerSelection') return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
      >
        <span>🤖</span>
        <span>Manage AI Players</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white rounded-lg shadow-xl border-2 border-purple-200 p-4 z-50 min-w-80">
          <h3 className="font-bold text-gray-800 mb-3">AI Players Management</h3>
          
          {/* Available AI to Add */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Add AI Players:</h4>
            {getAvailableAI().length > 0 ? (
              <div className="space-y-2">
                {getAvailableAI().map(([key, ai]) => (
                  <button
                    key={key}
                    onClick={() => handleAIAction('add', key)}
                    className="w-full flex items-center justify-between p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                    disabled={gameState.players.length >= 4}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-xl">{ai.avatar}</span>
                      <span className="font-medium">{ai.name}</span>
                      <span className="text-gray-500 text-sm">({ai.level})</span>
                    </span>
                    <span className="text-green-600 font-bold">+ Add</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {gameState.players.length >= 4 ? 'Room is full' : 'All AI players are already in the game'}
              </p>
            )}
          </div>
          
          {/* Existing AI to Remove */}
          {getExistingAI().length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Remove AI Players:</h4>
              <div className="space-y-2">
                {getExistingAI().map(({ key, player }) => (
                  <button
                    key={key}
                    onClick={() => handleAIAction('remove', key)}
                    className="w-full flex items-center justify-between p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-xl">{AI_PLAYERS[key]?.avatar}</span>
                      <span className="font-medium">{player.username}</span>
                      <span className="text-gray-500 text-sm">({AI_PLAYERS[key]?.level})</span>
                    </span>
                    <span className="text-red-600 font-bold">✕ Remove</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Game Rules Display
// =========================================================================
const GameRulesDisplay = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
      >
        <span>📋</span>
        <span>Game Rules</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl border-2 border-blue-200 p-6 z-50 max-w-md">
          <h3 className="font-bold text-gray-800 mb-4">🎯 Trick-Taking Game Rules</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">📜 Objective:</h4>
              <p className="text-gray-700">Be the last player standing! Get eliminated if you reach 12+ points.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">🃏 Dealing:</h4>
              <p className="text-gray-700">Each player gets 5 cards (3 first, then 2 more). Player left of dealer starts.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">🎮 Playing:</h4>
              <ul className="text-gray-700 ml-4 list-disc space-y-1">
                <li>First player plays any card (calling suit)</li>
                <li>Others must follow suit if possible</li>
                <li>Highest card of calling suit wins trick</li>
                <li>Trick winner leads next trick</li>
                <li>Complete 5 tricks per round</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-1">📊 Scoring:</h4>
              <ul className="text-gray-700 ml-4 list-disc space-y-1">
                <li>Player next to final trick winner takes points</li>
                <li>Points = value of winning card</li>
                <li>Black 3♠ = 12pts, Other 3s = 6pts</li>
                <li>4s = 4pts, Aces = 2pts, Others = 1pt</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-700 mb-1">⚠️ Fouls (2 points):</h4>
              <ul className="text-gray-700 ml-4 list-disc">
                <li>Fail to follow suit when you can</li>
                <li>Play out of turn</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
          >
            Got it!
          </button>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// Lobby Component
// =========================================================================
const Lobby = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = () => {
    if (playerName.trim()) {
      onJoin(playerName, roomCode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 opacity-10 transform -rotate-12">
          <CardBack className="w-16 h-24" />
        </div>
        <div className="absolute top-20 right-20 opacity-15 transform rotate-12">
          <CardBack className="w-16 h-24" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-10 transform rotate-45">
          <CardBack className="w-16 h-24" />
        </div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/95 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-green-800 mb-2">🃏 Trick Master</h1>
            <p className="text-gray-600">The Ultimate Trick-Taking Card Game</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your name"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">Room Code (optional)</label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter code to join existing room"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!playerName.trim()}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg"
            >
              {roomCode ? '🚪 Join Room' : '🎮 Create Room'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// Game Room Component
// =========================================================================
const GameRoom = ({ room, player, roomCode, socket }) => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on('game-message', (data) => {
        setMessages(prev => [...prev.slice(-4), { ...data, id: Date.now() }]);
        setTimeout(() => {
          setMessages(prev => prev.slice(1));
        }, 5000);
      });

      return () => {
        socket.off('game-message');
      };
    }
  }, [socket]);

  if (!room || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-gray-800">Loading game room...</div>
          </div>
        </div>
      </div>
    );
  }

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { playerId: player._id, roomCode });
      window.location.reload();
    }
  };

  const handlePlayCard = () => {
    if (socket && selectedCard) {
      socket.emit('game-action', {
        action: 'playCard',
        data: { cardId: selectedCard.id }
      });
      setSelectedCard(null);
    }
  };

  const currentPlayer = room.players?.find(p => p.id === player._id || p._id === player._id);
  const isDealer = currentPlayer?.isDealer || false;
  const canStartDealing = room.status === 'waiting' && room.players?.length >= 2 && isDealer;
  const isMyTurn = currentPlayer?.isCurrent && room.status === 'playing' && !currentPlayer?.isEliminated;

  const getPlayableCards = () => {
    if (!currentPlayer || !isMyTurn) return [];
    
    const callingSuit = room.callingSuit;
    if (!callingSuit) return currentPlayer.cards; // First player can play any card
    
    const suitCards = currentPlayer.cards.filter(card => card.suit === callingSuit);
    return suitCards.length > 0 ? suitCards : currentPlayer.cards; // Must follow suit if possible
  };

  const playableCards = getPlayableCards();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative">
      {/* Game Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in"
          >
            {msg.message}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-green-800 flex items-center space-x-2">
                <span>🃏</span>
                <span>Room: {roomCode}</span>
              </h1>
              <p className="text-gray-600 mt-1">Playing as: <span className="font-semibold">{player.name || currentPlayer?.username}</span></p>
            </div>
            <div className="flex space-x-3">
              <GameRulesDisplay />
              {(room.status === 'waiting' || room.status === 'dealing' || room.status === 'dealerSelection') && (
                <AIManagementPanel gameState={room} socket={socket} />
              )}
              <button
                onClick={handleLeaveRoom}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
              >
                🚪 Leave Room
              </button>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              room.status === 'waiting' ? 'bg-yellow-200 text-yellow-800' :
              room.status === 'dealerSelection' ? 'bg-purple-200 text-purple-800' :
              room.status === 'dealing' ? 'bg-blue-200 text-blue-800' :
              room.status === 'playing' ? 'bg-green-200 text-green-800' :
              'bg-gray-200 text-gray-800'
            }`}>
              Status: {
                room.status === 'dealerSelection' ? 'Selecting Dealer' :
                room.status === 'dealing' ? 'Dealing Cards' : 
                room.status
              }
            </span>
            <span className="px-4 py-2 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
              Phase: {room.gamePhase}
            </span>
            {room.round && (
              <span className="px-4 py-2 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                Round: {room.round}
              </span>
            )}
          </div>
        </div>

        {/* Dealer Selection Panel */}
        {room?.status === 'dealerSelection' && (
          <DealerSelectionPanel 
            gameState={room} 
            socket={socket} 
            currentPlayer={currentPlayer}
          />
        )}

        {/* Manual Dealing Panel */}
        {(room.status === 'waiting' || room.status === 'dealing') && (
          <ManualDealingPanel 
            gameState={room} 
            socket={socket} 
            currentPlayer={currentPlayer}
          />
        )}

        {/* Players Grid */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span>👥</span>
            <span>Players ({room.players?.filter(p => !p.isEliminated).length || 0}/{room.players?.length || 0})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.players && room.players.length > 0 ? (
              room.players.map((p, index) => (
                <PlayerDisplay
                  key={p.id || p._id || index}
                  player={p}
                  isCurrentPlayer={p.isCurrent}
                  isYou={p.id === player._id || p._id === player._id}
                />
              ))
            ) : (
              <div className="col-span-2 text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">🤷‍♂️</div>
                <p>No players found</p>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        {room.status === 'playing' && (
          <div className="space-y-6">
            {/* Current Trick Display */}
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <TrickDisplay 
                currentTrick={room.currentTrick} 
                callingSuit={room.callingSuit}
                players={room.players}
              />
            </div>

            {/* Player's Hand */}
            {currentPlayer && currentPlayer.cards && currentPlayer.cards.length > 0 && !currentPlayer.isEliminated && (
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Your Hand</h3>
                  <div className="flex items-center space-x-4">
                    {isMyTurn && (
                      <div className="flex items-center space-x-2 bg-yellow-200 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full animate-ping"></div>
                        <span className="text-sm font-medium text-yellow-800">Your Turn</span>
                      </div>
                    )}
                    <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                      {currentPlayer.cards.length} card{currentPlayer.cards.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {currentPlayer.cards.map((card, index) => (
                    <Card
                      key={card.id || index}
                      card={card}
                      onClick={isMyTurn ? setSelectedCard : null}
                      disabled={!isMyTurn}
                      selected={selectedCard?.id === card.id}
                      canPlay={playableCards.some(pc => pc.id === card.id)}
                    />
                  ))}
                </div>
                
                {selectedCard && isMyTurn && (
                  <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-800 mb-1">
                          Selected: {selectedCard.rank} of {selectedCard.suit}
                        </p>
                        {selectedCard.isSpecial && (
                          <p className="text-sm text-red-600">⭐ High Value Card!</p>
                        )}
                        {room.callingSuit && selectedCard.suit !== room.callingSuit && 
                         playableCards.some(pc => pc.suit === room.callingSuit) && (
                          <p className="text-sm text-red-600">⚠️ This will not follow suit!</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handlePlayCard}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg"
                          disabled={room.callingSuit && selectedCard.suit !== room.callingSuit && 
                                   playableCards.some(pc => pc.suit === room.callingSuit)}
                        >
                          🎯 Play Card
                        </button>
                        <button
                          onClick={() => setSelectedCard(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suit following hint */}
                {isMyTurn && room.callingSuit && (
                  <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <p className="text-blue-800 text-sm">
                      💡 Must follow suit: {room.callingSuit} 
                      {!playableCards.some(pc => pc.suit === room.callingSuit) && (
                        <span className="text-green-600"> (You have no {room.callingSuit} cards, so you can play any card)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Eliminated message */}
            {currentPlayer?.isEliminated && (
              <div className="bg-red-100 border-2 border-red-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">❌</div>
                <h3 className="text-xl font-bold text-red-800 mb-2">You've been eliminated!</h3>
                <p className="text-red-600">You reached 12+ points. Watch the remaining players compete!</p>
              </div>
            )}
          </div>
        )}

        {/* Game Over Screen */}
        {room.status === 'gameOver' && (
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h2>
            <p className="text-lg text-gray-600 mb-6">
              The last player standing wins!
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              🎮 Play Again
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// =========================================================================
// Main App Component
// =========================================================================
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

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setError(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to game server. Please try again.');
      setLoading(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
      setLoading(false);
    });

    newSocket.on('game-state', (gameState) => {
      console.log('Received game state:', gameState);
      setRoom(gameState);
      setLoading(false);
    });

    newSocket.on('player-joined', (data) => {
      console.log('Player joined:', data);
    });

    newSocket.on('game-over', (data) => {
      console.log('Game over:', data);
      alert(`Game Over! ${data.message}`);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const createRoom = async (playerName) => {
    setLoading(true);
    setError(null);
    
    try {
      const serverUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mgt-toozabackend.onrender.com'
        : 'http://localhost:3001';

      const res = await fetch(`${serverUrl}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        
        if (socket?.connected) {
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
      console.error('Error creating room:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const joinRoom = async (playerName, roomCode) => {
    setLoading(true);
    setError(null);
    
    try {
      const serverUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mgt-toozabackend.onrender.com'
        : 'http://localhost:3001';

      const res = await fetch(`${serverUrl}/api/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, roomCode }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success) {
        setPlayer({ _id: data.playerId, name: playerName });
        setRoomCode(data.roomCode);
        
        if (socket?.connected) {
          socket.emit('join-game', { 
            playerId: data.playerId, 
            roomCode: data.roomCode 
          });
        } else {
          throw new Error('Socket not connected');
        }
      } else {
        throw new Error(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleJoin = (playerName, roomCode) => {
    if (roomCode && roomCode.trim()) {
      joinRoom(playerName, roomCode.trim().toUpperCase());
    } else {
      createRoom(playerName);
    }
  };

  if (!room) {
    return (
      <>
        <Lobby onJoin={handleJoin} />
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-700">Connecting to game...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}
      </>
    );
  }

  return <GameRoom room={room} player={player} roomCode={roomCode} socket={socket} />;
}
