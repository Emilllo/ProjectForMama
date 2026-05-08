export interface Game {
  id: number;
}

export interface GameDetails {
  gameid: number;
  roundid: number;
  categoryID: number;
  categoryName: string;
  catDescription?: string | null;
}

export interface GameCategoryTreeItem {
  id: number;
  name: string;
  description?: string | null;
}

export interface GameRoundTreeItem {
  id: number;
  categories: GameCategoryTreeItem[];
}

export interface GameTreeItem {
  id: number;
  rounds: GameRoundTreeItem[];
}

export interface Round {
  id: number;
  game_id: number | null;
}

export interface CreateRoundRequest {
  game_id: number;
}

export interface SetCategoryRoundResponse {
  id: number;
  round_id: number;
}

export interface GameDraftRound {
  tempId: number;
  selectedCategoryIds: number[];
}

export interface SavedGameRound {
  id: number;
  categories: {
    id: number;
    name: string;
    description?: string | null;
    round_id?: number | null;
  }[];
}

export interface SavedGameView {
  id: number;
  rounds: SavedGameRound[];
}