import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  OnChanges
} from '@angular/core';

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

  @Input() usedQuestionIds: number[] = [];

  @Input() isAnswerRevealScreen = false;
  @Input() answerRevealQuestion: Question | null = null;
  @Input() answerRevealCategoryName = '';

  @Input() readonlyMode = false;

  @Output() questionSelected = new EventEmitter<{
    question: Question;
    categoryName: string;
    categoryDescription?: string | null;
  }>();

  @Output() backToBoardClicked = new EventEmitter<void>();

  isBoardFading = false;
  isIntroScreen = false;

  private readonlyIntroQuestionId: number | null = null;
  private readonlyIntroTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedQuestion']) {
      if (!this.selectedQuestion) {
        this.isBoardFading = false;
        this.isIntroScreen = false;
        this.readonlyIntroQuestionId = null;

        if (this.readonlyIntroTimer) {
          clearTimeout(this.readonlyIntroTimer);
          this.readonlyIntroTimer = null;
        }

        this.cdr.markForCheck();
        return;
      }

      if (this.readonlyMode && !this.isAnswerRevealScreen) {
        const selectedQuestionId = this.selectedQuestion.id;

        const isNewReadonlyQuestion =
          this.readonlyIntroQuestionId !== selectedQuestionId;

        if (isNewReadonlyQuestion) {
          this.readonlyIntroQuestionId = selectedQuestionId;

          this.isBoardFading = false;
          this.isIntroScreen = true;

          if (this.readonlyIntroTimer) {
            clearTimeout(this.readonlyIntroTimer);
          }

          this.readonlyIntroTimer = setTimeout(() => {
            this.isIntroScreen = false;
            this.readonlyIntroTimer = null;
            this.cdr.markForCheck();
          }, 2000);
        }
      }

      this.cdr.markForCheck();
    }

    if (
      changes['isAnswerRevealScreen'] ||
      changes['answerRevealQuestion'] ||
      changes['usedQuestionIds']
    ) {
      if (this.isAnswerRevealScreen) {
        this.isIntroScreen = false;
        this.isBoardFading = false;
      }

      this.cdr.markForCheck();
    }
  }

  isQuestionUsed(questionId: number): boolean {
    return this.usedQuestionIds.includes(questionId);
  }

  selectQuestion(
    question: Question,
    categoryName: string,
    categoryDescription?: string | null
  ): void {
    if (this.readonlyMode) {
      return;
    }

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