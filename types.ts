import { Session, User } from '@supabase/supabase-js';

export interface Client {
  id: string;
  name: string;
  gross_daily_rate: number;
  user_id: string;
  created_at: string;
}

export interface WorkDay {
  id: string;
  date: string;
  client_id: string;
  user_id: string;
  created_at: string;
  clients: Client; // Supabase can join tables
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export enum AppView {
  Dashboard = 'Dashboard',
  Clients = 'Clienti',
  Revenue = 'Fatturato',
}