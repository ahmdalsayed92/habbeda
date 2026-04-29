// question.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
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
  correctAnswerWarning = signal(false);
  isChecking = signal(false);

  constructor(public game: GameService, private socket: SocketService) {}

  answeredCount = computed(() =>
      this.game.players().filter(p => p.connected && this.game.answeredPlayerIds().has(p.id)).length
  );

  totalCount = computed(() => this.game.players().filter(p => p.connected).length);

  // كم كلمة في الإجابة الصحيحة — نحسبها من السؤال نفسه مش من correctAnswer
  answerWordCount = computed(() => {
    const q = this.game.currentQuestion();
    if (!q) return 0;
    return q.answerWordCount ?? 0;
  });

  showWordHint = computed(() => this.answerWordCount() >= 2);

  wordHintText = computed(() => {
    const count = this.answerWordCount();
    if (count === 2) return 'الإجابة من كلمتين أو مقطعين';
    if (count === 3) return 'الإجابة من ثلاث كلمات';
    if (count === 4) return 'الإجابة من أربع كلمات';
    return 'الإجابة من ' + count + ' كلمات';
  });

  async submit() {
    const ans = this.answerInput().trim();
    if (!ans || this.game.submittedAnswer() || this.isChecking()) return;

    this.isChecking.set(true);
    try {
      const result = await this.socket.emitWithAck<{ isCorrect: boolean }>('checkAnswer', { answer: ans });
      if (result.isCorrect) {
        this.correctAnswerWarning.set(true);
        setTimeout(() => this.correctAnswerWarning.set(false), 3500);
        return;
      }
      this.correctAnswerWarning.set(false);
      this.game.submitAnswer(ans);
    } finally {
      this.isChecking.set(false);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.submit();
  }
}
