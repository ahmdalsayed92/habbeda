// voting.component.ts
import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { AnswerItem } from '../../models/game.models';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';

@Component({
  selector: 'app-voting',
  standalone: true,
  imports: [CommonModule, CountdownTimerComponent],
  templateUrl: './voting.component.html',
  styleUrls: ['./voting.component.scss']
})
export class VotingComponent {
  constructor(public game: GameService) {}

  getArabicLetter(i: number): string {
    return ['أ','ب','ج','د','هـ','و'][i] ?? String(i + 1);
  }

  isOwnAnswer(answer: AnswerItem): boolean {
    return answer.id === this.game.myId();
  }

  canVote(answer: AnswerItem): boolean {
    return !this.game.submittedVote() && !this.isOwnAnswer(answer);
  }

  vote(answer: AnswerItem) {
    if (!this.canVote(answer)) return;
    this.game.submitVote(answer.id);
  }

  votedCount = computed(() =>
    this.game.players().filter(p => p.connected && this.game.votedPlayerIds().has(p.id)).length
  );

  totalCount = computed(() => this.game.players().filter(p => p.connected).length);
}
