import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

import { GameDetails } from '../../../shared/models/game.models';
import { Question } from '../../../shared/models/question.models';
import { GamePlayRound } from '../../../shared/models/game-play.models';

import { GamesApiService } from '../../../shared/services/games-api.service';
import { QuestionsApiService } from '../../../shared/services/questions-api.service';

import { GameBoard } from '../../game/game-board/game-board';

@Component({
  selector: 'app-game-view',
  imports: [GameBoard],
  templateUrl: './game-view.html',
  styleUrl: './game-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameView implements OnInit {
  private routeSubscription: Subscription | null = null;

  gameId: number = 0;
  roomCode = '----';

  gameDetails: GameDetails[] = [];
  allQuestions: Question[] = [];

  roundIds: number[] = [];
  currentRoundIndex = 0;
  currentRound: GamePlayRound | null = null;

  selectedQuestion: Question | null = null;
  selectedCategoryName = '';
  selectedCategoryDescription = '';

  isLoading = true;
  errorMessage = '';
  adminMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gamesApiService: GamesApiService,
    private cdr: ChangeDetectorRef,
    private questionsApiService: QuestionsApiService
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idFromRoute = params.get('id');

      if (!idFromRoute) {
        this.errorMessage = 'Game id is missing';
        return;
      }

      const parsedId = Number(idFromRoute);

      if (Number.isNaN(parsedId)) {
        this.errorMessage = 'Invalid game id';
        return;
      }

      this.gameId = parsedId;
      this.roomCode = `G-${parsedId}`;
      this.currentRound = null;
      this.clearSelectedQuestion();
      this.loadGame();
    });
  }

  loadGame(): void {
    const gameId = this.gameId;

    this.gamesApiService.getGame(this.gameId).subscribe({
      next: details => {
        this.gameDetails = details;
        this.currentRoundIndex = this.gameDetails.sort((a, b) => a.roundid - b.roundid)[0]?.roundid;
        this.loadRound(gameId, this.currentRoundIndex);
        this.cdr.markForCheck();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load games';
        this.cdr.markForCheck();
      }
    });
  }

  private getRoundIds(gameDetails: GameDetails[]): number[] {
    return [...new Set(gameDetails.map(detail => detail.roundid))]
      .sort((a, b) => a - b);
  }

  loadRound(gameId: number, roundId: number): void {
    this.errorMessage = '';

    this.questionsApiService.getQuestions().subscribe({
      next: questions => {
        this.allQuestions = questions;

        this.gamesApiService.getCategoriesByRound(gameId, roundId).subscribe({
          next: categories => {
            this.currentRound = {
              id: roundId,
              categories: categories.map(category => {
                const categoryQuestions = this.allQuestions
                  .filter(question => question.category_id === category.cat_id)
                  .sort((a, b) => a.points_per_question - b.points_per_question);

                return {
                  id: category.cat_id,
                  name: category.cat_name,
                  description: category.cat_desc || null,
                  questions: categoryQuestions
                };
              })
            };

            this.clearSelectedQuestion();
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: error => {
            console.error(error);
            this.errorMessage = 'Failed to load round categories';
            this.cdr.markForCheck();
          }
        });
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load questions';
        this.cdr.markForCheck();
      }
    });
  }

  canGoToPreviousRound(): boolean {
    return this.currentRoundIndex > 0;
  }

  canGoToNextRound(): boolean {
    return this.currentRoundIndex < this.roundIds.length - 1;
  }

  onQuestionSelected(event: {
    question: Question;
    categoryName: string;
    categoryDescription?: string | null;
  }): void {
    this.selectedQuestion = event.question;
    this.selectedCategoryName = event.categoryName;
    this.selectedCategoryDescription = event.categoryDescription || '';
    this.adminMessage = '';
    this.cdr.markForCheck();
  }

  backToBoard(): void {
    this.clearSelectedQuestion();
    this.cdr.markForCheck();
  }

  private clearSelectedQuestion(): void {
    this.selectedQuestion = null;
    this.selectedCategoryName = '';
    this.selectedCategoryDescription = '';
    this.adminMessage = '';
  }

  goBackToGames(): void {
    this.router.navigate(['/admin/dashboard/games']);
  }

  markCorrect(): void {
    if (!this.selectedQuestion) {
      return;
    }

    this.adminMessage = `Correct answer. +${this.selectedQuestion.points_per_question} points.`;
    console.log('Correct:', this.selectedQuestion);
  }

  markWrong(): void {
    if (!this.selectedQuestion) {
      return;
    }

    this.adminMessage = `Wrong answer. -${this.selectedQuestion.points_per_question} points.`;
    console.log('Wrong:', this.selectedQuestion);
  }
}