import { useEffect, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

export default function useWebSocket(url) {
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new ReconnectingWebSocket(url);

    websocket.onopen = () => {
      console.log("WebSocket connected to:", url);
      console.log("WebSocket ready state:", websocket.readyState);
    };
    
    websocket.onmessage = (e) => {
      console.log("WebSocket message received:", e.data);
    };
    
    websocket.onerror = (e) => {
      console.error("WebSocket error:", e);
    };
    
    websocket.onclose = (e) => {
      console.log("WebSocket disconnected. Code:", e.code, "Reason:", e.reason);
    };

    setWs(websocket);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [url]);

  return ws;
}