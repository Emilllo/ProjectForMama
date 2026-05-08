import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Question } from '../../../shared/models/question.models';
import { Category } from '../../../shared/models/category.models';

import { QuestionsApiService } from '../../../shared/services/questions-api.service';
import { CategoriesApiService } from '../../../shared/services/categories-api.service';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.html',
  styleUrl: './questions.css'
})
export class Questions implements OnInit, OnDestroy {
  questions: Question[] = [];
  categories: Category[] = [];

  isLoading = false;
  deletingQuestionId: number | null = null;

  errorMessage = '';

  private routerSubscription?: Subscription;

  constructor(
    private questionsApiService: QuestionsApiService,
    private categoriesApiService: CategoriesApiService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
    this.loadCategories();

    setTimeout(() => {
      this.routerSubscription = this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      ).subscribe((event) => {
        if (event.urlAfterRedirects.includes('/admin/dashboard/questions')) {
          setTimeout(() => {
            this.loadQuestions();
            this.loadCategories();
          }, 0);
        }
      });
    }, 0);
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.questionsApiService.getQuestions().subscribe({
      next: questions => {
        this.questions = questions.sort((a, b) => a.id - b.id);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load questions';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories(): void {
    this.categoriesApiService.getCategories().subscribe({
      next: categories => {
        this.categories = categories;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(category => category.id === categoryId);

    if (!category) {
      return `Category #${categoryId}`;
    }

    return category.name;
  }

  goToCreateQuestion(): void {
    this.router.navigate(['/admin/dashboard/questions/create']);
  }

  goToEditQuestion(id: number): void {
    this.router.navigate(['/admin/dashboard/questions', id, 'edit']);
  }

  deleteQuestion(id: number): void {
    this.deletingQuestionId = id;
    this.errorMessage = '';

    this.questionsApiService.deleteQuestion(id).subscribe({
      next: () => {
        this.questions = this.questions.filter(question => question.id !== id);
        this.deletingQuestionId = null;
        window.location.reload();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to delete question';
        this.deletingQuestionId = null;
      }
    });
  }
}