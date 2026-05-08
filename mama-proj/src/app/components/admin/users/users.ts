import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { User } from '../../../shared/models/user.models';
import { UsersApiService } from '../../../shared/services/users-api.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.html',
  styleUrl: './users.css'
})
export class Users implements OnInit {
  users: User[] = [];

  isLoading = false;
  errorMessage = '';

  constructor(
    private usersApiService: UsersApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.usersApiService.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getUserInitials(name: string): string {
    if (!name) {
      return '?';
    }

    return name
      .trim()
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}