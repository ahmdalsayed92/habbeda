// gameState.js - In-memory game state management (Arabic)

const fs = require('fs');
const path = require('path');

const TOTAL_ROUNDS = 10;
const CATEGORY_TIME = 60;
const ANSWER_TIME = 60;
const VOTE_TIME = 60;
const MAX_ANSWERS = 6;

// ─── Question loading ──────────────────────────────────────────────────────────
let allQuestions = [];

function loadQuestions() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8');
    allQuestions = JSON.parse(data);
    console.log(`تم تحميل ${allQuestions.length} سؤال`);
  } catch (err) {
    console.error('فشل تحميل الأسئلة:', err);
    allQuestions = [];
  }
}

loadQuestions();

// ─── Room state ────────────────────────────────────────────────────────────────
const rooms = {};

function createRoom(hostId, hostName, hostAvatar) {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  rooms[roomId] = {
    id: roomId,
    phase: 'lobby',
    players: {},
    host: hostId,
    currentRound: 0,
    usedQuestionIds: [],
    usedCategories: [], // ✅ جديد
    currentQuestion: null,
    currentCategory: null,
    categorySelectPlayer: null,
    answers: {},
    votes: {},
    answerList: [],
    roundScores: {},
  };
  addPlayer(roomId, hostId, hostName, hostAvatar);
  return roomId;
}

function addPlayer(roomId, playerId, name, avatar) {
  if (!rooms[roomId]) return false;
  rooms[roomId].players[playerId] = {
    id: playerId, name, avatar,
    score: 0, connected: true,
    isHost: rooms[roomId].host === playerId,
  };
  return true;
}

function removePlayer(roomId, playerId) {
  if (!rooms[roomId]) return;
  if (rooms[roomId].players[playerId]) {
    rooms[roomId].players[playerId].connected = false;
  }
  if (rooms[roomId].host === playerId) {
    const others = Object.keys(rooms[roomId].players).filter(
        id => id !== playerId && rooms[roomId].players[id].connected
    );
    if (others.length > 0) {
      rooms[roomId].host = others[0];
      rooms[roomId].players[others[0]].isHost = true;
    }
  }
}

function getConnectedPlayers(roomId) {
  if (!rooms[roomId]) return [];
  return Object.values(rooms[roomId].players).filter(p => p.connected);
}

function getRoom(roomId) { return rooms[roomId] || null; }

// ─── Categories ────────────────────────────────────────────────────────────────
function getCategories(roomId) {
  const room = rooms[roomId];
  if (!room) return [];

  const remaining = allQuestions.filter(
      q =>
          !room.usedQuestionIds.includes(q.id) &&
          !room.usedCategories.includes(q.category)
  );

  let cats = [...new Set(remaining.map(q => q.category))];

  // fallback لو خلصت كل الكاتيجوريز
  if (cats.length === 0) {
    room.usedCategories = [];
    const allCats = [...new Set(allQuestions.map(q => q.category))];
    return allCats;
  }

  return cats;
}

function selectCategory(roomId, category) {
  const room = rooms[roomId];
  if (!room) return null;

  // ❌ منع التكرار
  if (room.usedCategories.includes(category)) {
    return null;
  }

  room.usedCategories.push(category);
  room.currentCategory = category;

  const available = allQuestions.filter(
      q => q.category === category && !room.usedQuestionIds.includes(q.id)
  );

  let question;

  if (available.length === 0) {
    const any = allQuestions.filter(q => !room.usedQuestionIds.includes(q.id));
    if (any.length === 0) return null;
    question = any[Math.floor(Math.random() * any.length)];
  } else {
    question = available[Math.floor(Math.random() * available.length)];
  }

  room.currentQuestion = question;
  room.usedQuestionIds.push(question.id);

  room.answers = {};
  room.votes = {};
  room.answerList = [];

  room.phase = 'question';

  return question;
}

// ─── Answers ───────────────────────────────────────────────────────────────────
function submitAnswer(roomId, playerId, answerText) {
  const room = rooms[roomId];
  if (!room || room.phase !== 'question') return false;
  room.answers[playerId] = answerText.trim();
  return true;
}

