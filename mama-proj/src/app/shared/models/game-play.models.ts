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

export interface GameSession {
  id: number;
  game_id: number;
  code: string;
  status: string;
  current_question_id?: number | null;
  buzzing_player_id?: number | null;
  question_status: string;
  created_at: string;
}

export interface SessionPlayerInfo {
  player_id: number;
  player_name: string;
  score: number;
  joined_at: string;
}

export interface LeaderboardEntry {
  player_id: number;
  player_name: string;
  score: number;
}

export interface Player {
  id: number;
  name: string;
  scores: number;
  token: string;
  is_blocked: boolean;
  created_at?: string | null;
}

export interface SessionPlayer {
  id: number;
  session_id: number;
  player_id: number;
  score: number;
  joined_at: string;
}