import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WebSocketProvider } from './context/WebSocketProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WebSocketProvider url="ws://vladbagatskyy.me/ws">
      <App />
    </WebSocketProvider>
  </StrictMode>
)
