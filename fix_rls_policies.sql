-- ============================================================================
-- FIX RLS POLICIES - Voeg WITH CHECK toe voor INSERT operaties
-- ============================================================================
-- Dit script lost het probleem op waarbij INSERT operaties worden geblokkeerd
-- door Row Level Security policies die alleen USING hebben maar geen WITH CHECK.
--
-- Voer dit script uit in de Supabase SQL Editor
-- ============================================================================

-- Stap 1: Drop alle bestaande policies eerst
DO $$ 
BEGIN
  -- ORGANIZATIONS
  DROP POLICY IF EXISTS "Users see only their own organization" ON organizations;
  
  -- PROFILES
  DROP POLICY IF EXISTS "Users see only their own organization profiles" ON profiles;
  
  -- FIXED ROUTES
  DROP POLICY IF EXISTS "Users manage only their own organization routes" ON fixed_routes;
  
  -- DRIVERS
  DROP POLICY IF EXISTS "Users manage only their own organization drivers" ON drivers;
  
  -- VEHICLES
  DROP POLICY IF EXISTS "Users manage only their own organization vehicles" ON vehicles;
  
  -- DEBTORS
  DROP POLICY IF EXISTS "Users manage only their own organization debtors" ON debtors;
  
  -- DRIVER SCHEDULES
  DROP POLICY IF EXISTS "Users manage only their own organization schedules" ON driver_schedules;
  
  -- FIXED ROUTE ASSIGNMENTS
  DROP POLICY IF EXISTS "Users manage only their own organization assignments" ON fixed_route_assignments;
  
  -- TIME RECORDS
  DROP POLICY IF EXISTS "Users manage only their own organization time records" ON time_records;
END $$;

-- Stap 2: Maak alle policies opnieuw aan met WITH CHECK

-- ORGANIZATIONS
CREATE POLICY "Users see only their own organization" ON organizations
  FOR ALL USING (id = get_user_organization_id())
  WITH CHECK (id = get_user_organization_id());

-- PROFILES
CREATE POLICY "Users see only their own organization profiles" ON profiles
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- FIXED ROUTES
CREATE POLICY "Users manage only their own organization routes" ON fixed_routes
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- DRIVERS
CREATE POLICY "Users manage only their own organization drivers" ON drivers
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- VEHICLES
CREATE POLICY "Users manage only their own organization vehicles" ON vehicles
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- DEBTORS
CREATE POLICY "Users manage only their own organization debtors" ON debtors
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- DRIVER SCHEDULES
CREATE POLICY "Users manage only their own organization schedules" ON driver_schedules
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- FIXED ROUTE ASSIGNMENTS
CREATE POLICY "Users manage only their own organization assignments" ON fixed_route_assignments
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- TIME RECORDS
CREATE POLICY "Users manage only their own organization time records" ON time_records
  FOR ALL USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());
