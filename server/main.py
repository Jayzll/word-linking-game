import asyncio
import json
import random
import string
import uuid
from collections import defaultdict
from typing import Dict, List, Any
import dictionary 

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError

# --- Pydantic Models (Data Contracts) ---

class Player(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    is_host: bool = False

class Lobby(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    letters: str
    join_code: str
    players: List[Player] = []
    
# --- WebSocket Payload Models ---

class GameStartPayload(BaseModel):
    letters: str
    name: str

class GameJoinPayload(BaseModel):
    name: str
    join_code: str

# --- WebSocket Message Models ---

class WebSocketMessage(BaseModel):
    event: str
    payload: Dict[str, Any]

# --- In-Memory State Management ---
lobbies_by_id: Dict[uuid.UUID, Lobby] = {}
lobbies_by_code: Dict[str, Lobby] = {}

# --- WebSocket Connection Manager ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = defaultdict(list)

    def connect(self, websocket: WebSocket, lobby_id: uuid.UUID, user_id: uuid.UUID, player_name: str):
        """Registers an already-accepted websocket connection."""
        websocket.scope['lobby_id'] = lobby_id
        websocket.scope['user_id'] = user_id
        websocket.scope['player_name'] = player_name
        self.active_connections[lobby_id].append(websocket)

    def disconnect(self, websocket: WebSocket):
        lobby_id = websocket.scope.get('lobby_id')
        if lobby_id and websocket in self.active_connections.get(lobby_id, []):
            self.active_connections[lobby_id].remove(websocket)

    async def broadcast(self, message: str, lobby_id: uuid.UUID):
        tasks = [
            connection.send_text(message) 
            for connection in self.active_connections.get(lobby_id, [])
        ]
        await asyncio.gather(*tasks, return_exceptions=True)
        
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

# --- Helper Functions ---

def generate_join_code(length: int = 6) -> str:
    """Generates a random alphanumeric join code."""
    return "".join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=length))

async def close_with_error(websocket: WebSocket, reason: str, code: int = 1008):
    """Sends a JSON error message and closes the WebSocket connection."""
    await websocket.send_json({"event": "error", "message": reason})
    await websocket.close(code=code)

def is_guess_correct(lobby_id: uuid.UUID, guess: str) -> bool:
    letters = lobbies_by_id[lobby_id].letters.lower()
    guess = guess.lower()
    if guess[0] == letters[0] and guess[len(guess)-1] == letters[1]:
        if guess in dictionary.allowed_words:
            return True
    return False

# --- FastAPI Application ---

