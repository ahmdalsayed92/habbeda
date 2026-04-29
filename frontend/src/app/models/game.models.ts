// models/game.models.ts

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  connected: boolean;
  isHost: boolean;
}

export interface Question {
  id: number;
  question: string;
  correctAnswer: string;
  category: string;
  image?: string;
}

export interface AnswerItem {
  id: string;          // playerId | 'correct' | 'fake_N'
  text: string;
  playerId: string | null;
  isCorrect: boolean;
  isFake: boolean;
}

export interface RoundScore {
  name: string;
  avatar: string;
  points: number;
  votedFor: string | null;
  chosenBy: string[];
}

export interface RoundResults {
  roundScores: { [playerId: string]: RoundScore };
  leaderboard: LeaderboardEntry[];
  correctAnswer: string;
  answerList: AnswerItem[];
  votes: { [voterId: string]: string };
  isLastRound: boolean;
}

export interface LeaderboardEntry extends Player {
  rank: number;
}

export type GamePhase =
  | 'home'
  | 'lobby'
  | 'categorySelect'
  | 'question'
  | 'voting'
  | 'results'
  | 'ended';
