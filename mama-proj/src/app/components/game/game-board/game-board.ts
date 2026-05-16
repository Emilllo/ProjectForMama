import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';
import { Question } from '../../../shared/models/question.models';
import { GamePlayRound } from '../../../shared/models/game-play.models';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.html',
  styleUrl: './game-board.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameBoard implements OnChanges {
  @Input() round: GamePlayRound | null = null;
  @Input() selectedQuestion: Question | null = null;
  @Input() selectedCategoryName = ''; 

  @Output() questionSelected = new EventEmitter<{
    question: Question;
    categoryName: string;
    categoryDescription?: string | null;
  }>();

  @Output() backToBoardClicked = new EventEmitter<void>();

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  isBoardFading = false;
  isIntroScreen = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedQuestion'] && !changes['selectedQuestion'].firstChange) {
      // Когда selectedQuestion меняется с родителя, сбрасываем флаги
      if (!this.selectedQuestion) {
        this.isBoardFading = false;
        this.isIntroScreen = false;
      }
    }
  }

  selectQuestion(
    question: Question,
    categoryName: string,
    categoryDescription?: string | null
  ): void {
    if (this.isBoardFading || this.isIntroScreen) {
      return;
    }

    this.isBoardFading = true;
    this.isIntroScreen = false;

    this.questionSelected.emit({
      question,
      categoryName,
      categoryDescription
    });

    this.cdr.markForCheck();

    setTimeout(() => {
      this.isBoardFading = false;
      this.isIntroScreen = true;
      this.cdr.markForCheck();

      setTimeout(() => {
        this.isIntroScreen = false;
        this.cdr.markForCheck();
      }, 2000);
    }, 500);
  }

  backToBoard(): void {
    this.isBoardFading = false;
    this.isIntroScreen = false;
    this.backToBoardClicked.emit();
    this.cdr.markForCheck();
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