// category-select.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';

const CATEGORY_EMOJIS: Record<string, string> = {
  'جغرافيا': '🌍',
  'علوم':    '🔬',
  'تاريخ':   '📜',
  'ثقافة':   '🎭',
  'موسيقى':  '🎵',
  'حيوانات': '🐾',
  'رياضة':   '⚽',
  'فنون':    '🎨',
};

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [CommonModule, CountdownTimerComponent],
  templateUrl: './category-select.component.html',
  styleUrls: ['./category-select.component.scss']
})
export class CategorySelectComponent {
  constructor(public game: GameService) {}

  getEmoji(cat: string): string {
    return CATEGORY_EMOJIS[cat] ?? '🎯';
  }

  select(category: string) {
    if (!this.game.isCategorySelector()) return;
    this.game.selectCategory(category);
  }
}
