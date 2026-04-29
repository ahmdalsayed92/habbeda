// services/game.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SocketService } from './socket.service';
import {
  Player, AnswerItem, RoundResults, LeaderboardEntry, GamePhase
} from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class GameService {
  // ── State signals ───────────────────────────────────────────────
  roomId = signal<string>('');
  myId = signal<string>('');
  myName = signal<string>('');
  myAvatar = signal<string>('');
  players = signal<Player[]>([]);
  phase = signal<GamePhase>('home');
  currentRound = signal<number>(1);
  totalRounds = signal<number>(10);
  categorySelectPlayerId = signal<string>('');
  categories = signal<string[]>([]);
  currentQuestion = signal<{ question: string; category: string; image?: string } | null>(null);
  answerList = signal<AnswerItem[]>([]);
  myVote = signal<string>('');
  myAnswer = signal<string>('');
  roundResults = signal<RoundResults | null>(null);
  leaderboard = signal<LeaderboardEntry[]>([]);
  timerEnd = signal<number>(0);
  timerDuration = signal<number>(45);
  timerPhase = signal<'answering' | 'voting' | 'categorySelect'>('answering');
  submittedAnswer = signal<boolean>(false);
  submittedVote = signal<boolean>(false);
  answeredPlayerIds = signal<Set<string>>(new Set());
  votedPlayerIds = signal<Set<string>>(new Set());

  // ── Derived ─────────────────────────────────────────────────────
  me = computed(() => this.players().find(p => p.id === this.myId()));
  isHost = computed(() => this.me()?.isHost ?? false);
  isCategorySelector = computed(() => this.categorySelectPlayerId() === this.myId());
  categorySelectorPlayer = computed(() => this.players().find(p => p.id === this.categorySelectPlayerId()));

  constructor(private socket: SocketService, private router: Router) {
    this.setupListeners();
    // Set myId once socket connects
    setTimeout(() => this.myId.set(this.socket.socketId), 500);
  }

  private setupListeners() {
    // Player joined lobby
    this.socket.on<{ players: Player[] }>('playerJoined').subscribe(({ players }) => {
      this.players.set(players);
    });

    // Player left
    this.socket.on<{ playerId: string; players: Player[]; newHost: string }>('playerLeft').subscribe(({ players }) => {
      this.players.set(players);
    });

    // Game started → category select
    this.socket.on<any>('gameStarted').subscribe((data) => {
      this.players.set(data.players);
      this.currentRound.set(1);
      this.totalRounds.set(data.totalRounds);
      this.categorySelectPlayerId.set(data.categorySelectPlayer);
      this.categories.set(data.categories);
      this.phase.set('categorySelect');
      this.router.navigate(['/game', this.roomId()]);
    });

    // Category select (next round)
    this.socket.on<any>('categorySelect').subscribe((data) => {
      this.currentRound.set(data.round);
      this.categorySelectPlayerId.set(data.categorySelectPlayer);
      this.categories.set(data.categories);
      this.myAnswer.set('');
      this.myVote.set('');
      this.submittedAnswer.set(false);
      this.submittedVote.set(false);
      this.answeredPlayerIds.set(new Set());
      this.votedPlayerIds.set(new Set());
      this.phase.set('categorySelect');
    });

    // Question shown
    this.socket.on<any>('questionStart').subscribe((data) => {
      this.currentQuestion.set({ question: data.question, category: data.category, image: data.image });
      this.currentRound.set(data.round);
      this.submittedAnswer.set(false);
      this.answeredPlayerIds.set(new Set());
      this.phase.set('question');
    });

    // Another player answered
    this.socket.on<{ playerId: string }>('playerAnswered').subscribe(({ playerId }) => {
      this.answeredPlayerIds.update(s => new Set([...s, playerId]));
    });

    // Voting phase started
    this.socket.on<{ answerList: AnswerItem[] }>('votingStart').subscribe(({ answerList }) => {
      this.answerList.set(answerList);
      this.submittedVote.set(false);
      this.votedPlayerIds.set(new Set());
      this.phase.set('voting');
    });

    // Another player voted
    this.socket.on<{ playerId: string }>('playerVoted').subscribe(({ playerId }) => {
      this.votedPlayerIds.update(s => new Set([...s, playerId]));
    });

    // Round results
    this.socket.on<RoundResults>('roundResults').subscribe((results) => {
      this.roundResults.set(results);
      this.leaderboard.set(results.leaderboard);
      // Update player scores
      this.players.update(players =>
        players.map(p => ({
          ...p,
          score: results.leaderboard.find(l => l.id === p.id)?.score ?? p.score
        }))
      );
      this.phase.set('results');
    });

    // Timer
    this.socket.on<{ duration: number; phase: string; end: number }>('timerStart').subscribe((data) => {
      this.timerEnd.set(data.end);
      this.timerDuration.set(data.duration);
      this.timerPhase.set(data.phase as any);
    });

    // Game ended
    this.socket.on<{ leaderboard: LeaderboardEntry[] }>('gameEnded').subscribe(({ leaderboard }) => {
      this.leaderboard.set(leaderboard);
      this.phase.set('ended');
    });
  }

  // ── Actions ──────────────────────────────────────────────────────
  async createRoom(name: string, avatar: string): Promise<string> {
    this.myName.set(name);
    this.myAvatar.set(avatar);
    const res = await this.socket.emitWithAck<any>('createRoom', { name, avatar });
    if (res.error) throw new Error(res.error);
    this.roomId.set(res.roomId);
    this.myId.set(res.player.id);
    this.players.set([res.player]);
    this.phase.set('lobby');
    return res.roomId;
  }

  async joinRoom(roomId: string, name: string, avatar: string): Promise<void> {
    this.myName.set(name);
    this.myAvatar.set(avatar);
    const res = await this.socket.emitWithAck<any>('joinRoom', { roomId, name, avatar });
    if (res.error) throw new Error(res.error);
    this.roomId.set(res.roomId);
    this.myId.set(res.player.id);
    this.phase.set('lobby');
  }

  startGame() {
    this.socket.emit('startGame');
  }

  selectCategory(category: string) {
    this.socket.emit('selectCategory', { category });
  }

  submitAnswer(answer: string) {
    this.myAnswer.set(answer);
    this.submittedAnswer.set(true);
    this.socket.emit('submitAnswer', { answer });
  }

  submitVote(answerId: string) {
    this.myVote.set(answerId);
    this.submittedVote.set(true);
    this.socket.emit('submitVote', { answerId });
  }

  nextRound() {
    this.socket.emit('nextRound');
  }

  reset() {
    this.roomId.set('');
    this.myId.set('');
    this.players.set([]);
    this.phase.set('home');
    this.currentRound.set(1);
    this.currentQuestion.set(null);
    this.answerList.set([]);
    this.roundResults.set(null);
    this.submittedAnswer.set(false);
    this.submittedVote.set(false);
  }
}
