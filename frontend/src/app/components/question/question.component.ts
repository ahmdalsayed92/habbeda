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
  answerInput    = signal('');
  showWarning    = signal(false);

  constructor(public game: GameService, private socket: SocketService) {}

  answeredCount = computed(() =>
      this.game.players().filter(p => p.connected && this.game.answeredPlayerIds().has(p.id)).length
  );
  totalCount = computed(() => this.game.players().filter(p => p.connected).length);

  answerWordCount = computed(() => this.game.currentQuestion()?.answerWordCount ?? 0);
  showWordHint    = computed(() => this.answerWordCount() >= 2);
  wordHintText    = computed(() => {
    const c = this.answerWordCount();
    if (c === 2) return 'الإجابة من كلمتين أو مقطعين';
    if (c === 3) return 'الإجابة من ثلاث كلمات';
    if (c === 4) return 'الإجابة من أربع كلمات';
    return 'الإجابة من ' + c + ' كلمات';
  });

  private normalize(s: string): string {
    return s.trim().toLowerCase()
        .replace(/[\u0610-\u061A\u064B-\u065F\u0671-\u0673]/g, '') // diacritics
        .replace(/[أإآا]/g, 'ا')   // normalize alef
        .replace(/ة/g, 'ه')        // normalize taa marbuta
        .replace(/ى/g, 'ي')        // normalize alef maqsura
        .replace(/\s+/g, ' ');
  }

  private isCorrect(input: string): boolean {
    const q = this.game.currentQuestion();
    if (!q || !q.correctAnswer) return false;
    return this.normalize(input) === this.normalize(q.correctAnswer);
  }

  submit() {
    const ans = this.answerInput().trim();
    if (!ans || this.game.submittedAnswer()) return;

    if (this.isCorrect(ans)) {
      this.showWarning.set(true);
      setTimeout(() => this.showWarning.set(false), 3500);
      return;
    }

    this.showWarning.set(false);
    this.game.submitAnswer(ans);
  }

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this.submit();
  }
}
