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

  constructor(public game: GameService, private socket: SocketService) {}

  answeredCount = computed(() =>
      this.game.players().filter(p => p.connected && this.game.answeredPlayerIds().has(p.id)).length
  );

  totalCount = computed(() => this.game.players().filter(p => p.connected).length);

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

  private normalize(s: string): string {
    return s.trim().toLowerCase()
        .replace(/[\u0610-\u061A\u064B-\u065F]/g, '')
        .replace(/\s+/g, ' ');
  }

  submit() {
    const ans = this.answerInput().trim();
    if (!ans || this.game.submittedAnswer()) return;

    // ١ - تحقق لو الإجابة صح
    const correct = this.game.currentQuestion()?.correctAnswer ?? '';
    const isCorrect = correct !== '' && this.normalize(ans) === this.normalize(correct);

    if (isCorrect) {
      // اظهر الرسالة وامنع الـ submit
      this.correctAnswerWarning.set(true);
      setTimeout(() => this.correctAnswerWarning.set(false), 3500);
      return; // ← مش بيكمل للـ submitAnswer
    }

    this.correctAnswerWarning.set(false);
    this.game.submitAnswer(ans);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.submit();
  }
}
