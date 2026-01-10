-- ============================================================================
-- ALTERNATIEVE FIX RLS POLICIES - Update alleen policies die nog geen WITH CHECK hebben
-- ============================================================================
-- Dit script gebruikt een andere aanpak: het dropt en hercreëert alleen policies
-- die nog niet de juiste definitie hebben.
--
-- Gebruik dit script als het hoofdscript niet werkt
-- ============================================================================

-- Functie om een policy te vervangen als deze al bestaat
DO $$ 
DECLARE
  policy_exists BOOLEAN;
BEGIN
  -- ORGANIZATIONS
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'organizations' 
    AND policyname = 'Users see only their own organization'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users see only their own organization" ON organizations;
  END IF;
  
  CREATE POLICY "Users see only their own organization" ON organizations
    FOR ALL USING (id = get_user_organization_id())
    WITH CHECK (id = get_user_organization_id());

  -- PROFILES
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users see only their own organization profiles'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users see only their own organization profiles" ON profiles;
  END IF;
  
  CREATE POLICY "Users see only their own organization profiles" ON profiles
    FOR ALL USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

  -- FIXED ROUTES
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'fixed_routes' 
    AND policyname = 'Users manage only their own organization routes'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users manage only their own organization routes" ON fixed_routes;
  END IF;
  
  CREATE POLICY "Users manage only their own organization routes" ON fixed_routes
    FOR ALL USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

  -- DRIVERS
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'drivers' 
    AND policyname = 'Users manage only their own organization drivers'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users manage only their own organization drivers" ON drivers;
  END IF;
  
  CREATE POLICY "Users manage only their own organization drivers" ON drivers
    FOR ALL USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

  -- VEHICLES
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'vehicles' 
    AND policyname = 'Users manage only their own organization vehicles'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users manage only their own organization vehicles" ON vehicles;
  END IF;
  
  CREATE POLICY "Users manage only their own organization vehicles" ON vehicles
    FOR ALL USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

  -- DEBTORS
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'debtors' 
    AND policyname = 'Users manage only their own organization debtors'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users manage only their own organization debtors" ON debtors;
  END IF;
  
  CREATE POLICY "Users manage only their own organization debtors" ON debtors
    FOR ALL USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

  -- DRIVER SCHEDULES
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'driver_schedules' 
    AND policyname = 'Users manage only their own organization schedules'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users manage only their own organization schedules" ON driver_schedules;
  END IF;
  
  CREATE POLICY "Users manage only their own organization schedules" ON driver_schedules
    FOR ALL USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

  -- FIXED ROUTE ASSIGNMENTS
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'fixed_route_assignments' 
    AND policyname = 'Users manage only their own organization assignments'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users manage only their own organization assignments" ON fixed_route_assignments;
  END IF;
  
  CREATE POLICY "Users manage only their own organization assignments" ON fixed_route_assignments
    FOR ALL USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

  -- TIME RECORDS
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'time_records' 
    AND policyname = 'Users manage only their own organization time records'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    DROP POLICY "Users manage only their own organization time records" ON time_records;
  END IF;
  
  CREATE POLICY "Users manage only their own organization time records" ON time_records
    FOR ALL USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());
END $$;
