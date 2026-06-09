import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-player-session',
  imports: [],
  templateUrl: './player-session.html',
  styleUrl: './player-session.css',
})
export class PlayerSession implements OnInit {
  playerName = 'Player';
  score = 0;
  statusText = 'Ждите вопрос';

  ngOnInit(): void {
    this.playerName = localStorage.getItem('player_name') || 'Player';

    const savedScore = localStorage.getItem('player_score');
    this.score = savedScore ? Number(savedScore) : 0;
  }

  answer(): void {
    this.statusText = 'Кнопка пока не подключена';
  }
}