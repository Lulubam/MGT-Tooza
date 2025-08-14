export default function Lobby({ onJoin }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  return (
    <div className="lobby">
      <input 
        placeholder="Your Name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      
      <button onClick={() => onJoin(name, '', true)}>
        Create Room
      </button>

      <div className="join-section">
        <input
          placeholder="Room Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button onClick={() => onJoin(name, code, false)}>
          Join Room
        </button>
      </div>
    </div>
  );
}
