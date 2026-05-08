export interface Question {
  id: number;
  question: string;
  points_per_question: number;
  image?: string | null;
  answer: string | null;
  category_id: number;
}

export interface CreateQuestionRequest {
  question: string;
  points_per_question: number;
  image?: string | null;
  answer: string | null;
  category_id: number;
}

export interface UpdateQuestionRequest {
  question: string;
  points_per_question: number;
  image?: string | null;
  answer: string | null;
  category_id: number;
}