export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}