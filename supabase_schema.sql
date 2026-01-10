-- ============================================================================
-- TIMOFLEET SUPABASE SCHEMA
-- Volledig SQL-script voor Supabase PostgreSQL Database
-- ============================================================================

-- 1. ORGANISATIES (Multi-tenancy basis)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GEBRUIKERSPROFIELEN (Gekoppeld aan Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Beheerder', 'Gebruiker')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VASTE RITTEN (Routeprofielen)
CREATE TABLE IF NOT EXISTS fixed_routes (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  region TEXT,
  standard_start_time TIME NOT NULL,
  duration_hours NUMERIC NOT NULL,
  required_license TEXT NOT NULL CHECK (required_license IN ('B', 'BE', 'C')),
  requires_electric BOOLEAN DEFAULT FALSE,
  color TEXT,
  allowed_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  capacity_chilled INTEGER DEFAULT 0,
  capacity_frozen INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAUFFEURS
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  licenses TEXT[] DEFAULT '{}',
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}',
  is_active BOOLEAN DEFAULT TRUE,
  photo_url TEXT,
  known_route_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VOERTUIGEN
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  license_plate TEXT,
  brand TEXT,
  type TEXT CHECK (type IN ('VRACHTWAGEN', 'BESTELBUS')),
  license_required TEXT CHECK (license_required IN ('B', 'BE', 'C')),
  capacity_chilled INTEGER DEFAULT 0,
  capacity_frozen INTEGER DEFAULT 0,
  fuel_type TEXT CHECK (fuel_type IN ('Diesel', 'Elektrisch')),
  max_range_km INTEGER,
  consumption_per_100km NUMERIC,
  fuel_price_per_unit NUMERIC,
  co2_emission_per_km NUMERIC,
  is_available BOOLEAN DEFAULT TRUE,
  hourly_rate NUMERIC,
  monthly_fixed_cost NUMERIC,
  assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DEBITEUREN (Klanten/Afleveradressen)
CREATE TABLE IF NOT EXISTS debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHAUFFEURSROOSTER (Shifts/Ziekte/Verlof)
CREATE TABLE IF NOT EXISTS driver_schedules (
  id BIGSERIAL PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('WORK', 'SICK', 'VACATION', 'ROSTER_FREE', 'TRAINING')),
  start_time TIME,
  end_time TIME,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, date)
);

-- 8. VASTE RIT TOEWIJZINGEN (Wie rijdt welke route op welke dag)
CREATE TABLE IF NOT EXISTS fixed_route_assignments (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  route_id TEXT NOT NULL REFERENCES fixed_routes(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, date)
);

-- 9. PRESTATIES (Tijdregistratie voor analyse)
CREATE TABLE IF NOT EXISTS time_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  route_id TEXT NOT NULL REFERENCES fixed_routes(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  remarks TEXT,
  exclude_from_analysis BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Helper function om organization_id van huidige gebruiker op te halen
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS op alle tabellen
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_route_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS: Gebruikers kunnen alleen hun eigen organisatie zien
CREATE POLICY "Users see only their own organization" ON organizations
  FOR ALL USING (id = get_user_organization_id())
  WITH CHECK (id = get_user_organization_id());

-- PROFILES: Gebruikers kunnen alleen profielen van hun eigen organisatie zien
CREATE POLICY "Users see only their own organization profiles" ON profiles
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- FIXED ROUTES: Gebruikers kunnen alleen routes van hun eigen organisatie zien/bewerken
CREATE POLICY "Users manage only their own organization routes" ON fixed_routes
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- DRIVERS: Gebruikers kunnen alleen chauffeurs van hun eigen organisatie zien/bewerken
CREATE POLICY "Users manage only their own organization drivers" ON drivers
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- VEHICLES: Gebruikers kunnen alleen voertuigen van hun eigen organisatie zien/bewerken
CREATE POLICY "Users manage only their own organization vehicles" ON vehicles
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- DEBTORS: Gebruikers kunnen alleen debiteuren van hun eigen organisatie zien/bewerken
CREATE POLICY "Users manage only their own organization debtors" ON debtors
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- DRIVER SCHEDULES: Gebruikers kunnen alleen roosters van hun eigen organisatie zien/bewerken
CREATE POLICY "Users manage only their own organization schedules" ON driver_schedules
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- FIXED ROUTE ASSIGNMENTS: Gebruikers kunnen alleen toewijzingen van hun eigen organisatie zien/bewerken
CREATE POLICY "Users manage only their own organization assignments" ON fixed_route_assignments
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- TIME RECORDS: Gebruikers kunnen alleen tijdregistraties van hun eigen organisatie zien/bewerken
CREATE POLICY "Users manage only their own organization time records" ON time_records
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- ============================================================================
-- INDEXES voor betere query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_fixed_routes_organization_id ON fixed_routes(organization_id);
CREATE INDEX IF NOT EXISTS idx_drivers_organization_id ON drivers(organization_id);
CREATE INDEX IF NOT EXISTS idx_drivers_is_active ON drivers(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_organization_id ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_driver_id ON vehicles(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_debtors_organization_id ON debtors(organization_id);
CREATE INDEX IF NOT EXISTS idx_debtors_fixed_route_id ON debtors(fixed_route_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_organization_id ON driver_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_driver_id ON driver_schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_date ON driver_schedules(date);
CREATE INDEX IF NOT EXISTS idx_fixed_route_assignments_organization_id ON fixed_route_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_fixed_route_assignments_route_id ON fixed_route_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_fixed_route_assignments_driver_id ON fixed_route_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_fixed_route_assignments_date ON fixed_route_assignments(date);
CREATE INDEX IF NOT EXISTS idx_time_records_organization_id ON time_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_records_driver_id ON time_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_time_records_route_id ON time_records(route_id);
CREATE INDEX IF NOT EXISTS idx_time_records_date ON time_records(date);

-- ============================================================================
-- TRIGGERS voor updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_routes_updated_at BEFORE UPDATE ON fixed_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debtors_updated_at BEFORE UPDATE ON debtors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_records_updated_at BEFORE UPDATE ON time_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- OPTIONELE TRIGGER: Automatisch profile aanmaken bij nieuwe auth user
-- (Uncomment indien gewenst)
-- ============================================================================

-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, email, name, organization_id, role)
--   VALUES (
--     NEW.id,
--     COALESCE(NEW.email, ''),
--     COALESCE(NEW.raw_user_meta_data->>'name', 'Nieuwe Gebruiker'),
--     NULL, -- Moet handmatig worden ingesteld door admin
--     'Gebruiker'
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- 
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
