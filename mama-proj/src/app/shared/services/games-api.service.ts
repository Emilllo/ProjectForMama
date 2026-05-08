import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Game, GameDetails } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class GamesApiService {
  private readonly apiUrl = '/games';

  constructor(private http: HttpClient) {}

  getGames(): Observable<GameDetails[]> {
    return this.http.get<GameDetails[]>(this.apiUrl);
  }

  createGame(): Observable<Game> {
    return this.http.post<Game>(this.apiUrl, {});
  }

  deleteGame(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}