import React, { createContext, useContext } from 'react';
import useWebSocket from '../hooks/useWebsocket';

const WebSocketContext = createContext(undefined);

export const WebSocketProvider = ({ url, children }) => {
  const ws = useWebSocket(url);
  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useGlobalWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useGlobalWebSocket must be used within WebSocketProvider');
  }
  return context;
};