app = FastAPI(title="Real-Time Word Game Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)

# --- HTTP Endpoints ---
@app.get("/")
def root():
    return {"status": "OK"}


# --- WebSocket Endpoint ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # --- THIS is the one and only place we should accept the connection ---
    await websocket.accept()

    lobby_id: uuid.UUID | None = None

    try:
        initial_data = await websocket.receive_json()
        message = WebSocketMessage(**initial_data)

        if message.event == "start_game":
            try:
                payload = GameStartPayload(**message.payload)
                if len(payload.letters) < 2:
                    raise ValueError("Must provide at least two letters.")

                host_player = Player(name=payload.name, is_host=True)
                join_code = generate_join_code()
                
                new_lobby = Lobby(
                    letters=payload.letters[:2].upper(),
                    join_code=join_code,
                    players=[host_player]
                )

                lobbies_by_id[new_lobby.id] = new_lobby
                lobbies_by_code[join_code] = new_lobby
                lobby_id = new_lobby.id

                manager.connect(websocket, lobby_id, host_player.id, host_player.name)
                
                response = {
                    "event": "game_started",
                    "payload": {
                        "status": "success",
                        "lobby_id": str(lobby_id),
                        "join_code": join_code,
                        "player_id": str(host_player.id)
                    }
                }
                await manager.send_personal_message(json.dumps(response), websocket)

            except (ValidationError, ValueError) as e:
                await close_with_error(websocket, f"Invalid start game data: {e}")
                return

        elif message.event == "join_game":
            try:
                payload = GameJoinPayload(**message.payload)
                join_code = payload.join_code
                import logging
                # import logging at the top if not already imported
                import logging
                logging.debug(f"Current lobbies_by_code: {lobbies_by_code}")
                logger.debug(f"Join code received: {join_code}")
                logger.debug(f"Lobbies by code: {lobbies_by_code}")

                if join_code not in lobbies_by_code:
                    await close_with_error(websocket, "Game not found.")
                    return

                lobby_to_join = lobbies_by_code[join_code]
                lobby_id = lobby_to_join.id
                
                new_player = Player(name=payload.name)
                lobby_to_join.players.append(new_player)

                manager.connect(websocket, lobby_id, new_player.id, new_player.name)
                
                response = {
                    "event": "game_joined",
                    "payload": {
                        "status": "success",
                        "lobby_id": str(lobby_id),
                        "player_id": str(new_player.id)
                    }
                }
                await manager.send_personal_message(json.dumps(response), websocket)
                
                await manager.broadcast(
                    json.dumps({"event": "player_joined", "name": new_player.name}), lobby_id
                )

            except ValidationError as e:
                await close_with_error(websocket, f"Invalid join game data: {e}")
                return
        else:
            await close_with_error(websocket, "Connection not initialized. First event must be 'start_game' or 'join_game'.")
            return

        # --- 2. Active Communication Phase ---
        player_name = websocket.scope['player_name']

        while True:
            data = await websocket.receive_json()
            message = WebSocketMessage(**data)
            
            if message.event == "chat_message":
                text = message.payload.get("text", "")
                response = json.dumps({"event": "chat_message", "sender": player_name, "text": text})
                await manager.broadcast(response, lobby_id)

            elif message.event == "guess":
                guess = message.payload.get("guess", "")
                if is_guess_correct(lobby_id, guess):
                    response = json.dumps({"event": "guess_made", "sender": player_name, "guess": guess, "result": "Correct"})
                else:
                    response = json.dumps({"event": "guess_made", "sender": player_name, "guess": guess, "result": "Incorrect"})
                await manager.broadcast(response, lobby_id)
                
            elif message.event == "disconnect":
                response = json.dumps({"event": "disconnect", "sender": player_name, "result": "Success"})
                await manager.send_personal_message(response, websocket)
                manager.disconnect(websocket)

    except WebSocketDisconnect:
        player_name = websocket.scope.get('player_name', 'A player')
        print(f"Client {player_name} disconnected from lobby {lobby_id}")
    except Exception as e:
        player_name = websocket.scope.get('player_name', 'A player')
        print(f"An error occurred in websocket for {player_name}: {e}")
    finally:
        # --- 3. Cleanup Phase ---
        lobby_id = websocket.scope.get('lobby_id')
        manager.disconnect(websocket)
        if lobby_id:
            player_name = websocket.scope.get('player_name', 'A player')
            await manager.broadcast(
                json.dumps({"event": "player_disconnected", "name": player_name}), lobby_id
            )

# To run this file:
# 1. Save it as `main.py`
# 2. Install dependencies: `pip install "fastapi[all]"`
# 3. Run the server: `uvicorn main:app --reload`
#
# Client Interaction Example:
# 1. Client A connects to ws://localhost:8000/ws
# 2. Client A sends: {"event": "start_game", "payload": {"name": "Alice", "letters": "AB"}}
# 3. Server responds to Client A: {"event": "game_started", "payload": {"lobby_id": "...", "join_code": "XYZ123", ...}}
# 4. Client B connects to ws://localhost:8000/ws
# 5. Client B sends: {"event": "join_game", "payload": {"name": "Bob", "join_code": "XYZ123"}}
# 6. Server responds to Client B: {"event": "game_joined", "payload": {"lobby_id": "...", ...}}
# 7. Server broadcasts to Client A: {"event": "player_joined", "name": "Bob"}
# 8. Client X sends: {"event": "guess", "payload":{"guess":"some_word"}}
# 9. Server broadcasts to Lobby: {"event": "guess_made", "sender": "Alice", "guess": "some_word", "result": "Incorrect"}