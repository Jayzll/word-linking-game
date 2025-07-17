import React, { useState } from 'react';
import './App.css';

export default function GameLobby() {
const [currentView, setCurrentView] = useState('home'); // 'home', 'create', 'join', 'waiting'
const [gameData, setGameData] = useState(null);
const [formData, setFormData] = useState({
    name: '',
    rounds: 5,
    code: ''
});
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);

// Generate a random game code
const generateGameCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const validateForm = (view) => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
    newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
    newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 20) {
    newErrors.name = 'Name must be less than 20 characters';
    }

    if (view === 'create') {
    if (!formData.rounds || formData.rounds < 1) {
        newErrors.rounds = 'Rounds must be at least 1';
    } else if (formData.rounds > 20) {
        newErrors.rounds = 'Rounds must be 20 or less';
    }
    }

    if (view === 'join') {
    if (!formData.code.trim()) {
        newErrors.code = 'Game code is required';
    } else if (formData.code.trim().length !== 6) {
        newErrors.code = 'Game code must be 6 characters';
    }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

const handleCreateGame = () => {
    if (!validateForm('create')) return;

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
    const gameCode = generateGameCode();
    const newGameData = {
        type: 'create',
        gameCode: gameCode,
        hostName: formData.name.trim(),
        rounds: parseInt(formData.rounds),
        players: [formData.name.trim()],
        createdAt: new Date().toISOString()
    };
    
    setGameData(newGameData);
    setCurrentView('waiting');
    setIsLoading(false);
    
    // This is where you would send data to backend
    console.log('Create Game Data:', newGameData);
    }, 1000);
};

const handleJoinGame = () => {
    if (!validateForm('join')) return;

    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
    const joinGameData = {
        type: 'join',
        gameCode: formData.code.trim().toUpperCase(),
        playerName: formData.name.trim(),
        joinedAt: new Date().toISOString()
    };
    
    setGameData(joinGameData);
    setCurrentView('waiting');
    setIsLoading(false);
    
    // This is where you would send data to backend
    console.log('Join Game Data:', joinGameData);
    }, 1000);
};

const handleInputChange = (field, value) => {
    setFormData(prev => ({
    ...prev,
    [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
    setErrors(prev => ({
        ...prev,
        [field]: ''
    }));
    }
};

const resetForm = () => {
    setFormData({
    name: '',
    rounds: 5,
    code: ''
    });
    setErrors({});
    setGameData(null);
};

const goHome = () => {
    setCurrentView('home');
    resetForm();
};

const goBack = () => {
    setCurrentView('home');
    setErrors({});
};

// Home View
if (currentView === 'home') {
    return (
    <div className="app">
        <div className="header">
        <h1>Word Linking Game</h1>
        <p>Create a game or join an existing one!</p>
        </div>

        <div className="game-area">
        <div className="lobby-home">
            <div className="lobby-options">
            <button 
                className="lobby-button create-button"
                onClick={() => setCurrentView('create')}
            >
                {/* <div className="button-icon">🎮</div> */}
                <h3>Create Game</h3>
                <p>Start a new game and invite friends</p>
            </button>

            <button 
                className="lobby-button join-button"
                onClick={() => setCurrentView('join')}
            >
                {/* <div className="button-icon">🔗</div> */}
                <h3>Join Game</h3>
                <p>Join an existing game with a code</p>
            </button>
            </div>
        </div>
        </div>
    </div>
    );
}

// Create Game View
if (currentView === 'create') {
    return (
    <div className="app">
        <div className="header">
        <h1>Create Game</h1>
        <p>Set up your game and invite friends!</p>
        </div>

        <div className="game-area">
        <div className="lobby-form">
            <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter your name"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGame()}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
            <label htmlFor="rounds">Number of Rounds</label>
            <input
                id="rounds"
                type="number"
                value={formData.rounds}
                onChange={(e) => handleInputChange('rounds', e.target.value)}
                className={`form-input ${errors.rounds ? 'error' : ''}`}
                min="1"
                max="20"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGame()}
            />
            {errors.rounds && <span className="error-message">{errors.rounds}</span>}
            </div>

            <div className="form-actions">
            <button type="button" className="secondary-button" onClick={goBack}>
                Back
            </button>
            <button type="button" className="primary-button" onClick={handleCreateGame} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Game'}
            </button>
            </div>
        </div>
        </div>
    </div>
    );
}

// Join Game View
if (currentView === 'join') {
    return (
    <div className="app">
        <div className="header">
        <h1>Join Game</h1>
        <p>Enter the game code to join!</p>
        </div>

        <div className="game-area">
        <div className="lobby-form">
            <div className="form-group">
            <label htmlFor="code">Game Code</label>
            <input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                className={`form-input code-input ${errors.code ? 'error' : ''}`}
                placeholder="Enter 6-character code"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
            />
            {errors.code && <span className="error-message">{errors.code}</span>}
            </div>

            <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter your name"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-actions">
            <button type="button" className="secondary-button" onClick={goBack}>
                Back
            </button>
            <button type="button" className="primary-button" onClick={handleJoinGame} disabled={isLoading}>
                {isLoading ? 'Joining...' : 'Join Game'}
            </button>
            </div>
        </div>
        </div>
    </div>
    );
}

// Waiting Room View
if (currentView === 'waiting') {
    return (
    <div className="app">
        <div className="header">
        <h1>Game Lobby</h1>
        <p>{gameData.type === 'create' ? 'Share this code with friends!' : 'Waiting for game to start...'}</p>
        </div>

        <div className="game-area">
        <div className="waiting-room">
            {gameData.type === 'create' ? (
            <>
                <div className="game-code-display">
                <h2>Game Code</h2>
                <div className="game-code">{gameData.gameCode}</div>
                <p>Share this code with your friends to join the game</p>
                </div>
                
                <div className="game-settings">
                <h3>Game Settings</h3>
                <div className="setting-item">
                    <span>Host:</span>
                    <span>{gameData.hostName}</span>
                </div>
                <div className="setting-item">
                    <span>Rounds:</span>
                    <span>{gameData.rounds}</span>
                </div>
                </div>
            </>
            ) : (
            <>
                <div className="joined-game">
                <h2>Joined Game</h2>
                <div className="game-code">{gameData.gameCode}</div>
                <p>Welcome, {gameData.playerName}!</p>
                </div>
            </>
            )}

            <div className="players-list">
            <h3>Players ({gameData.type === 'create' ? gameData.players.length : 1})</h3>
            <div className="players">
                {gameData.type === 'create' ? (
                gameData.players.map((player, index) => (
                    <div key={index} className="player-item">
                    <span className="player-name">{player}</span>
                    {index === 0 && <span className="host-badge">Host</span>}
                    </div>
                ))
                ) : (
                <div className="player-item">
                    <span className="player-name">{gameData.playerName}</span>
                </div>
                )}
            </div>
            </div>

            <div className="waiting-actions">
            {gameData.type === 'create' ? (
                <button className="primary-button" disabled>
                Start Game (Need 2+ players)
                </button>
            ) : (
                <div className="waiting-message">
                <p>Waiting for host to start the game...</p>
                </div>
            )}
            <button className="secondary-button" onClick={goHome}>
                Leave Game
            </button>
            </div>
        </div>
        </div>
    </div>
    );
}
}