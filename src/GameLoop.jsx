
import React, { useState, useEffect } from 'react';
import './App.css';

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

export default function GameLoop({ onExit }) {
const [first, setFirst] = useState('');
const [last, setLast] = useState('');
const [word, setWord] = useState('');
const [timer, setTimer] = useState(0);
const [result, setResult] = useState(null);
const [dictionary, setDictionary] = useState(new Set());

useEffect(() => {
    fetch('/dictionary.json')
    .then(res => res.json())
    .then(data => setDictionary(new Set(data.map(w => w.toUpperCase()))))
    .catch(() => {
        const fallbackWords = ['APPLE', 'BANANA', 'SILENT', 'LISTEN', 'SCRABBLE', 'GAME'];
        setDictionary(new Set(fallbackWords));
    });
}, []);

useEffect(() => {
    let interval;
    if (timer > 0) {
    interval = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0 && first && last && !result) {
    checkWord();
    }
    return () => clearTimeout(interval);
}, [timer, first, last, result, word]);

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
    <div className="app">
    <div className="header">
        <h1>Word Linking Game</h1>
        <p>Create a word with the given first and last letters!</p>
    </div>

    <div className="game-area">
        <div className="letter-boxes">
        <div className={`letter-box ${!first ? 'inactive' : 'first'}`}>
            <span>{first || 'A'}</span>
        </div>

        {first && word.length > 2 && (
            <div className="middle-letters">
            {word.slice(1, -1).split('').map((letter, index) => (
                <div key={index} className="middle-box">
                <span>{letter.toUpperCase()}</span>
                </div>
            ))}
            </div>
        )}

        <div className={`letter-box ${!last ? 'inactive' : 'last'}`}>
            <span>{last || 'Z'}</span>
        </div>
        </div>

        {first && (
        <div className="timer-display">
            <div className="timer">Time: {timer}s</div>
        </div>
        )}

        {first && !result && (
        <div className="submit-area">
            <p>
            {word.length <= 2 ? 'Start typing your word (it will appear above)' : `Current word: ${word}`}
            </p>
            <button onClick={onSubmit} disabled={!!result || word.length <= 2}>
            Submit Word
            </button>
        </div>
        )}

        {result && (
        <div className="result-area">
            <h2>{result}</h2>
            <button onClick={() => {
            setFirst('');
            setLast('');
            setWord('');
            setResult(null);
            setTimer(0);
            }}>
            Play Again?
            </button>
            <button onClick={onExit}>Exit to Lobby</button>
        </div>
        )}

        <div className="keyboard">
        {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row">
            {row.split('').map(letter => (
                <button
                key={letter}
                className="key-button"
                onClick={() => {
                    if (!first) {
                    const randomLast = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
                    setFirst(letter);
                    setLast(randomLast);
                    setWord(letter + randomLast);
                    setTimer(10);
                    setResult(null);
                    } else if (!result) {
                    const middle = word.slice(1, -1);
                    setWord(first + middle + letter + last);
                    }
                }}
                disabled={!!result}
                >
                {letter}
                </button>
            ))}

            {rowIndex === 2 && (
                <>
                <button
                    className="delete-button"
                    onClick={() => {
                    if (first && !result) {
                        const middle = word.slice(1, -1);
                        setWord(first + middle.slice(0, -1) + last);
                    }
                    }}
                    disabled={!first || !!result || word.length <= 2}
                >
                    ⌫
                </button>
                <button
                    className="enter-button"
                    onClick={onSubmit}
                    disabled={!first || !!result || word.length <= 2}
                >
                    ↵
                </button>
                </>
            )}
            </div>
        ))}
        </div>

        {!first && (
        <div className="start-instruction">
            <p>Click any letter to start the game!</p>
        </div>
        )}
    </div>
    </div>
);
}
