import { Question } from './question.models';

export interface GamePlayCategory {
  id: number;
  name: string;
  description?: string | null;
  questions: Question[];
}

export interface GamePlayRound {
  id: number;
  categories: GamePlayCategory[];
}