// server.js - Main Express + Socket.io server

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const game = require('./gameState');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/room/:roomId', (req, res) => {
  const room = game.getRoom(req.params.roomId.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ exists: true, phase: room.phase, playerCount: game.getConnectedPlayers(room.id).length });
});

// ─── Timer helpers ────────────────────────────────────────────────────────────
const roomTimers = {};

function startTimer(roomId, duration, onExpire) {
  clearTimer(roomId);
  const end = Date.now() + duration * 1000;
  roomTimers[roomId] = {
    timeout: setTimeout(() => {
      delete roomTimers[roomId];
      onExpire();
    }, duration * 1000),
    end,
  };
  return end;
}

function clearTimer(roomId) {
  if (roomTimers[roomId]) {
    clearTimeout(roomTimers[roomId].timeout);
    delete roomTimers[roomId];
  }
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // ── createRoom ───────────────────────────────────────────────────────────────
  socket.on('createRoom', ({ name, avatar }, callback) => {
    const roomId = game.createRoom(socket.id, name, avatar);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = name;
    socket.data.avatar = avatar;
    const room = game.getRoom(roomId);
    callback({ roomId, player: room.players[socket.id] });
    console.log(`Room created: ${roomId} by ${name}`);
  });

  // ── joinRoom ─────────────────────────────────────────────────────────────────
  socket.on('joinRoom', ({ roomId, name, avatar }, callback) => {
    const upper = roomId.toUpperCase();
    const room = game.getRoom(upper);
    if (!room) return callback({ error: 'الغرفة غير موجودة' });
    if (room.phase !== 'lobby') return callback({ error: 'اللعبة بدأت بالفعل' });

    game.addPlayer(upper, socket.id, name, avatar);
    socket.join(upper);
    socket.data.roomId = upper;
    socket.data.name = name;
    socket.data.avatar = avatar;

    const players = game.getConnectedPlayers(upper);
    callback({ roomId: upper, player: room.players[socket.id] });
    io.to(upper).emit('playerJoined', { players });
    console.log(`${name} joined room ${upper}`);
  });

  // ── startGame ────────────────────────────────────────────────────────────────
  socket.on('startGame', () => {
    const roomId = socket.data.roomId;
    const room = game.getRoom(roomId);
    if (!room || room.host !== socket.id) return;

    const categorySelectPlayer = game.startGame(roomId);
    const categories = game.getCategories(roomId);
    const players = game.getConnectedPlayers(roomId);

    // Start category-select timer
    const timerEnd = startTimer(roomId, game.CATEGORY_TIME, () => {
      autoSelectCategory(roomId);
    });

    io.to(roomId).emit('gameStarted', {
      round: 1,
      totalRounds: game.TOTAL_ROUNDS,
      categorySelectPlayer,
      categories,
      players,
    });

    io.to(roomId).emit('timerStart', { duration: game.CATEGORY_TIME, phase: 'categorySelect', end: timerEnd });
  });

  // ── selectCategory ───────────────────────────────────────────────────────────
  socket.on('selectCategory', ({ category }) => {
    const roomId = socket.data.roomId;
    const room = game.getRoom(roomId);
    if (!room || room.categorySelectPlayer !== socket.id) return;

    clearTimer(roomId);
    const question = game.selectCategory(roomId, category);
    if (!question) return;

    io.to(roomId).emit('questionStart', {
      questionId: question.id,
      question: question.question,
      category: question.category,
      image: question.image || null,
      round: room.currentRound + 1,
      totalRounds: game.TOTAL_ROUNDS,
    });

    const timerEnd = startTimer(roomId, game.ANSWER_TIME, () => {
      autoCollectAnswers(roomId);
    });

    io.to(roomId).emit('timerStart', { duration: game.ANSWER_TIME, phase: 'answering', end: timerEnd });
  });

  // ── submitAnswer ─────────────────────────────────────────────────────────────
  socket.on('submitAnswer', ({ answer }) => {
    const roomId = socket.data.roomId;
    const room = game.getRoom(roomId);
    if (!room) return;

    game.submitAnswer(roomId, socket.id, answer);
    io.to(roomId).emit('playerAnswered', { playerId: socket.id });

    const connected = game.getConnectedPlayers(roomId);
    const allAnswered = connected.every(p => room.answers[p.id]);
    if (allAnswered) {
      clearTimer(roomId);
      startVotingPhase(roomId);
    }
  });

  // ── submitVote ───────────────────────────────────────────────────────────────
  socket.on('submitVote', ({ answerId }) => {
    const roomId = socket.data.roomId;
    const room = game.getRoom(roomId);
    if (!room) return;

    const result = game.submitVote(roomId, socket.id, answerId);
    if (!result.ok) {
      socket.emit('voteError', { reason: result.reason });
      return;
    }

    io.to(roomId).emit('playerVoted', { playerId: socket.id });

    const connected = game.getConnectedPlayers(roomId);
    const allVoted = connected.every(p => room.votes[p.id]);
    if (allVoted) {
      clearTimer(roomId);
      showResults(roomId);
    }
  });

  // ── nextRound ────────────────────────────────────────────────────────────────
  socket.on('nextRound', () => {
    const roomId = socket.data.roomId;
    const room = game.getRoom(roomId);
    if (!room || room.host !== socket.id) return;

    const result = game.nextRound(roomId);
    if (result.ended) {
      const leaderboard = game.getLeaderboard(roomId);
      io.to(roomId).emit('gameEnded', { leaderboard });
    } else {
      const categories = game.getCategories(roomId);

      // Start category-select timer for next round
      const timerEnd = startTimer(roomId, game.CATEGORY_TIME, () => {
        autoSelectCategory(roomId);
      });

      io.to(roomId).emit('categorySelect', {
        round: room.currentRound + 1,
        totalRounds: game.TOTAL_ROUNDS,
        categorySelectPlayer: result.categorySelectPlayer,
        categories,
      });

      io.to(roomId).emit('timerStart', { duration: game.CATEGORY_TIME, phase: 'categorySelect', end: timerEnd });
    }
  });

  // ── disconnect ───────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    game.removePlayer(roomId, socket.id);
    const room = game.getRoom(roomId);
    if (!room) return;

    const players = game.getConnectedPlayers(roomId);
    io.to(roomId).emit('playerLeft', { playerId: socket.id, players, newHost: room.host });
    console.log(`${socket.data.name} left room ${roomId}`);

    if (players.length === 0) clearTimer(roomId);
  });
});

