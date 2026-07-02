import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SessionsApiService } from '../../../shared/services/sessions-api.service';
import { SessionRealtimeConnection, SessionRealtimeService } from '../../../shared/services/session-realtime.service';

import {
  GameSession,
  PlayerSessionState
} from '../../../shared/models/game-play.models';

@Component({
  selector: 'app-player-session',
  imports: [],
  templateUrl: './player-session.html',
  styleUrl: './player-session.css',
})
export class PlayerSession implements OnInit, OnDestroy {
  sessionId = 0;
  playerId = 0;
  playerName = 'Player';
  playerToken = '';

  score = 0;
  statusText = 'Ждите игру';

  currentSession: GameSession | null = null;
  playerState: PlayerSessionState | null = null;

  isBuzzing = false;
  errorMessage = '';

  private realtimeSocket: SessionRealtimeConnection | null = null;

  constructor(
    private route: ActivatedRoute,
    private sessionsApiService: SessionsApiService,
    private sessionRealtimeService: SessionRealtimeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));

    this.playerId = Number(localStorage.getItem('player_id') || 0);
    this.playerName = localStorage.getItem('player_name') || 'Player';
    this.playerToken = localStorage.getItem('player_token') || '';

    this.loadPlayerScreen();
    this.connectRealtime();
  }

  ngOnDestroy(): void {
    this.sessionRealtimeService.close(this.realtimeSocket);
    this.realtimeSocket = null;
  }

  get canBuzz(): boolean {
    return this.playerState?.can_buzz === true && !this.isBuzzing;
  }

  answer(): void {
    if (!this.canBuzz || !this.playerToken) {
      return;
    }

    this.isBuzzing = true;
    this.statusText = 'Отправляем ответ...';

    this.sessionsApiService.buzzIn(this.sessionId, this.playerToken).subscribe({
      next: () => {
        this.statusText = 'Вы нажали первым. Отвечайте!';
        this.loadPlayerScreen();
      },
      error: error => {
        console.error(error);
        this.statusText = 'Кто-то был быстрее';
        this.isBuzzing = false;
        this.cdr.detectChanges();
      }
    });
  }

  private connectRealtime(): void {
    if (this.realtimeSocket) {
      return;
    }

    this.realtimeSocket = this.sessionRealtimeService.connectToSession(
      this.sessionId,
      () => {
        this.loadPlayerScreen();
      }
    );
  }

  private loadPlayerScreen(): void {
    if (!this.sessionId || !this.playerToken) {
      return;
    }

    this.sessionsApiService.getSession(this.sessionId).subscribe({
      next: session => {
        this.currentSession = session;

        this.sessionsApiService.getPlayerSessionState(
          this.sessionId,
          this.playerToken
        ).subscribe({
          next: state => {
            this.playerState = state;
            this.score = state.score;

            this.updateStatusText();

            this.errorMessage = '';
            this.cdr.detectChanges();
          },
          error: error => {
            console.error(error);
            this.errorMessage = 'Не удалось загрузить состояние игрока';
            this.cdr.detectChanges();
          }
        });
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Не удалось загрузить сессию';
        this.cdr.detectChanges();
      }
    });
  }

  private updateStatusText(): void {
    if (!this.currentSession) {
      this.statusText = 'Загрузка...';
      return;
    }

    if (this.currentSession.status === 'waiting') {
      this.statusText = 'Ждите начала игры';
      this.isBuzzing = false;
      return;
    }

    if (this.currentSession.status === 'finished') {
      this.statusText = 'Игра завершена';
      this.isBuzzing = false;
      return;
    }

    if (this.playerState?.is_blocked_for_question) {
      this.statusText = 'Вы уже ответили неправильно. Ждите следующий вопрос.';
      this.isBuzzing = false;
      return;
    }

    if (this.currentSession.question_status === 'idle') {
      this.statusText = 'Ждите вопрос';
      this.isBuzzing = false;
      return;
    }

    if (this.currentSession.question_status === 'open') {
      if (this.playerState?.can_buzz) {
        this.statusText = 'Можно отвечать!';
      } else {
        this.statusText = 'Вы не можете отвечать на этот вопрос';
      }

      this.isBuzzing = false;
      return;
    }

    if (this.currentSession.question_status === 'buzzing') {
      if (this.currentSession.buzzing_player_id === this.playerId) {
        this.statusText = 'Вы отвечаете';
      } else {
        this.statusText = 'Другой игрок отвечает';
      }

      return;
    }

    this.statusText = 'Ждите';
  }
}