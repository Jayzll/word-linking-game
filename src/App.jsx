// App.jsx
import React, { useState } from 'react';
import GameLobby from './GameLobby';
import GameLoop from './GameLoop';
import './App.css';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleExitGame = () => {
    setGameStarted(false);
  };

  return gameStarted ? (
    <GameLoop onExit={handleExitGame} />
  ) : (
    <GameLobby onStartGame={handleStartGame} />
  );
}
