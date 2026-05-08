import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join-room',
  imports: [],
  templateUrl: './join-room.html',
  styleUrl: './join-room.css',
})
export class JoinRoom {
  constructor(private router: Router) {}

  goToHome(): void {
    this.router.navigate(['/']);
  }

}
