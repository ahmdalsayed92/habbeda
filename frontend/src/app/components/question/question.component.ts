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
  correctAnswerWarning = signal(false);

  constructor(public game: GameService) {}

  answeredCount = computed(() =>
      this.game.players().filter(p => p.connected && this.game.answeredPlayerIds().has(p.id)).length
  );

  totalCount = computed(() => this.game.players().filter(p => p.connected).length);

  // كم كلمة في الإجابة الصحيحة
  answerWordCount = computed(() => {
    const correct = this.game.currentQuestion()?.correctAnswer ?? '';
    const parts = correct.trim().split(/[\s\-\u2013\u2014]+/).filter(p => p.length > 0);
    return parts.length;
  });

  showWordHint = computed(() => this.answerWordCount() >= 2);

  wordHintText = computed(() => {
    const count = this.answerWordCount();
    if (count === 2) return 'الإجابة من كلمتين أو مقطعين';
    if (count === 3) return 'الإجابة من ثلاث كلمات';
    if (count === 4) return 'الإجابة من أربع كلمات';
    return 'الإجابة من ' + count + ' كلمات';
  });

  private normalize(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/[\u0610-\u061A\u064B-\u065F]/g, '')
        .replace(/\s+/g, ' ');
  }

  isCorrectAnswer(input: string): boolean {
    const correct = this.game.currentQuestion()?.correctAnswer ?? '';
    return this.normalize(input) === this.normalize(correct);
  }

  submit() {
    const ans = this.answerInput().trim();
    if (!ans || this.game.submittedAnswer()) return;

    if (this.isCorrectAnswer(ans)) {
      this.correctAnswerWarning.set(true);
      setTimeout(() => this.correctAnswerWarning.set(false), 3500);
      return;
    }

    this.correctAnswerWarning.set(false);
    this.game.submitAnswer(ans);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.submit();
  }
}
