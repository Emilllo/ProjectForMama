import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

import { GameDetails } from '../../../shared/models/game.models';
import { Question } from '../../../shared/models/question.models';
import { GamePlayRound, GameSession, SessionPlayerInfo } from '../../../shared/models/game-play.models';

import { GamesApiService } from '../../../shared/services/games-api.service';
import { QuestionsApiService } from '../../../shared/services/questions-api.service';

import { GameBoard } from '../../game/game-board/game-board';
import { SessionsApiService } from '../../../shared/services/sessions-api.service';
import { SessionRealtimeConnection, SessionRealtimeService } from '../../../shared/services/session-realtime.service';

@Component({
  selector: 'app-game-view',
  imports: [GameBoard],
  templateUrl: './game-view.html',
  styleUrl: './game-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameView implements OnInit, OnDestroy  {
  private routeSubscription: Subscription | null = null;

  connectedPlayers: SessionPlayerInfo[] = [];

  currentSession: GameSession | null = null;

  private realtimeSocket: SessionRealtimeConnection | null = null;

  gameId: number = 0;
  sessionId: number | null = null;
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

  usedQuestionIds: number[] = [];

  isAnswerRevealScreen = false;
  answerRevealQuestion: Question | null = null;
  answerRevealCategoryName = '';

  wrongPlayerIds: number[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gamesApiService: GamesApiService,
    private sessionsApiService: SessionsApiService,
    private sessionRealtimeService: SessionRealtimeService,
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

    this.route.queryParamMap.subscribe(queryParams => {
      const sessionIdFromRoute = queryParams.get('sessionId');
      const codeFromRoute = queryParams.get('code');

      if (sessionIdFromRoute) {
        this.sessionId = Number(sessionIdFromRoute);

        this.loadSessionState();
        this.connectRealtime();
      }

      if (codeFromRoute) {
        this.roomCode = codeFromRoute;
      }
    });
  }

  private connectRealtime(): void {
    if (!this.sessionId || this.realtimeSocket) {
      return;
    }

    this.realtimeSocket = this.sessionRealtimeService.connectToSession(
      this.sessionId,
      () => {
        this.loadSessionState();
      }
    );
  }

  isWrongPlayer(playerId: number): boolean {
    const questionIsPlaying =
      this.currentSession?.status === 'active' &&
      (
        this.currentSession?.question_status === 'open' ||
        this.currentSession?.question_status === 'buzzing'
      );

    return questionIsPlaying && this.wrongPlayerIds.includes(playerId);
  }

  private revealAnswerAndReturnToBoard(question: Question, categoryName: string): void {
    if (!this.usedQuestionIds.includes(question.id)) {
      this.usedQuestionIds = [...this.usedQuestionIds, question.id];
    }

    this.answerRevealQuestion = question;
    this.answerRevealCategoryName = categoryName;
    this.isAnswerRevealScreen = true;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.isAnswerRevealScreen = false;
      this.answerRevealQuestion = null;
      this.answerRevealCategoryName = '';

      this.wrongPlayerIds = [];

      this.clearSelectedQuestion();
      this.loadSessionState();

      this.moveToNextRoundIfNeeded();

      this.cdr.detectChanges();
    }, 5000);
  }

  loadGame(): void {
    const gameId = this.gameId;

    this.gamesApiService.getGame(this.gameId).subscribe({
      next: details => {
        this.gameDetails = details;

        this.roundIds = this.getRoundIds(details);
        this.currentRoundIndex = 0;

        const firstRoundId = this.roundIds[this.currentRoundIndex];

        if (!firstRoundId) {
          this.errorMessage = 'No rounds found';
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        this.loadRound(gameId, firstRoundId);
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

  startSession(): void {
    if (!this.sessionId) {
      this.errorMessage = 'Session id is missing';
      return;
    }

    this.sessionsApiService.startSession(this.sessionId).subscribe({
      next: () => {
        this.adminMessage = 'Game started';
        this.loadSessionState();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to start session';
        this.cdr.detectChanges();
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
    if (!this.sessionId) {
      this.errorMessage = 'Session id is missing';
      return;
    }

    if (this.currentSession?.status !== 'active') {
      this.errorMessage = 'Start the game first';
      return;
    }

    this.wrongPlayerIds = [];

    this.selectedQuestion = event.question;
    this.selectedCategoryName = event.categoryName;
    this.selectedCategoryDescription = event.categoryDescription || '';
    this.adminMessage = '';

    this.sessionsApiService.setActiveQuestion(
      this.sessionId,
      event.question.id
    ).subscribe({
      next: () => {
        this.adminMessage = 'Question is open for answers';
        this.loadSessionState();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to open question';
        this.cdr.detectChanges();
      }
    });
  }

  backToBoard(): void {
    this.wrongPlayerIds = [];
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
    if (!this.sessionId || !this.selectedQuestion) {
      return;
    }

    const question = this.selectedQuestion;
    const categoryName = this.selectedCategoryName;

    this.sessionsApiService.judgeAnswer(this.sessionId, true).subscribe({
      next: () => {
        this.adminMessage = `Correct answer. +${question.points_per_question} points.`;
        this.revealAnswerAndReturnToBoard(question, categoryName);
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to mark answer as correct';
        this.cdr.detectChanges();
      }
    });
  }

  markWrong(): void {
    if (!this.sessionId || !this.selectedQuestion) {
      return;
    }

    const question = this.selectedQuestion;
    const categoryName = this.selectedCategoryName;
    const wrongPlayerId = this.currentSession?.buzzing_player_id;

    this.sessionsApiService.judgeAnswer(this.sessionId, false).subscribe({
      next: () => {
        if (wrongPlayerId && !this.wrongPlayerIds.includes(wrongPlayerId)) {
          this.wrongPlayerIds = [...this.wrongPlayerIds, wrongPlayerId];
        }

        this.sessionsApiService.getSession(this.sessionId!).subscribe({
          next: session => {
            this.currentSession = session;

            const questionIsClosed =
              session.question_status === 'idle' &&
              !session.current_question_id;

            if (questionIsClosed) {
              this.adminMessage = 'All players answered wrong. Showing correct answer.';
              this.revealAnswerAndReturnToBoard(question, categoryName);
            } else {
              this.adminMessage = 'Wrong answer. Question is open again.';
              this.loadSessionState();
            }

            this.cdr.detectChanges();
          },
          error: error => {
            console.error(error);
            this.errorMessage = 'Failed to reload session after wrong answer';
            this.cdr.detectChanges();
          }
        });
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to mark answer as wrong';
        this.cdr.detectChanges();
      }
    });
  }

  finishGame(): void {
    if (!this.sessionId) {
      this.errorMessage = 'Session id is missing';
      return;
    }

    this.sessionsApiService.finishSession(this.sessionId).subscribe({
      next: () => {
        this.currentSession = {
          ...(this.currentSession as GameSession),
          status: 'finished',
          question_status: 'idle',
          current_question_id: null,
          buzzing_player_id: null
        };

        this.router.navigate(['/admin/dashboard/games']);
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to finish game session';
        this.cdr.detectChanges();
      }
    });
  }

  loadConnectedPlayers(): void {
    if (!this.sessionId) {
      return;
    }

    this.sessionsApiService.getSessionPlayers(this.sessionId).subscribe({
      next: players => {
        this.connectedPlayers = players;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load connected players';
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }

    this.sessionRealtimeService.close(this.realtimeSocket);
    this.realtimeSocket = null;
  }

  loadSessionState(): void {
    if (!this.sessionId) {
      return;
    }

    this.sessionsApiService.getSession(this.sessionId).subscribe({
      next: session => {
        this.currentSession = session;

        this.sessionsApiService.getSessionPlayers(this.sessionId!).subscribe({
          next: players => {
            this.connectedPlayers = players;
            this.cdr.detectChanges();
          },
          error: error => {
            console.error(error);
            this.cdr.detectChanges();
          }
        });
      },
      error: error => {
        console.error(error);
        this.cdr.detectChanges();
      }
    });
  }

  private getCurrentRoundQuestionIds(): number[] {
    if (!this.currentRound) {
      return [];
    }

    return this.currentRound.categories
      .flatMap(category => category.questions)
      .map(question => question.id);
  }

  private isCurrentRoundFinished(): boolean {
    const currentRoundQuestionIds = this.getCurrentRoundQuestionIds();

    if (currentRoundQuestionIds.length === 0) {
      return false;
    }

    return currentRoundQuestionIds.every(questionId =>
      this.usedQuestionIds.includes(questionId)
    );
  }

  private moveToNextRoundIfNeeded(): void {
    if (!this.isCurrentRoundFinished()) {
      return;
    }

    const nextRoundIndex = this.currentRoundIndex + 1;

    if (nextRoundIndex >= this.roundIds.length) {
      this.adminMessage = 'All rounds completed.';
      return;
    }

    this.currentRoundIndex = nextRoundIndex;

    const nextRoundId = this.roundIds[this.currentRoundIndex];

    this.adminMessage = `Round ${this.currentRoundIndex + 1} started.`;

    this.currentRound = null;
    this.clearSelectedQuestion();

    this.loadRound(this.gameId, nextRoundId);

    this.cdr.detectChanges();
  }

  get buzzingPlayerName(): string {
    if (!this.currentSession?.buzzing_player_id) {
      return '';
    }

    const player = this.connectedPlayers.find(
      p => p.player_id === this.currentSession?.buzzing_player_id
    );

    return player?.player_name || `Player #${this.currentSession.buzzing_player_id}`;
  }
}