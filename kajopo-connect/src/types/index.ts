// Core types for Kájọpọ̀ platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'seeker' | 'provider';
  profileImage?: string;
  bio?: string;
  location?: string;
  skills: string[];
  interests: CategoryType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: CategoryType;
  subcategory: string;
  providerId: string;
  provider: User;
  requirements: string[];
  benefits: string[];
  location?: string;
  isRemote: boolean;
  deadline?: Date;
  maxParticipants?: number;
  currentParticipants: number;
  status: 'active' | 'closed' | 'draft';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  seekerId: string;
  providerId: string;
  opportunityId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  matchScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  matchId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export type CategoryType = 
  | 'education'
  | 'health'
  | 'social-impact'
  | 'economic-empowerment'
  | 'housing-infrastructure'
  | 'food-agriculture'
  | 'arts-culture'
  | 'digital-access'
  | 'climate-environment'
  | 'justice-governance'
  | 'mental-wellness';

export interface Category {
  id: CategoryType;
  name: string;
  description: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
}