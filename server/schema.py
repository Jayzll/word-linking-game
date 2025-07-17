"""
===========================================================
JSON Schema for Client-to-Server WebSocket Messages
===========================================================

All messages sent from a client to the server via WebSocket
should conform to the following base structure.

--- Base Message Structure ---

{
  "type": "object",
  "properties": {
    "event": {
      "type": "string",
      "description": "The type of event being sent. This determines the structure of the 'payload'.",
      "enum": [
        "start_game",
        "join_game",
        "chat_message",
        "guess"
      ]
    },
    "payload": {
      "type": "object",
      "description": "An object containing the data for the event. See schemas below."
    }
  },
  "required": ["event", "payload"]
}

-----------------------------------------------------------
--- Payload Schemas by Event Type ---
-----------------------------------------------------------

--- 1. Event: "start_game" ---
Description: Sent as the first message on a new connection to create a new game lobby.

{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The display name of the player creating the game (the host).",
      "minLength": 1
    },
    "letters": {
      "type": "string",
      "description": "The two letters the game will be based on.",
      "minLength": 2
    }
  },
  "required": ["name", "letters"]
}

Example:
{
  "event": "start_game",
  "payload": {
    "name": "Alice",
    "letters": "SP"
  }
}


--- 2. Event: "join_game" ---
Description: Sent as the first message on a new connection to join an existing game lobby.

{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The display name of the player joining the game.",
      "minLength": 1
    },
    "join_code": {
      "type": "string",
      "description": "The case-insensitive, 6-character code to join an existing lobby."
    }
  },
  "required": ["name", "join_code"]
}

Example:
{
  "event": "join_game",
  "payload": {
    "name": "Bob",
    "join_code": "XYZ123"
  }
}


--- 3. Event: "chat_message" ---
Description: Sent by a connected client to broadcast a message to all players in the lobby.

{
  "type": "object",
  "properties": {
    "text": {
      "type": "string",
      "description": "The content of the chat message being sent."
    }
  },
  "required": ["text"]
}

Example:
{
  "event": "chat_message",
  "payload": {
    "text": "Hello everyone! Ready to play?"
  }
}


--- 4. Event: "guess" ---
Description: Sent by a connected client to submit a word as a guess in the game.

{
  "type": "object",
  "properties": {
    "guess": {
      "type": "string",
      "description": "The word the player is guessing."
    }
  },
  "required": ["guess"]
}

Example:
{
  "event": "guess",
  "payload": {
    "guess": "SPARK"
  }
}

"""