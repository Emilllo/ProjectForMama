import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game, GameDetails } from '../models/game.models';
import { CategoryByRound } from '../models/category.models';

@Injectable({
  providedIn: 'root'
})
export class GamesApiService {
  private readonly apiUrl = '/games';

  constructor(private http: HttpClient) {}

  getGames(): Observable<GameDetails[]> {
    return this.http.get<GameDetails[]>(this.apiUrl);
  }

  getGame(id: number): Observable<GameDetails[]> {
    return this.http.get<GameDetails[]>(`${this.apiUrl}/${id}`);
  }

  getCategoriesByRound(gameId: number, roundId: number): Observable<CategoryByRound[]> {
    return this.http.get<CategoryByRound[]>(
      `${this.apiUrl}/${gameId}/rounds/${roundId}/categories`
    );
  }

  createGame(): Observable<Game> {
    return this.http.post<Game>(this.apiUrl, {});
  }

  deleteGame(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}