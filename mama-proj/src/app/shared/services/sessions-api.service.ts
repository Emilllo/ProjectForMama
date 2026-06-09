import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameSession, LeaderboardEntry, Player, SessionPlayer, SessionPlayerInfo } from '../models/game-play.models';

@Injectable({
  providedIn: 'root'
})
export class SessionsApiService {
  private readonly apiUrl = '/sessions';

  constructor(private http: HttpClient) {}
  createSession(gameId: number) {
    return this.http.post<GameSession>(
        `${this.apiUrl}`,
        {
        game_id: gameId
        }
    );
    }

    getSession(sessionId: number) {
    return this.http.get<GameSession>(
        `${this.apiUrl}/${sessionId}`
    );
    }

    startSession(sessionId: number) {
    return this.http.post<void>(
        `${this.apiUrl}/${sessionId}/start`,
        {}
    );
    }

    finishSession(sessionId: number) {
    return this.http.post<void>(
        `${this.apiUrl}/${sessionId}/finish`,
        {}
    );
    }

    getSessionPlayers(sessionId: number) {
    return this.http.get<SessionPlayerInfo[]>(
        `${this.apiUrl}/${sessionId}/players`
    );
    }

    getLeaderboard(sessionId: number) {
    return this.http.get<LeaderboardEntry[]>(
        `${this.apiUrl}/${sessionId}/leaderboard`
    );
    }

    setActiveQuestion(sessionId: number, questionId: number) {
    return this.http.post<void>(
        `${this.apiUrl}/${sessionId}/question`,
        {
        question_id: questionId
        }
    );
    }

    judgeAnswer(sessionId: number, correct: boolean) {
    return this.http.post<void>(
        `${this.apiUrl}/${sessionId}/judge`,
        {
        correct: correct
        }
    );
    }

    createPlayer(name: string) {
    return this.http.post<Player>(
        '/create-player',
        {
        name: name,
        scores: 0
        }
    );
    }

    joinSession(code: string, token: string) {
    return this.http.post<SessionPlayer>(
        '/sessions/join',
        {
        code: code,
        token: token
        }
    );
    }
}