import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Category, CreateCategoryRequest } from '../models/category.models';
import { SetCategoryRoundResponse } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class CategoriesApiService {
  private readonly apiUrl = '/categories';

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, request);
  }

  updateCategory(id: number, request: CreateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, request);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  setCategoryRound(categoryId: number, roundId: number): Observable<SetCategoryRoundResponse> {
    return this.http.put<SetCategoryRoundResponse>(
      `${this.apiUrl}/${categoryId}/round`,
      { round_id: roundId }
    );
  }

  clearCategoryRound(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${categoryId}/round`);
  }
}