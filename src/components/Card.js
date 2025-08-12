import React from 'react';
import './Card.css';

const Card = ({ card, isFaceDown, onClick, disabled }) => {
  if (isFaceDown) {
    return (
      <div className="card face-down" onClick={!disabled ? onClick : undefined}>
        <div className="card-back"></div>
      </div>
    );
  }

  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div 
      className={`card ${isRed ? 'red' : 'black'}`} 
      onClick={!disabled ? onClick : undefined}
    >
      <div className="card-corner top-left">
        <span className="rank">{card.rank}</span>
        <span className="suit">{card.suit}</span>
      </div>
      <div className="card-center">
        <span className="suit-large">{card.suit}</span>
      </div>
      <div className="card-corner bottom-right">
        <span className="rank">{card.rank}</span>
        <span className="suit">{card.suit}</span>
      </div>
    </div>
  );
};

export default Card;
