import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Category } from '../../../shared/models/category.models';
import {
  Game,
  GameDetails,
  GameDraftRound,
  GameTreeItem,
  SavedGameView
} from '../../../shared/models/game.models';

import { CategoriesApiService } from '../../../shared/services/categories-api.service';
import { GamesApiService } from '../../../shared/services/games-api.service';
import { RoundsApiService } from '../../../shared/services/rounds-api.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.html',
  styleUrl: './games.css'
})
export class Games implements OnInit {
  categories: Category[] = [];

  showCreateForm = false;
  draftRounds: GameDraftRound[] = [];
  savedGame: SavedGameView | null = null;

  isLoadingCategories = false;
  isSaving = false;
  errorMessage = '';

  gameDetails: GameDetails[] = [];
  gamesTree: GameTreeItem[] = [];
  isLoadingGames = false;
  deletingGameId: number | null = null;

  private nextRoundTempId = 1;

  constructor(
    private categoriesApiService: CategoriesApiService,
    private gamesApiService: GamesApiService,
    private roundsApiService: RoundsApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadGames();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.errorMessage = '';

    this.categoriesApiService.getCategories().subscribe({
      next: categories => {
        this.categories = categories.sort((a, b) => a.id - b.id);
        this.isLoadingCategories = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load categories';
        this.isLoadingCategories = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadGames(): void {
    this.isLoadingGames = true;
    this.errorMessage = '';

    this.gamesApiService.getGames().subscribe({
      next: details => {
        this.gameDetails = details;
        this.gamesTree = this.buildGamesTree(details);
        this.isLoadingGames = false;
        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to load games';
        this.isLoadingGames = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildGamesTree(details: GameDetails[]): GameTreeItem[] {
    const gamesMap = new Map<number, GameTreeItem>();

    for (const item of details) {
      let game = gamesMap.get(item.gameid);

      if (!game) {
        game = {
          id: item.gameid,
          rounds: []
        };
        gamesMap.set(item.gameid, game);
      }

      let round = game.rounds.find(r => r.id === item.roundid);

      if (!round) {
        round = {
          id: item.roundid,
          categories: []
        };
        game.rounds.push(round);
      }

      round.categories.push({
        id: item.categoryID,
        name: item.categoryName,
        description: item.catDescription || null
      });
    }

    return Array.from(gamesMap.values())
      .sort((a, b) => a.id - b.id)
      .map(game => ({
        ...game,
        rounds: game.rounds
          .sort((a, b) => a.id - b.id)
          .map(round => ({
            ...round,
            categories: round.categories.sort((a, b) => a.id - b.id)
          }))
      }));
  }

  startCreateGame(): void {
    this.showCreateForm = true;
    this.savedGame = null;
    this.draftRounds = [];
    this.nextRoundTempId = 1;

    this.addRound();
  }

  addRound(): void {
    this.draftRounds.push({
      tempId: this.nextRoundTempId,
      selectedCategoryIds: []
    });

    this.nextRoundTempId++;
  }

  isCategorySelected(round: GameDraftRound, categoryId: number): boolean {
    return round.selectedCategoryIds.includes(categoryId);
  }

  isCategoryDisabled(categoryId: number, currentRoundIndex: number): boolean {
    return this.draftRounds.some((round, index) =>
      index !== currentRoundIndex &&
      round.selectedCategoryIds.includes(categoryId)
    );
  }

  toggleCategorySelection(round: GameDraftRound, categoryId: number): void {
    if (round.selectedCategoryIds.includes(categoryId)) {
      round.selectedCategoryIds = round.selectedCategoryIds.filter(id => id !== categoryId);
      return;
    }

    round.selectedCategoryIds = [...round.selectedCategoryIds, categoryId];
  }

  canSaveGame(): boolean {
    return this.draftRounds.length > 0 &&
      this.draftRounds.every(round => round.selectedCategoryIds.length > 0) &&
      !this.isSaving;
  }

  deleteGame(id: number): void {
    this.deletingGameId = id;
    this.errorMessage = '';

    this.gamesApiService.deleteGame(id).subscribe({
      next: () => {
        this.gamesTree = this.gamesTree.filter(game => game.id !== id);
        this.deletingGameId = null;

        if (this.savedGame?.id === id) {
          this.savedGame = null;
        }

        this.cdr.detectChanges();
      },
      error: error => {
        console.error(error);
        this.errorMessage = 'Failed to delete game';
        this.deletingGameId = null;
        this.cdr.detectChanges();
      }
    });
  }

  cancelCreateGame(): void {
    this.showCreateForm = false;
    this.draftRounds = [];
    this.errorMessage = '';
    this.nextRoundTempId = 1;
  }

  async saveGame(): Promise<void> {
    if (!this.canSaveGame()) {
      this.errorMessage = 'Each round must have at least one category';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    try {
      const game = await firstValueFrom(this.gamesApiService.createGame());

      const savedGame: SavedGameView = {
        id: game.id,
        rounds: []
      };

      for (const draftRound of this.draftRounds) {
        const round = await firstValueFrom(
          this.roundsApiService.createRound({
            game_id: game.id
          })
        );

        const selectedCategories = this.categories
          .filter(category => draftRound.selectedCategoryIds.includes(category.id))
          .map(category => ({
            ...category,
            round_id: round.id
          }));

        console.log('Created round:', round);
        console.log('Selected categories for round:', selectedCategories);

        for (const category of selectedCategories) {
          console.log('Created round:', round);
          console.log('Set category round:', {
            categoryId: category.id,
            roundId: round.id
          });

          await firstValueFrom(
            this.categoriesApiService.setCategoryRound(category.id, round.id)
          );
        }

        savedGame.rounds.push({
          id: round.id,
          categories: selectedCategories
        });
      }

      this.savedGame = savedGame;
      this.showCreateForm = false;
      this.isSaving = false;

      this.loadCategories();
      this.loadGames();
    } catch (error) {
      console.error(error);
      this.errorMessage = 'Failed to save game';
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}