// ─── Internal helpers ─────────────────────────────────────────────────────────
function autoSelectCategory(roomId) {
  const room = game.getRoom(roomId);
  if (!room || room.phase !== 'categorySelect') return;

  // Pick a random category automatically
  const categories = game.getCategories(roomId);
  if (categories.length === 0) return;
  const randomCat = categories[Math.floor(Math.random() * categories.length)];

  const question = game.selectCategory(roomId, randomCat);
  if (!question) return;

  io.to(roomId).emit('questionStart', {
    questionId: question.id,
    question: question.question,
    category: question.category,
    image: question.image || null,
    round: room.currentRound + 1,
    totalRounds: game.TOTAL_ROUNDS,
  });

  const timerEnd = startTimer(roomId, game.ANSWER_TIME, () => {
    autoCollectAnswers(roomId);
  });

  io.to(roomId).emit('timerStart', { duration: game.ANSWER_TIME, phase: 'answering', end: timerEnd });
}

function autoCollectAnswers(roomId) {
  const room = game.getRoom(roomId);
  if (!room || room.phase !== 'question') return;
  startVotingPhase(roomId);
}

function startVotingPhase(roomId) {
  const room = game.getRoom(roomId);
  if (!room) return;

  const answerList = game.buildAnswerList(roomId);
  io.to(roomId).emit('votingStart', { answerList });

  const timerEnd = startTimer(roomId, game.VOTE_TIME, () => {
    showResults(roomId);
  });

  io.to(roomId).emit('timerStart', { duration: game.VOTE_TIME, phase: 'voting', end: timerEnd });
}

function showResults(roomId) {
  const room = game.getRoom(roomId);
  if (!room) return;

  const roundScores = game.calculateResults(roomId);
  const leaderboard = game.getLeaderboard(roomId);

  io.to(roomId).emit('roundResults', {
    roundScores,
    leaderboard,
    correctAnswer: room.currentQuestion.correctAnswer,
    answerList: room.answerList,
    votes: room.votes,
    isLastRound: room.currentRound + 1 >= game.TOTAL_ROUNDS,
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 الهبيدة server running on port ${PORT}`);
});
