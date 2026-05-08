import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateRoundRequest, Round } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class RoundsApiService {
  private readonly apiUrl = '/rounds';

  constructor(private http: HttpClient) {}

  createRound(request: CreateRoundRequest): Observable<Round> {
    return this.http.post<Round>(this.apiUrl, request);
  }

  deleteRound(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}