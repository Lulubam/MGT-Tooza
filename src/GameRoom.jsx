export default function GameRoom({ socket, room, player }) {
  const playCard = (cardIndex) => {
    socket.emit('game-action', {
      action: 'playCard',
      data: { cardIndex }
    });
  };

  return (
    <div className="game-room">
      <div className="table">
        <h2>Room: {room.code}</h2>
        <div className="players">
          {room.players.map(p => (
            <div key={p.id} className={`player ${p.id === player.id ? 'you' : ''}`}>
              {p.name} 
              {p.id !== player.id && <span> ({p.cards?.length || 0} cards)</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="your-hand">
        <h3>Your Cards</h3>
        <div className="cards">
          {room.players.find(p => p.id === player.id)?.cards?.map((card, index) => (
            <div 
              key={index} 
              className="card"
              onClick={() => playCard(index)}
            >
              {card.rank} {card.suit}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