function buildAnswerList(roomId) {
  const room = rooms[roomId];
  if (!room) return [];

  const connected = getConnectedPlayers(roomId);
  const answerList = [];

  for (const player of connected) {
    if (room.answers[player.id]) {
      answerList.push({
        id: player.id,
        text: room.answers[player.id],
        playerId: player.id,
        isCorrect: false,
        isFake: false,
      });
    }
  }

  answerList.push({
    id: 'correct',
    text: room.currentQuestion.correctAnswer,
    playerId: null,
    isCorrect: true,
    isFake: false,
  });

  if (answerList.length < MAX_ANSWERS) {
    const existingTexts = new Set(answerList.map(a => a.text.toLowerCase()));

    const questionWrongAnswers = [...(room.currentQuestion.wrongAnswers || [])]
        .sort(() => Math.random() - 0.5);

    let fillerIdx = 0;
    for (const wrong of questionWrongAnswers) {
      if (answerList.length >= MAX_ANSWERS) break;
      if (!existingTexts.has(wrong.toLowerCase())) {
        answerList.push({
          id: `fake_${++fillerIdx}`,
          text: wrong,
          playerId: null,
          isCorrect: false,
          isFake: true,
        });
        existingTexts.add(wrong.toLowerCase());
      }
    }
  }

  room.answerList = answerList.sort(() => Math.random() - 0.5);
  room.phase = 'voting';
  return room.answerList;
}

// ─── Voting ────────────────────────────────────────────────────────────────────
function submitVote(roomId, voterId, answerId) {
  const room = rooms[roomId];
  if (!room || room.phase !== 'voting') return { ok: false, reason: 'مرحلة خاطئة' };
  if (answerId === voterId) return { ok: false, reason: 'لا يمكنك التصويت على إجابتك' };
  room.votes[voterId] = answerId;
  return { ok: true };
}

// ─── Results ───────────────────────────────────────────────────────────────────
function calculateResults(roomId) {
  const room = rooms[roomId];
  if (!room) return null;

  const roundScores = {};
  const connected = getConnectedPlayers(roomId);

  for (const player of connected) {
    roundScores[player.id] = {
      name: player.name,
      avatar: player.avatar,
      points: 0,
      votedFor: null,
      chosenBy: [],
    };
  }

  for (const [voterId, answerId] of Object.entries(room.votes)) {
    if (!roundScores[voterId]) continue;
    roundScores[voterId].votedFor = answerId;

    if (answerId === 'correct') {
      roundScores[voterId].points += 2;
    } else {
      const owner = room.answerList.find(a => a.id === answerId);
      if (owner && owner.playerId && roundScores[owner.playerId]) {
        roundScores[owner.playerId].points += 1;
        roundScores[owner.playerId].chosenBy.push(voterId);
      }
    }
  }

  for (const [pid, rs] of Object.entries(roundScores)) {
    if (room.players[pid]) room.players[pid].score += rs.points;
  }

  room.roundScores = roundScores;
  room.phase = 'results';
  return roundScores;
}

// ─── Rounds ────────────────────────────────────────────────────────────────────
function nextRound(roomId) {
  const room = rooms[roomId];
  if (!room) return false;

  room.currentRound += 1;

  if (room.currentRound >= TOTAL_ROUNDS) {
    room.phase = 'ended';
    return { ended: true };
  }

  const playerIds = Object.keys(room.players).filter(id => room.players[id].connected);
  room.categorySelectPlayer = playerIds[room.currentRound % playerIds.length];

  room.phase = 'categorySelect';

  return {
    ended: false,
    categorySelectPlayer: room.categorySelectPlayer
  };
}

function startGame(roomId) {
  const room = rooms[roomId];
  if (!room) return false;

  room.currentRound = 0;
  room.usedQuestionIds = [];
  room.usedCategories = []; // ✅ reset

  room.phase = 'categorySelect';

  const playerIds = Object.keys(room.players).filter(id => room.players[id].connected);
  room.categorySelectPlayer = playerIds[0];

  return room.categorySelectPlayer;
}

// ─── Leaderboard ───────────────────────────────────────────────────────────────
function getLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return [];

  return Object.values(room.players)
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: i + 1 }));
}

module.exports = {
  createRoom,
  addPlayer,
  removePlayer,
  getConnectedPlayers,
  getRoom,
  getCategories,
  selectCategory,
  submitAnswer,
  buildAnswerList,
  submitVote,
  calculateResults,
  nextRound,
  startGame,
  getLeaderboard,
  ANSWER_TIME,
  VOTE_TIME,
  CATEGORY_TIME,
  TOTAL_ROUNDS,
};