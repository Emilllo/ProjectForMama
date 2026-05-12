import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Question } from '../../../shared/models/question.models';
import { GamePlayRound } from '../../../shared/models/game-play.models';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.html',
  styleUrl: './game-board.css'
})
export class GameBoard {
  @Input() round: GamePlayRound | null = null;
  @Input() selectedQuestion: Question | null = null;
  @Input() selectedCategoryName = '';

  @Output() questionSelected = new EventEmitter<{
    question: Question;
    categoryName: string;
    categoryDescription?: string | null;
  }>();

  @Output() backToBoardClicked = new EventEmitter<void>();

  selectQuestion(
    question: Question,
    categoryName: string,
    categoryDescription?: string | null
  ): void {
    this.questionSelected.emit({
      question,
      categoryName,
      categoryDescription
    });
  }

  backToBoard(): void {
    this.backToBoardClicked.emit();
  }

  getCategoryColorClass(categoryId: number): string {
    if (!this.round) {
      return 'category-color-0';
    }

    const categoryIndex = this.round.categories.findIndex(
      category => category.id === categoryId
    );

    return `category-color-${categoryIndex % 6}`;
  }

  get questionsColumnCount(): number {
    if (!this.round) {
      return 5;
    }

    const maxQuestionsCount = Math.max(
      0,
      ...this.round.categories.map(category => category.questions.length)
    );

    return Math.max(5, maxQuestionsCount);
  }
}