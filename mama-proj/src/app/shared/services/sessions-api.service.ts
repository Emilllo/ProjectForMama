import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameSession, LeaderboardEntry, Player, PlayerSessionState, SessionPlayer, SessionPlayerInfo } from '../models/game-play.models';

@Injectable({
  providedIn: 'root'
})
export class SessionsApiService {
  constructor(private http: HttpClient) {}

  createPlayer(name: string) {
    return this.http.post<Player>('/create-player', {
      name,
      scores: 0
    });
  }

  createSession(gameId: number) {
    return this.http.post<GameSession>('/sessions', {
      game_id: gameId
    });
  }

  getSession(sessionId: number) {
    return this.http.get<GameSession>(`/sessions/${sessionId}`);
  }

  joinSession(code: string, token: string) {
    return this.http.post<SessionPlayer>('/sessions/join', {
      code,
      token
    });
  }

  getSessionPlayers(sessionId: number) {
    return this.http.get<SessionPlayerInfo[]>(
      `/sessions/${sessionId}/players`
    );
  }

  startSession(sessionId: number) {
    return this.http.post<void>(
      `/sessions/${sessionId}/start`,
      {}
    );
  }

  finishSession(sessionId: number) {
    return this.http.post<void>(
      `/sessions/${sessionId}/finish`,
      {}
    );
  }

  setActiveQuestion(sessionId: number, questionId: number) {
    return this.http.post<void>(
      `/sessions/${sessionId}/question`,
      {
        question_id: questionId
      }
    );
  }

  buzzIn(sessionId: number, token: string) {
    return this.http.post<void>(
      `/sessions/${sessionId}/buzz`,
      {
        token
      }
    );
  }

  judgeAnswer(sessionId: number, correct: boolean) {
    return this.http.post<void>(
      `/sessions/${sessionId}/judge`,
      {
        correct
      }
    );
  }

  getPlayerSessionState(sessionId: number, token: string) {
    return this.http.get<PlayerSessionState>(
      `/sessions/${sessionId}/player-state?token=${token}`
    );
  }

  getSessionByCode(code: string) {
    return this.http.get<GameSession>(
      `/session-by-code/${code}`
    );
  }
}