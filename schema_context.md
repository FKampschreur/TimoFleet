-- 1. ORGANISATIES (Multi-tenancy basis)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GEBRUIKERSPROFIELEN (Gekoppeld aan Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Beheerder', 'Gebruiker')),
  photo_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VASTE RITTEN (Routeprofielen)
CREATE TABLE fixed_routes (
  id TEXT PRIMARY KEY, -- Bijv 'RT-01'
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT,
  standard_start_time TIME NOT NULL,
  duration_hours NUMERIC NOT NULL,
  required_license TEXT NOT NULL,
  requires_electric BOOLEAN DEFAULT FALSE,
  color TEXT,
  allowed_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAUFFEURS
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  licenses TEXT[] DEFAULT '{}',
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  is_active BOOLEAN DEFAULT TRUE,
  photo_url TEXT,
  known_route_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VOERTUIGEN
CREATE TABLE vehicles (
  id TEXT PRIMARY KEY, -- Intern ID
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  license_plate TEXT,
  brand TEXT,
  type TEXT CHECK (type IN ('VRACHTWAGEN', 'BESTELBUS')),
  license_required TEXT,
  capacity_chilled INTEGER DEFAULT 0,
  capacity_frozen INTEGER DEFAULT 0,
  fuel_type TEXT,
  max_range_km INTEGER,
  consumption_per_100km NUMERIC,
  fuel_price_per_unit NUMERIC,
  co2_emission_per_km INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  hourly_rate NUMERIC,
  monthly_fixed_cost NUMERIC,
  assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DEBITEUREN (Klanten/Afleveradressen)
CREATE TABLE debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  debtor_number TEXT,
  foundation_name TEXT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  city TEXT NOT NULL,
  container_location TEXT,
  delivery_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  time_window_start TIME NOT NULL,
  time_window_end TIME NOT NULL,
  drop_time_minutes INTEGER DEFAULT 15,
  containers_chilled INTEGER DEFAULT 0,
  containers_frozen INTEGER DEFAULT 0,
  fixed_route_id TEXT REFERENCES fixed_routes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHAUFFEURSROOSTER (Shifts/Ziekte/Verlof)
CREATE TABLE driver_schedules (
  id BIGSERIAL PRIMARY KEY,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('WORK', 'SICK', 'VACATION', 'ROSTER_FREE', 'TRAINING')),
  start_time TIME,
  end_time TIME,
  label TEXT,
  UNIQUE(driver_id, date)
);

-- 8. VASTE RIT TOEWIJZINGEN (Wie rijdt welke route op welke dag)
CREATE TABLE fixed_route_assignments (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  route_id TEXT REFERENCES fixed_routes(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  UNIQUE(route_id, date)
);

-- 9. PRESTATIES (Tijdregistratie voor analyse)
CREATE TABLE time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  route_id TEXT REFERENCES fixed_routes(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  remarks TEXT,
  exclude_from_analysis BOOLEAN DEFAULT FALSE
);

-- RLS (Row Level Security) - Basis beleid
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see only their own organization" ON profiles
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Herhaal dit beleid voor alle overige tabellen...

-- ============================================================================
-- ONTWERPBESLISSINGEN & AANTEKENINGEN
-- ============================================================================

-- ENUMS
-- In PostgreSQL gebruik ik TEXT met CHECK constraints (zie role of type).
-- Dit is makkelijker te onderhouden dan echte PostgreSQL Enums bij migraties.
-- Voorbeelden:
--   - profiles.role: CHECK (role IN ('Beheerder', 'Gebruiker'))
--   - vehicles.type: CHECK (type IN ('VRACHTWAGEN', 'BESTELBUS'))
--   - driver_schedules.type: CHECK (type IN ('WORK', 'SICK', 'VACATION', 'ROSTER_FREE', 'TRAINING'))

-- POSTCODE/STAD & GEOGRAFISCHE COÖRDINATEN
-- Postcode en stad staan in de debtors tabel (postcode, city).
-- Voor optimale planning is het handig om bij import direct de Lat/Lng op te slaan
-- (die de Gemini AI nu nog on-the-fly 'schat' of baseert op bekende data).
-- Overweging voor toekomstige uitbreiding:
--   ALTER TABLE debtors ADD COLUMN latitude NUMERIC;
--   ALTER TABLE debtors ADD COLUMN longitude NUMERIC;

-- MULTI-TENANCY: organization_id
-- Ik heb organization_id toegevoegd aan elke tabel. Dit is cruciaal.
-- Zonder dit veld kun je nooit opschalen naar meerdere klanten (bedrijven)
-- op hetzelfde platform. Alle queries moeten gefilterd worden op organization_id
-- om data-isolatie tussen organisaties te garanderen.

-- DATABASE TRIGGERS
-- In een volgende fase kun je een trigger toevoegen die automatisch een profile
-- aanmaakt zodra een nieuwe gebruiker zich registreert in Supabase Auth.
-- Voorbeeld:
--   CREATE OR REPLACE FUNCTION public.handle_new_user()
--   RETURNS TRIGGER AS $$
--   BEGIN
--     INSERT INTO public.profiles (id, email, name, organization_id, role)
--     VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', NULL, 'Gebruiker');
--     RETURN NEW;
--   END;
--   $$ LANGUAGE plpgsql SECURITY DEFINER;
--   
--   CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
