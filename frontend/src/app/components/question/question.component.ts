// question.component.ts
import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { signal } from '@angular/core';

@Component({
  selector: 'app-question',
  standalone: true,
  imports: [CommonModule, FormsModule, CountdownTimerComponent],
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss']
})
export class QuestionComponent {
  answerInput = signal('');

  constructor(public game: GameService, private socket: SocketService) {}

  answeredCount = computed(() =>
      this.game.players().filter(p => p.connected && this.game.answeredPlayerIds().has(p.id)).length
  );

  totalCount = computed(() => this.game.players().filter(p => p.connected).length);

  answerWordCount = computed(() => this.game.currentQuestion()?.answerWordCount ?? 0);
  showWordHint    = computed(() => this.answerWordCount() >= 2);

  wordHintText = computed(() => {
    const c = this.answerWordCount();
    if (c === 2) return 'الإجابة من كلمتين أو مقطعين';
    if (c === 3) return 'الإجابة من ثلاث كلمات';
    if (c === 4) return 'الإجابة من أربع كلمات';
    return 'الإجابة من ' + c + ' كلمات';
  });

  submit() {
    const ans = this.answerInput().trim();
    if (!ans || this.game.submittedAnswer()) return;
    // Server will reject if correct — answerRejected signal will fire
    this.game.submitAnswer(ans);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.submit();
  }
}
