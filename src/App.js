// App.js - Fixed Frontend for Trick-Taking Card Game
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
            <span className="font-bold text-gray-
