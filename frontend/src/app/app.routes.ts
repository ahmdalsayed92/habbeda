// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { GameContainerComponent } from './components/game-container/game-container.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'room/:id', component: HomeComponent },          // join via link
  { path: 'lobby/:id', component: LobbyComponent },
  { path: 'game/:id',  component: GameContainerComponent },
  { path: '**', redirectTo: '' }
];
