import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Category } from '../../../../shared/models/category.models';
import { UpdateQuestionRequest } from '../../../../shared/models/question.models';

import { CategoriesApiService } from '../../../../shared/services/categories-api.service';
import { QuestionsApiService } from '../../../../shared/services/questions-api.service';

@Component({
  selector: 'app-question-edit',
  imports: [FormsModule],
  templateUrl: './question-edit.html',
  styleUrl: './question-edit.css'
})
export class QuestionEdit implements OnInit {
  questionId: number | null = null;

  categories: Category[] = [];

  categoryId: number | null = null;
  question = '';
  answer = '';
  image = '';
  pointsPerQuestion = 500;

  isLoadingCategories = false;
  isLoadingQuestion = false;
  isSaving = false;
  errorMessage = '';

  constructor(
    private categoriesApiService: CategoriesApiService,
    private questionsApiService: QuestionsApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idFromRoute = this.activatedRoute.snapshot.paramMap.get('id');

    if (!idFromRoute) {
      this.errorMessage = 'Question id is missing';
      return;
    }

    const parsedId = Number(idFromRoute);

    if (Number.isNaN(parsedId)) {
      this.errorMessage = 'Invalid question id';
      return;
    }

    this.questionId = parsedId;

    this.loadCategories();
    this.loadQuestion();
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

  loadQuestion(): void {
    if (this.questionId === null) {
      return;
    }

    this.isLoadingQuestion = true;
    this.errorMessage = '';

    this.questionsApiService.getQuestions().subscribe({
      next: questions => {
        const existingQuestion = questions.find(question => question.id === this.questionId);

        if (!existingQuestion) {
          this.errorMessage = 'Question not found';
          this.isLoadingQuestion = false;
          this.cdr.detectChanges();
          return;
        }

        this.question = existingQuestion.question;
        this.pointsPerQuestion = existingQuestion.points_per_question;
        this.image = existingQuestion.image || '';
        this.answer = existingQuestion.answer || '';
        this.categoryId = existingQuestion.category_id;

        this.isLoadingQuestion = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load question';
        this.isLoadingQuestion = false;
        this.cdr.detectChanges();
      }
    });
  }

  canSaveQuestion(): boolean {
    return this.questionId !== null &&
      this.categoryId !== null &&
      this.question.trim().length > 0 &&
      this.answer.trim().length > 0 &&
      this.pointsPerQuestion > 0 &&
      !this.isSaving;
  }

  saveQuestion(): void {
    if (!this.canSaveQuestion() || this.questionId === null || this.categoryId === null) {
      return;
    }

    const request: UpdateQuestionRequest = {
      question: this.question.trim(),
      points_per_question: this.pointsPerQuestion,
      image: this.image.trim() ? this.image.trim() : null,
      answer: this.answer.trim(),
      category_id: this.categoryId
    };

    this.isSaving = true;
    this.errorMessage = '';

    this.questionsApiService.updateQuestion(this.questionId, request).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/admin/dashboard/questions']);
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to update question';
        this.isSaving = false;
        this.cdr.detectChanges();
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