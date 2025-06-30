import React, { useState, useEffect } from 'react';
import './App.css';

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

export default function App() {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [word, setWord] = useState('');
  const [timer, setTimer] = useState(0);
  const [result, setResult] = useState(null);
  const [dictionary, setDictionary] = useState(new Set());

  // Load dictionary on mount
  useEffect(() => {
    fetch('/dictionary.json')
      .then(res => res.json())
      .then(data => setDictionary(new Set(data.map(w => w.toUpperCase()))))
      .catch(() => {
        // Fallback dictionary for demo
        const fallbackWords = ['APPLE', 'BANANA', 'SILENT', 'LISTEN', 'SCRABBLE', 'GAME'];
        setDictionary(new Set(fallbackWords));
      });
  }, []);

  // Countdown logic
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0 && first && last && !result) {
      checkWord();
    }
    return () => clearTimeout(interval);
  }, [timer, first, last, result, word]);

  const startRound = (letter) => {
    const rand = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    setFirst(letter);
    setLast(rand);
    setWord('');
    setResult(null);
    setTimer(10);
  };

  const checkWord = () => {
    const upperWord = word.toUpperCase();
    if (!upperWord.startsWith(first) || !upperWord.endsWith(last)) {
      setResult(`❌ Word must start with ${first} and end with ${last}`);
    } else if (dictionary.has(upperWord)) {
      setResult('✅ You win!');
    } else {
      setResult('❌ Not a valid Scrabble word');
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (timer > 0 && !result) {
      setTimer(0);
    }
  };

  return (
    <div className="game-container">
      
      <div className="game-title">
        <h1>Game Title</h1>
      </div>
      
      <div className="content-area">
        {        /* Letter boxes - always visible */}
        <div className="letter-boxes">
          <div className={`letter-box ${!first ? 'empty' : ''}`}>
            <span>{first || 'A'}</span>
          </div>
          
          {/* Middle letters - only show when user is typing */}
          {first && word.length > 0 && (
            <div className="middle-letters">
              {word.slice(1, -1).split('').map((letter, index) => (
                <div key={index} className="letter-box">
                  <span>{letter.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className={`letter-box ${!last ? 'empty' : ''}`}>
            <span>{last || 'Z'}</span>
          </div>
        </div>
        
        {/* Game info - only show when game is active */}
        {first && (
          <div className="game-info">
            <div className="timer">Time: {timer}s</div>
          </div>
        )}
        
        {        /* Input area - hidden input field for typing */}
        {first && (
          <div className="input-area">
            {first && !result && (
            <div className="onscreen-keyboard">
              {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                  {row.split('').map(letter => (
                    <button
                      key={letter}
                      className="key-btn"
                      onClick={() => {
                        // Allow typing only middle letters
                        const newWord = word.length === 0
                          ? first + letter
                          : word.slice(0, -1) + letter + last;
                        setWord(newWord);
                      }}
                    >
                      {letter}
                    </button>
                  ))}
                  {rowIndex === 2 && (
                    <>
                      <button
                        className="key-btn action"
                        onClick={() => {
                          if (word.length > 2) {
                            const trimmed = word.slice(0, -2);
                            setWord(trimmed + last);
                          }
                        }}
                      >
                        ⌫
                      </button>
                      <button className="key-btn action" onClick={onSubmit}>↵</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

            <input
              type="text"
              value={word}
              onChange={e => setWord(e.target.value)}
              disabled={!!result}
              autoFocus
              placeholder={`Type word starting with ${first} and ending with ${last}`}
              className="word-input"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit(e)}
              style={{ opacity: 0, position: 'absolute', left: '-9999px' }}
            />
            <div className="typing-instruction">
              Start typing your word (it will appear above)
            </div>
            <button onClick={onSubmit} disabled={!!result} className="submit-btn">
              Submit
            </button>
          </div>
        )}
        
        {/* Result area */}
        {result && (
          <div className="result-area">
            <h2>{result}</h2>
            <button onClick={() => setFirst('')} className="play-again-btn">
              Play Again?
            </button>
          </div>
        )}
        
        {/* Keyboard - always visible */}
        <div className="keyboard-area">
          {!first && (
            <button className="start-btn" onClick={() => {
              const randomLetter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
              startRound(randomLetter);
            }}>
              Start Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}