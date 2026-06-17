import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { GameBoard } from '../../game/game-board/game-board';

import { GameDetails } from '../../../shared/models/game.models';
import { Question } from '../../../shared/models/question.models';
import { GamePlayRound, GameSession, SessionPlayerInfo } from '../../../shared/models/game-play.models';

import { GamesApiService } from '../../../shared/services/games-api.service';
import { QuestionsApiService } from '../../../shared/services/questions-api.service';
import {
  SessionsApiService
} from '../../../shared/services/sessions-api.service';

@Component({
  selector: 'app-presenter-view',
  imports: [GameBoard],
  templateUrl: './presenter-view.html',
  styleUrl: './presenter-view.css',
})
export class PresenterView implements OnInit, OnDestroy {
  sessionId = 0;
  gameId = 0;
  roomCode = '------';

  currentSession: GameSession | null = null;
  connectedPlayers: SessionPlayerInfo[] = [];

  gameDetails: GameDetails[] = [];
  allQuestions: Question[] = [];

  currentRound: GamePlayRound | null = null;

  selectedQuestion: Question | null = null;
  selectedCategoryName = '';
  selectedCategoryDescription = '';

  usedQuestionIds: number[] = [];

  isAnswerRevealScreen = false;
  answerRevealQuestion: Question | null = null;
  answerRevealCategoryName = '';

  isLoading = true;
  errorMessage = '';

  wrongPlayerIds: number[] = [];

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private playersRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private lastActiveQuestionId: number | null = null;
  private lastBuzzingPlayerId: number | null = null;
  private isRevealTimerRunning = false;

  constructor(
    private route: ActivatedRoute,
    private sessionsApiService: SessionsApiService,
    private gamesApiService: GamesApiService,
    private questionsApiService: QuestionsApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.sessionId) {
      this.errorMessage = 'Session id is missing';
      this.isLoading = false;
      return;
    }

    this.loadInitialData();

    this.refreshTimer = setInterval(() => {
      this.loadSessionState();
    }, 1000);

    this.playersRefreshTimer = setInterval(() => {
      this.loadPlayers();
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.playersRefreshTimer) {
      clearInterval(this.playersRefreshTimer);
      this.playersRefreshTimer = null;
    }
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

  private loadInitialData(): void {
    this.sessionsApiService.getSession(this.sessionId).subscribe({
      next: session => {
        this.currentSession = session;
        this.gameId = session.game_id;
        this.roomCode = session.code;

        this.loadPlayers();
        this.loadQuestionsAndGame();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load session';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadQuestionsAndGame(): void {
    this.questionsApiService.getQuestions().subscribe({
      next: questions => {
        this.allQuestions = questions;

        this.gamesApiService.getGame(this.gameId).subscribe({
          next: details => {
            this.gameDetails = details;

            const roundIds = [...new Set(details.map(detail => detail.roundid))]
              .sort((a, b) => a - b);

            const firstRoundId = roundIds[0];

            if (!firstRoundId) {
              this.errorMessage = 'No round found';
              this.isLoading = false;
              this.cdr.detectChanges();
              return;
            }

            this.loadRound(firstRoundId);
          },
          error: error => {
            console.error(error);
            this.errorMessage = 'Failed to load game';
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load questions';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadRound(roundId: number): void {
    this.gamesApiService.getCategoriesByRound(this.gameId, roundId).subscribe({
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

        this.syncPresenterScreen();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load round';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadSessionState(): void {
    this.sessionsApiService.getSession(this.sessionId).subscribe({
      next: session => {
        const previousQuestionId = this.currentSession?.current_question_id || null;
        const previousQuestionStatus = this.currentSession?.question_status || '';
        const previousBuzzingPlayerId = this.currentSession?.buzzing_player_id || null;

        this.currentSession = session;
        this.roomCode = session.code;

        if (
          previousQuestionId !== null &&
          previousQuestionId === session.current_question_id &&
          previousQuestionStatus === 'buzzing' &&
          session.question_status === 'open' &&
          previousBuzzingPlayerId
        ) {
          if (!this.wrongPlayerIds.includes(previousBuzzingPlayerId)) {
            this.wrongPlayerIds = [...this.wrongPlayerIds, previousBuzzingPlayerId];
          }
        }

        this.handleClosedQuestion(previousQuestionId, session.current_question_id || null);
        this.syncPresenterScreen();
        this.loadPlayers();

        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
      }
    });
  }

  private loadPlayers(): void {
    this.sessionsApiService.getSessionPlayers(this.sessionId).subscribe({
      next: players => {
        this.connectedPlayers = players;
        this.cdr.markForCheck();
      },
      error: error => {
        console.error(error);
      }
    });
  }

  private syncPresenterScreen(): void {
    if (!this.currentSession || this.isAnswerRevealScreen) {
      return;
    }

    const questionId = this.currentSession.current_question_id || null;

    if (!questionId) {
      this.selectedQuestion = null;
      this.selectedCategoryName = '';
      this.selectedCategoryDescription = '';
      this.wrongPlayerIds = [];
      return;
    }

    if (questionId !== this.lastActiveQuestionId) {
      this.wrongPlayerIds = [];
    }

    const question = this.allQuestions.find(q => q.id === questionId);

    if (!question) {
      return;
    }

    this.selectedQuestion = question;
    this.lastActiveQuestionId = questionId;

    const category = this.currentRound?.categories.find(c =>
      c.questions.some(q => q.id === questionId)
    );

    this.selectedCategoryName = category?.name || '';
    this.selectedCategoryDescription = category?.description || '';
  }

  private handleClosedQuestion(previousQuestionId: number | null, currentQuestionId: number | null): void {
    if (!previousQuestionId || currentQuestionId || this.isRevealTimerRunning) {
      return;
    }

    const closedQuestion = this.allQuestions.find(q => q.id === previousQuestionId);

    if (!closedQuestion) {
      return;
    }

    const category = this.currentRound?.categories.find(c =>
      c.questions.some(q => q.id === previousQuestionId)
    );

    this.showAnswerReveal(closedQuestion, category?.name || '');
  }

  private showAnswerReveal(question: Question, categoryName: string): void {
    this.isRevealTimerRunning = true;

    if (!this.usedQuestionIds.includes(question.id)) {
      this.usedQuestionIds = [...this.usedQuestionIds, question.id];
    }

    this.answerRevealQuestion = question;
    this.answerRevealCategoryName = categoryName;
    this.isAnswerRevealScreen = true;
    this.wrongPlayerIds = [];

    this.selectedQuestion = question;
    this.selectedCategoryName = categoryName;

    this.cdr.detectChanges();

    setTimeout(() => {
      this.isAnswerRevealScreen = false;
      this.answerRevealQuestion = null;
      this.answerRevealCategoryName = '';

      this.selectedQuestion = null;
      this.selectedCategoryName = '';
      this.selectedCategoryDescription = '';

      this.isRevealTimerRunning = false;
      this.lastActiveQuestionId = null;

      this.cdr.detectChanges();
    }, 5000);
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

  get showLobby(): boolean {
    return this.currentSession?.status === 'waiting';
  }

  get showBuzzingInfo(): boolean {
    return this.currentSession?.question_status === 'buzzing';
  }
}