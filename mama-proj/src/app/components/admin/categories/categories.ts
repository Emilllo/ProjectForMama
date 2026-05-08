import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { Category, CreateCategoryRequest } from '../../../shared/models/category.models';
import { CategoriesApiService } from '../../../shared/services/categories-api.service';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements OnInit, OnDestroy {
  showCreateForm = false;

  categories: Category[] = [];

  name = '';
  description = '';

  editingCategoryId: number | null = null;
  editName = '';
  editDescription = '';

  isLoading = false;
  isSaving = false;
  isUpdating = false;
  deletingCategoryId: number | null = null;

  errorMessage = '';

  private routerSubscription?: Subscription;

  constructor(private categoriesApiService: CategoriesApiService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCategories();

    setTimeout(() => {
      this.routerSubscription = this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      ).subscribe((event) => {
        if (event.urlAfterRedirects.includes('/admin/dashboard/categories')) {
          setTimeout(() => this.loadCategories(), 0);
        }
      });
    }, 0);
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoriesApiService.getCategories().subscribe({
      next: categories => {
        this.categories = categories.sort((a, b) => a.id - b.id);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load categories';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
  }

  canCreateCategory(): boolean {
    return this.name.trim().length > 0 && !this.isSaving;
  }

  createCategory(): void {
    if (!this.canCreateCategory()) {
      return;
    }

    const request: CreateCategoryRequest = {
      name: this.name.trim(),
      description: this.description.trim()
    };

    this.isSaving = true;
    this.errorMessage = '';

    this.categoriesApiService.createCategory(request).subscribe({
      next: createdCategory => {
        this.categories = [...this.categories, createdCategory]
          .sort((a, b) => a.id - b.id);

        this.name = '';
        this.description = '';
        this.isSaving = false;
        this.showCreateForm = false;
        window.location.reload();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to create category';
        this.isSaving = false;
      }
    });
  }

  startEditCategory(category: Category): void {
    this.editingCategoryId = category.id;
    this.editName = category.name;
    this.editDescription = category.description || '';
  }

  cancelEditCategory(): void {
    this.editingCategoryId = null;
    this.editName = '';
    this.editDescription = '';
  }

  canUpdateCategory(): boolean {
    return this.editName.trim().length > 0 && !this.isUpdating;
  }

  updateCategory(id: number): void {
    if (!this.canUpdateCategory()) {
      return;
    }

    const request: CreateCategoryRequest = {
      name: this.editName.trim(),
      description: this.editDescription.trim()
    };

    this.isUpdating = true;
    this.errorMessage = '';

    this.categoriesApiService.updateCategory(id, request).subscribe({
      next: updatedCategory => {
        this.isUpdating = false;
        this.cancelEditCategory();
        window.location.reload();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to update category';
        this.isUpdating = false;
      }
    });
  }

  deleteCategory(id: number): void {
    this.deletingCategoryId = id;
    this.errorMessage = '';

    this.categoriesApiService.deleteCategory(id).subscribe({
      next: () => {
        this.deletingCategoryId = null;

        if (this.editingCategoryId === id) {
          this.cancelEditCategory();
        }

        window.location.reload();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to delete category';
        this.deletingCategoryId = null;
      }
    });
  }
}