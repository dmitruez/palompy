import { LeadCaptureData } from './chatLead';

export interface ChatLogMetadata {
  pageUrl?: string;
  pageTitle?: string;
}

export interface ChatLog {
  id: number;
  shop_id: number;
  session_id: string;
  user_message: string;
  assistant_answer: string;
  context_used: string | null;
  metadata: ChatLogMetadata | null;
  collected_profile: LeadCaptureData | null;
  created_at: string;
}
