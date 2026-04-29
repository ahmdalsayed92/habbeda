// components/home/home.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GameService } from '../../services/game.service';

const AVATARS = ['🦊','🐼','🦁','🐸','🐧','🦄','🐯','🐻','🦋','🐙',
                 '🦀','🐬','🦖','🐲','🦅','🦉','🐝','🦔','🐺','🎃'];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  avatars = AVATARS;
  name = signal('');
  selectedAvatar = signal('🦊');
  joinCode = signal('');
  tab = signal<'create' | 'join'>('create');
  loading = signal(false);
  error = signal('');

  particles = Array.from({ length: 12 }, (_, i) => ({
    width: `${Math.random() * 20 + 6}px`,
    height: `${Math.random() * 20 + 6}px`,
    left: `${Math.random() * 100}%`,
    background: ['#4d96ff','#ff6b6b','#ffd93d','#6bcb77','#c77dff'][i % 5],
    'animation-duration': `${Math.random() * 10 + 8}s`,
    'animation-delay': `${Math.random() * 8}s`,
  }));

  constructor(
    private game: GameService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const roomId = this.route.snapshot.paramMap.get('id');
    if (roomId) {
      this.joinCode.set(roomId);
      this.tab.set('join');
    }
  }

  selectAvatar(a: string) { this.selectedAvatar.set(a); }

  async createRoom() {
    if (!this.name().trim()) { this.error.set('Please enter your name'); return; }
    this.loading.set(true);
    this.error.set('');
    try {
      const roomId = await this.game.createRoom(this.name().trim(), this.selectedAvatar());
      this.router.navigate(['/lobby', roomId]);
    } catch (e: any) {
      this.error.set(e.message || 'Failed to create room');
    } finally {
      this.loading.set(false);
    }
  }

  async joinRoom() {
    if (!this.name().trim()) { this.error.set('Please enter your name'); return; }
    if (!this.joinCode().trim()) { this.error.set('Please enter a room code'); return; }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.game.joinRoom(this.joinCode().trim().toUpperCase(), this.name().trim(), this.selectedAvatar());
      this.router.navigate(['/lobby', this.joinCode().trim().toUpperCase()]);
    } catch (e: any) {
      this.error.set(e.message || 'Failed to join room');
    } finally {
      this.loading.set(false);
    }
  }
}
