import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL="https://uzdxoibnuwdasevnpska.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZHhvaWJudXdkYXNldm5wc2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTAwMTQsImV4cCI6MjA3ODY4NjAxNH0.7j0c8WzjHrZ0t0qHZI1uURclXiC3bhpWFGdfcwEYew8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Provider {
  id: string;
  name: string;
  created_at: string;
}

export interface Unit {
  id: string;
  name: string;
  created_at: string;
}

export interface Ride {
  id: string;
  date: string;
  provider_id: string;
  unit_id: string;
  start_location: string;
  destination: string;
  payment_type: 'Efectivo' | 'Crédito' | 'Transferencia';
  amount: number;
  has_commission: boolean;
  commission_amount: number;
  unit_requested_credit: boolean;
  provider_gave_credit: boolean;
  created_at: string;
}

export interface RideWithDetails extends Ride {
  provider?: Provider;
  unit?: Unit;
}
