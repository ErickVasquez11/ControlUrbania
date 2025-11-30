import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL="https://uzdxoibnuwdasevnpska.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY="sb_publishable_xDnWa_2be2K-k9payh-TXQ_X1CqTEXt";

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
