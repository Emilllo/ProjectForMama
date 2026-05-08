import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest
} from '../models/question.models';

@Injectable({
  providedIn: 'root'
})
export class QuestionsApiService {
  private readonly apiUrl = '/questions';

  constructor(private http: HttpClient) {}

  getQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl);
  }

  createQuestion(request: CreateQuestionRequest): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, request);
  }

  updateQuestion(id: number, request: UpdateQuestionRequest): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${id}`, request);
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}