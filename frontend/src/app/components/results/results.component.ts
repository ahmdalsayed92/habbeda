// components/results/results.component.ts
import { Component, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { AnswerItem } from '../../models/game.models';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {
  revealStep = 0; // 0=answers, 1=scores

  constructor(public game: GameService) {}

  ngOnInit() {
    // Auto-reveal scores after 2 seconds
    setTimeout(() => this.revealStep = 1, 2000);
  }

  getAnswerClass(answer: AnswerItem): string {
    if (answer.isCorrect) return 'revealed-correct';
    const myAnswer = this.game.answerList().find(a => a.id === this.game.myId());
    if (answer.id === this.game.myId()) return 'revealed-my-wrong'; // my submitted fake
    return 'revealed-wrong';
  }

  getChoosers(answer: AnswerItem) {
    const votes = this.game.roundResults()?.votes ?? {};
    const chooserIds = Object.entries(votes)
      .filter(([, answId]) => answId === answer.id)
      .map(([voterId]) => voterId);
    return chooserIds.map(id => this.game.players().find(p => p.id === id)).filter(Boolean);
  }

  myPoints = computed(() => {
    const results = this.game.roundResults();
    if (!results) return 0;
    return results.roundScores[this.game.myId()]?.points ?? 0;
  });

  iVotedCorrect = computed(() => {
    const results = this.game.roundResults();
    if (!results) return false;
    return results.votes[this.game.myId()] === 'correct';
  });

  sortedScores = computed(() => {
    const results = this.game.roundResults();
    if (!results) return [];
    return Object.entries(results.roundScores)
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.points - a.points);
  });

  getPlayerName(playerId: string): string {
    return this.game.players().find(p => p.id === playerId)?.name ?? "Player";
  }

  get isLastRound() {
    return this.game.roundResults()?.isLastRound ?? false;
  }

  nextRound() {
    this.game.nextRound();
  }
}

// helper
