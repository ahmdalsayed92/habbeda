// components/lobby/lobby.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss']
})
export class LobbyComponent implements OnInit {
  copied = signal(false);

  constructor(
    public game: GameService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // If no roomId in service, try to get it from URL (direct link)
    const urlRoomId = this.route.snapshot.paramMap.get('id');
    if (!this.game.roomId() && urlRoomId) {
      this.router.navigate(['/room', urlRoomId]);
    }
  }

  get shareLink() {
    return `${window.location.origin}/room/${this.game.roomId()}`;
  }

  copyLink() {
    navigator.clipboard.writeText(this.shareLink).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  startGame() {
    if (this.game.players().length < 2) return;
    this.game.startGame();
  }

  canStart = computed(() => this.game.isHost() && this.game.players().filter(p => p.connected).length >= 2);
}
