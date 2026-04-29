// game-container.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { CategorySelectComponent } from '../category-select/category-select.component';
import { QuestionComponent } from '../question/question.component';
import { VotingComponent } from '../voting/voting.component';
import { ResultsComponent } from '../results/results.component';
import { LeaderboardComponent } from '../leaderboard/leaderboard.component';

@Component({
  selector: 'app-game-container',
  standalone: true,
  imports: [
    CommonModule,
    CategorySelectComponent,
    QuestionComponent,
    VotingComponent,
    ResultsComponent,
    LeaderboardComponent,
  ],
  templateUrl: './game-container.component.html',
  styleUrls: ['./game-container.component.scss']
})
export class GameContainerComponent implements OnInit {
  constructor(public game: GameService, private router: Router) {}

  ngOnInit() {
    if (!this.game.roomId()) this.router.navigate(['/']);
  }

  goHome() {
    this.game.reset();
    this.router.navigate(['/']);
  }
}
