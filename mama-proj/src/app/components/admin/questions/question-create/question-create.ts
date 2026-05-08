import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Category } from '../../../../shared/models/category.models';
import { CreateQuestionRequest } from '../../../../shared/models/question.models';
import { CategoriesApiService } from '../../../../shared/services/categories-api.service';
import { QuestionsApiService } from '../../../../shared/services/questions-api.service';

@Component({
  selector: 'app-question-create',
  imports: [FormsModule],
  templateUrl: './question-create.html',
  styleUrl: './question-create.css'
})
export class QuestionCreate implements OnInit {
  categories: Category[] = [];

  categoryId: number | null = null;
  question = '';
  answer = '';
  image = '';
  pointsPerQuestion = 500;

  isLoadingCategories = false;
  isSaving = false;
  errorMessage = '';

  constructor(
    private categoriesApiService: CategoriesApiService,
    private questionsApiService: QuestionsApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.errorMessage = '';

    this.categoriesApiService.getCategories().subscribe({
      next: categories => {
        this.categories = categories.sort((a, b) => a.name.localeCompare(b.name));
        this.isLoadingCategories = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load categories';
        this.isLoadingCategories = false;
        this.cdr.detectChanges();
      }
    });
  }

  canSaveQuestion(): boolean {
    return this.categoryId !== null &&
      this.question.trim().length > 0 &&
      this.answer.trim().length > 0 &&
      this.pointsPerQuestion > 0 &&
      !this.isSaving;
  }

  saveQuestion(): void {
    if (!this.canSaveQuestion() || this.categoryId === null) {
      return;
    }

    const request: CreateQuestionRequest = {
      question: this.question.trim(),
      points_per_question: this.pointsPerQuestion,
      image: this.image.trim() ? this.image.trim() : null,
      answer: this.answer.trim(),
      category_id: this.categoryId
    };

    this.isSaving = true;
    this.errorMessage = '';

    this.questionsApiService.createQuestion(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/admin/dashboard/questions']);
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to create question';
        this.isSaving = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard/questions']);
  }

  getSelectedCategoryName(): string {
    const category = this.categories.find(category => category.id === this.categoryId);
    return category?.name || 'Category';
  }
}