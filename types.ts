
export type ImageSize = '1K' | '2K' | '4K';
export type Language = 'en' | 'pt';

export interface CampaignMetrics {
  openRate: number;
  clickThroughRate: number;
  totalSent: number;
  delivered: number;
}

export interface CampaignContent {
  subject: string;
  headline: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  visualPrompt: string;
}

export interface Campaign {
  id: string;
  timestamp: number;
  content: CampaignContent;
  imageUrl?: string;
  language: Language;
  templateId?: string;
  metrics?: CampaignMetrics;
  scheduledAt?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Template {
  id: string;
  name: { en: string; pt: string };
  icon: string;
  basePrompt: { en: string; pt: string };
  description: { en: string; pt: string };
}
