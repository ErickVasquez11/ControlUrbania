/*
  # Sistema de Gestión de Carreras

  1. Nuevas Tablas
    - `providers` (Proveedores)
      - `id` (uuid, primary key)
      - `name` (text, nombre del proveedor)
      - `created_at` (timestamp)
    
    - `units` (Unidades)
      - `id` (uuid, primary key)
      - `name` (text, nombre/número de la unidad)
      - `created_at` (timestamp)
    
    - `rides` (Carreras)
      - `id` (uuid, primary key)
      - `date` (date, fecha de la carrera)
      - `provider_id` (uuid, foreign key a providers)
      - `unit_id` (uuid, foreign key a units)
      - `start_location` (text, punto de inicio)
      - `destination` (text, destino)
      - `payment_type` (text, Efectivo/Crédito/Transferencia)
      - `amount` (numeric, monto de la carrera)
      - `has_commission` (boolean, si tiene comisión)
      - `commission_amount` (numeric, monto de comisión si aplica)
      - `unit_requested_credit` (boolean, si la unidad solicitó crédito)
      - `provider_gave_credit` (boolean, si el proveedor dio crédito)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Permitir acceso público para esta aplicación interna
*/

CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  start_location text NOT NULL,
  destination text NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('Efectivo', 'Crédito', 'Transferencia')),
  amount numeric(10, 2) NOT NULL DEFAULT 0,
  has_commission boolean DEFAULT false,
  commission_amount numeric(10, 2) DEFAULT 0,
  unit_requested_credit boolean DEFAULT false,
  provider_gave_credit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to providers"
  ON providers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to providers"
  ON providers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to providers"
  ON providers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from providers"
  ON providers FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to units"
  ON units FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to units"
  ON units FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to units"
  ON units FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from units"
  ON units FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to rides"
  ON rides FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to rides"
  ON rides FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to rides"
  ON rides FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from rides"
  ON rides FOR DELETE
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_rides_date ON rides(date);
CREATE INDEX IF NOT EXISTS idx_rides_provider ON rides(provider_id);
CREATE INDEX IF NOT EXISTS idx_rides_unit ON rides(unit_id);