// =========================================================================
// Main App Component
// =========================================================================
const App = () => {
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [player, setPlayer] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRoomCreator, setIsRoomCreator] = useState(false);
  const [aiPlayers, setAiPlayers] = useState([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameWinner, setGameWinner] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://mgt-toozabackend.onrender.com';

  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message);
    });

    newSocket.on('game-state', (newGameState) => {
      console.log('Received new game state:', newGameState);
      setGameState(newGameState);

      const currentPlayerInfo = newGameState.players.find(p => p.username === playerName);
      if (currentPlayerInfo) {
        setPlayer(currentPlayerInfo);
      }
      
      if (newGameState.status === 'gameOver') {
          setGameEnded(true);
          setGameWinner(newGameState.players[0] || null);
      } else {
          setGameEnded(false);
          setGameWinner(null);
      }
      setLoading(false);
    });

    newSocket.on('player-joined', (data) => {
      console.log(`${data.username} has joined the room.`);
      // No need to set player here, game-state will be updated shortly
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [API_URL, playerName]);

  // Handle playing a card
  const handlePlayCard = (cardId) => {
    if (!socket || !player || !gameState || !player.isCurrent) {
      setError('It is not your turn or you are not in a game.');
      return;
    }
    const card = player.cards.find(c => c.id === cardId);
    if (!card) {
      setError('Card not found in your hand.');
      return;
    }

    // Client-side validation
    const lastCard = gameState.lastPlayedCard;
    const hasSameSuit = player.cards.some(c => c.suit === lastCard?.suit);

    if (lastCard && hasSameSuit && card.suit !== lastCard.suit) {
      setError('You must follow suit if you have a card of that suit.');
      return;
    }

    socket.emit('game-action', { action: 'playCard', data: { cardId } });
    setError(null);
  };

  // Handle a manual deal
  const handleDealCards = () => {
      if (!socket || !isRoomCreator) {
          setError('Only the dealer (room creator) can deal the cards.');
          return;
      }
      setLoading(true);
      socket.emit('game-action', { action: 'startGame' });
      setError(null);
  };

  const handleLeaveRoom = () => {
    if (socket && player && roomCode) {
      socket.emit('leave-room', { playerId: player._id, roomCode });
      setPlayer(null);
      setRoomCode('');
      setGameState(null);
      setLoading(false);
      setIsRoomCreator(false);
      setGameEnded(false);
      setGameWinner(null);
    }
  };

  const createRoom = async (pName, selectedAis) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pName, aiPlayers: selectedAis })
      });
      const data = await response.json();
      if (data.success) {
        setRoomCode(data.roomCode);
        setPlayerName(pName);
        setIsRoomCreator(true);
        socket.emit('join-game', { playerId: data.playerId, roomCode: data.roomCode });
      } else {
        setError(data.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to create room. Server is unavailable.');
      setLoading(false);
    }
  };

  const joinRoom = async (pName, rCode) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pName, roomCode: rCode })
      });
      const data = await response.json();
      if (data.success) {
        setRoomCode(rCode);
        setPlayerName(pName);
        socket.emit('join-game', { playerId: data.playerId, roomCode: rCode });
      } else {
        setError(data.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to join room. Server is unavailable.');
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (e.target.id === 'join-form') {
      const roomCode = e.target.roomCode.value;
      joinRoom(playerName, roomCode.toUpperCase());
    } else {
      createRoom(playerName, aiPlayers);
    }
  };

  const isDealer = player?.isDealer;

  const getPlayerPosition = (p) => {
    if (!player || !gameState) return 'side';
    
    const allPlayers = gameState.players;
    const yourIndex = allPlayers.findIndex(p => p.username === player.username);
    const otherPlayerIndex = allPlayers.findIndex(otherP => otherP.username === p.username);
    
    if (otherPlayerIndex === yourIndex) return 'bottom';
    
    const numPlayers = allPlayers.length;
    const diff = (otherPlayerIndex - yourIndex + numPlayers) % numPlayers;
    
    if (numPlayers === 2) {
      return diff === 1 ? 'top' : 'bottom';
    }
    if (numPlayers === 3) {
      if (diff === 1) return 'right';
      if (diff === 2) return 'left';
    }
    if (numPlayers === 4) {
      if (diff === 1) return 'right';
      if (diff === 2) return 'top';
      if (diff === 3) return 'left';
    }
    return 'side';
  };

  const getPlayersByPosition = () => {
    const positions = {
      bottom: null,
      top: null,
      left: null,
      right: null,
      others: []
    };
    
    if (gameState?.players && player) {
      gameState.players.forEach(p => {
        const pos = getPlayerPosition(p);
        if (pos === 'bottom') positions.bottom = p;
        else if (pos === 'top') positions.top = p;
        else if (pos === 'left') positions.left = p;
        else if (pos === 'right') positions.right = p;
        else positions.others.push(p);
      });
    }
    return positions;
  };

  const positions = getPlayersByPosition();

  // Sort other players for consistent display
  const otherPlayers = gameState?.players.filter(p => p.username !== playerName) || [];
  otherPlayers.sort((a, b) => {
    const aPos = getPlayerPosition(a);
    const bPos = getPlayerPosition(b);
    if (aPos === bPos) return 0;
    if (aPos === 'right') return -1;
    if (bPos === 'right') return 1;
    if (aPos === 'top') return -1;
    if (bPos === 'top') return 1;
    return -1;
  });

  return (
    <div className="app">
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center">
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-2xl text-center">
            <div className="text-2xl text-green-800 mb-4">🎴 Loading...</div>
            <div className="text-gray-600">
              {player ? `Joining room as ${player.username}...` : 'Setting up connection...'}
            </div>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : !gameState ? (
        <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-2xl">
            <h1 className="text-4xl font-bold text-center text-green-800 mb-6">Play Whot!</h1>
            <div className="mb-4">
              <label htmlFor="playerName" className="block text-gray-700 font-semibold mb-2">Your Name</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <h2 className="text-2xl font-bold text-green-700 mb-4">Create Room</h2>
                <div className="mb-4">
                  <span className="block text-gray-700 font-semibold mb-2">Add AI Players:</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(AI_PLAYERS).map(aiKey => (
                      <button
                        key={aiKey}
                        type="button"
                        onClick={() => setAiPlayers(prev => 
                          prev.includes(aiKey) ? prev.filter(a => a !== aiKey) : [...prev, aiKey]
                        )}
                        className={`px-4 py-2 rounded-full font-semibold transition-colors duration-200
                          ${aiPlayers.includes(aiKey) 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                      >
                        {AI_PLAYERS[aiKey].name}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => createRoom(playerName, aiPlayers)}
                  disabled={!playerName}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Create Game
                </button>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
                <h2 className="text-2xl font-bold text-green-700 mb-4">Join Room</h2>
                <form id="join-form" onSubmit={handleFormSubmit}>
                  <div className="mb-4">
                    <label htmlFor="roomCode" className="block text-gray-700 font-semibold mb-2">Room Code</label>
                    <input
                      type="text"
                      id="roomCode"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., ABCD"
                      maxLength="4"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!playerName}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Join Game
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : gameEnded ? (
        <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-2xl text-center">
            <h2 className="text-4xl font-bold text-green-700 mb-4">Game Over!</h2>
            {gameWinner ? (
              <p className="text-2xl font-semibold text-gray-800 mb-4">
                The winner is <span className="text-green-600">{gameWinner.username}</span>!
              </p>
            ) : (
              <p className="text-2xl font-semibold text-gray-800 mb-4">No winner could be determined.</p>
            )}
            <button
              onClick={handleLeaveRoom}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              Back to Main Menu
            </button>
          </div>
        </div>
      ) : (
        <div className="game-container relative min-h-screen bg-gradient-to-br from-green-800 via-green-600 to-green-400 text-white p-4">
          <div className="room-info absolute top-4 left-4 right-4 text-center">
            <h2 className="text-xl font-bold text-white bg-black/30 p-2 rounded-lg inline-block">
              Room: {roomCode}
            </h2>
          </div>

          <div className="flex justify-between items-center w-full max-w-2xl mx-auto mb-4">
            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 text-white py-2 px-4 rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
            >
              Leave Room
            </button>

            {/* DEAL CARDS BUTTON */}
            {isDealer && gameState.gamePhase === 'dealerSelection' && (
              <button
                onClick={handleDealCards}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
              >
                Deal Cards
              </button>
            )}
          </div>
          
          <div className="game-area flex-1 flex flex-col justify-between items-center h-[calc(100vh-100px)]">
            {/* Top player */}
            {positions.top && (
              <div className="player-top">
                <PlayerDisplay player={positions.top} isCurrentPlayer={positions.top.isCurrent} />
              </div>
            )}

            <div className="flex justify-between w-full h-1/2">
              {/* Left player */}
              {positions.left && (
                <div className="player-left flex items-center justify-center -translate-x-1/2 rotate-90 origin-center">
                  <PlayerDisplay player={positions.left} isCurrentPlayer={positions.left.isCurrent} />
                </div>
              )}
              
              <div className="game-center flex-1 flex flex-col items-center justify-center">
                {/* Trick cards */}
                <div className="trick-area flex justify-center items-center h-28 mb-4">
                  {gameState.currentTrick.map((play, index) => (
                    <div 
                      key={index}
                      className="relative m-1 transform scale-75 md:scale-100"
                    >
                      <Card card={play.card} inTrick={true} />
                      <div className="absolute -bottom-6 text-sm text-center w-full font-semibold">
                        {play.playerName}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Deck */}
                <div className="deck-area flex items-center justify-center mt-4">
                  <div className="deck bg-gray-700 border-2 border-gray-500 rounded-lg w-16 h-20 flex items-center justify-center text-4xl font-bold text-gray-400">
                    {gameState.deck.length}
                  </div>
                </div>
              </div>

              {/* Right player */}
              {positions.right && (
                <div className="player-right flex items-center justify-center translate-x-1/2 -rotate-90 origin-center">
                  <PlayerDisplay player={positions.right} isCurrentPlayer={positions.right.isCurrent} />
                </div>
              )}
            </div>

            {/* You/Bottom player */}
            {player && (
              <div className="player-bottom flex flex-col items-center w-full">
                <div className="mb-2">
                  <PlayerDisplay 
                    player={player} 
                    isCurrentPlayer={player.isCurrent} 
                    isYou={true} 
                    position="bottom" 
                  />
                </div>
                <div className="flex justify-center flex-wrap">
                  {player.cards?.length > 0 ? (
                    player.cards.map((card) => (
                      <Card 
                        key={card.id}
                        card={card} 
                        onClick={() => handlePlayCard(card.id)}
                        disabled={!player.isCurrent}
                        canPlay={!gameState.lastPlayedCard || card.suit === gameState.lastPlayedCard.suit || !player.cards.some(c => c.suit === gameState.lastPlayedCard.suit)}
                      />
                    ))
                  ) : (
                    <div className="text-center mt-4 text-white/70">You have no cards.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
