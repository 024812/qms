import type { CardItem } from '@/modules/cards/schema';

export interface CardSettings {
  azureOpenAIApiKey: string;
  azureOpenAIEndpoint: string;
  azureOpenAIDeployment: string;
  ebayAppId: string;
  ebayCertId: string;
  ebayDevId: string;
  rapidApiKey: string;
  tavilyApiKey: string;
}

export interface UpdateCardSettingsInput {
  azureOpenAIApiKey?: string;
  azureOpenAIEndpoint?: string;
  azureOpenAIDeployment?: string;
  ebayAppId?: string;
  ebayCertId?: string;
  ebayDevId?: string;
  rapidApiKey?: string;
  tavilyApiKey?: string;
}

export interface GetCardsActionInput {
  search?: string;
  filter?: {
    sport?: 'BASKETBALL' | 'SOCCER' | 'OTHER';
    gradingCompany?: 'UNGRADED' | 'PSA' | 'BGS' | 'SGC' | 'CGC';
    status?: 'COLLECTION' | 'FOR_SALE' | 'SOLD' | 'GRADING' | 'DISPLAY';
  };
  includeSold?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GetCardsActionResult {
  items: CardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
