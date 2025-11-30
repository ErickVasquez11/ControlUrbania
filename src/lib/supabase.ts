import { createClient } from '@supabase/supabase-js';

// 1. Solo LEEMOS las variables. No pongas el valor real aquí (ni comillas, ni el link).
// Vercel se encarga de rellenar esto automáticamente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Validación de seguridad (opcional pero recomendada)
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Tus interfaces están perfectas, déjalas igual ---
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