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