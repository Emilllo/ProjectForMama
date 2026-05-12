export interface Category {
  id: number;
  name: string;
  description?: string | null;
  round_id?: number | null;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface CategoryByRound {
  cat_id: number;
  cat_name: string;
  cat_desc?: string | null;
  round_id: number;
  game_id: number;
}