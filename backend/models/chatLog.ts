export interface ChatLog {
  id: number;
  shop_id: number;
  session_id: string;
  user_message: string;
  assistant_answer: string;
  context_used: string | null;
  created_at: string;
}
