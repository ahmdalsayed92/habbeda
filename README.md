# 🧠 El Habeeda — Real-Time Multiplayer Trivia Game

A Jackbox-style trivia game where players submit fake answers to fool each other.
Built with **Node.js + Socket.io** (backend) and **Angular 17** (frontend).

---

## 🎮 How to Play

1. One player creates a room and shares the code
2. Everyone joins and picks a name + avatar
3. Each round: one player picks a category
4. All players write a **fake answer** to the trivia question
5. Everyone votes on which answer they think is **correct**
6. **+2 pts** for picking the right answer
7. **+1 pt** for each player fooled by your fake answer
8. 10 rounds — highest score wins!

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- npm v9+
- Angular CLI v17: `npm install -g @angular/cli`

---

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on **http://localhost:3000**

For development with auto-reload:
```bash
npm run dev   # requires nodemon (installed as dev dependency)
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on **http://localhost:4200**

---

### 3. Play the Game

1. Open **http://localhost:4200** in multiple browser tabs (or on different devices on the same network)
2. One person creates a room
3. Others enter the room code to join
4. Host clicks **Start Game** (requires 2+ players)

To join from another device on your network, use your local IP:
```
http://192.168.x.x:4200
```

---

## 📁 Project Structure

```
trivia-game/
├── backend/
│   ├── server.js          # Express + Socket.io entry point
│   ├── gameState.js        # In-memory game logic
│   ├── questions.json      # Question bank (30 questions)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── home/              # Create/Join room screen
    │   │   │   ├── lobby/             # Waiting room
    │   │   │   ├── game-container/    # Phase router + timer bar
    │   │   │   ├── category-select/   # Category picker
    │   │   │   ├── question/          # Question + fake answer input
    │   │   │   ├── voting/            # Vote on answers
    │   │   │   ├── results/           # Round results
    │   │   │   └── leaderboard/       # Scoreboard / game over
    │   │   ├── services/
    │   │   │   ├── game.service.ts    # Central state + socket events
    │   │   │   ├── socket.service.ts  # Socket.io wrapper
    │   │   │   └── timer.service.ts   # Countdown timer
    │   │   ├── models/
    │   │   │   └── game.models.ts     # TypeScript interfaces
    │   │   ├── app.routes.ts
    │   │   ├── app.config.ts
    │   │   └── app.component.ts
    │   ├── styles.scss                # Global design system
    │   ├── index.html
    │   └── main.ts
    ├── angular.json
    ├── tsconfig.json
    └── package.json
```

---

## ⚙️ Configuration

### Change server URL
If running backend on a different port or machine, update `socket.service.ts`:
```typescript
private readonly SERVER_URL = 'http://localhost:3000';
```

### Add more questions
Edit `backend/questions.json` — each question follows this format:
```json
{
  "id": 31,
  "question": "What is the speed of light?",
  "correctAnswer": "299,792 km/s",
  "category": "Science",
  "image": "optional-url"
}
```

### Change game settings
In `backend/gameState.js`:
```js
const TOTAL_ROUNDS = 10;    // number of rounds
const ANSWER_TIME = 45;     // seconds to submit fake answer
const VOTE_TIME = 30;       // seconds to vote
const MAX_ANSWERS = 6;      // max answers shown in voting
```

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `createRoom` | Client → Server | Create a new room |
| `joinRoom` | Client → Server | Join existing room |
| `startGame` | Client → Server | Host starts game |
| `selectCategory` | Client → Server | Pick category for round |
| `submitAnswer` | Client → Server | Submit fake answer |
| `submitVote` | Client → Server | Vote for an answer |
| `nextRound` | Client → Server | Host advances game |
| `playerJoined` | Server → Client | New player joined |
| `gameStarted` | Server → Client | Game begins |
| `categorySelect` | Server → Client | New category picker turn |
| `questionStart` | Server → Client | Question revealed |
| `playerAnswered` | Server → Client | Player submitted answer |
| `votingStart` | Server → Client | Voting phase begins |
| `playerVoted` | Server → Client | Player voted |
| `roundResults` | Server → Client | Show round results |
| `timerStart` | Server → Client | Timer started |
| `gameEnded` | Server → Client | Game over |

---

## 🎨 Tech Stack

- **Backend**: Node.js, Express, Socket.io, UUID
- **Frontend**: Angular 17 (Standalone Components, Signals), SCSS
- **Fonts**: Fredoka One (display), Nunito (body)
- **Storage**: In-memory (no database needed)

---

## 🐛 Known Limitations (MVP)

- No persistent storage — rooms reset if server restarts
- No reconnection after browser refresh mid-game
- Profanity filter not implemented (optional enhancement)
- AI-generated fake answers not implemented (optional enhancement)
