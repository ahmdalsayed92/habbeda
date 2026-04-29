// question.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule, FormsModule, CountdownTimerComponent],
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss']
})
export class QuestionComponent {
  answerInput = signal('');

  constructor(public game: GameService) {}

  answeredCount = computed(() =>
    this.game.players().filter(p => p.connected && this.game.answeredPlayerIds().has(p.id)).length
  );

  totalCount = computed(() => this.game.players().filter(p => p.connected).length);

  submit() {
    const ans = this.answerInput().trim();
    if (!ans || this.game.submittedAnswer()) return;
    this.game.submitAnswer(ans);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.submit();
  }
}
