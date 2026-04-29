// components/leaderboard/leaderboard.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent {
  @Input() final = false;
  @Output() playAgain = new EventEmitter<void>();

  constructor(public game: GameService) {}

  rankEmoji(rank: number): string {
    return ['🥇','🥈','🥉'][rank - 1] ?? `#${rank}`;
  }

  get winner() {
    return this.game.leaderboard()[0];
  }
}
