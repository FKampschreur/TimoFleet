-- ============================================================================
-- EENVOUDIGE VOORBEELD DATA VOOR TIMOFLEET SUPABASE DATABASE
-- Voer dit script uit in de Supabase SQL Editor
-- 
-- BELANGRIJK: Vervang 'YOUR_ORGANIZATION_ID' door de UUID van jouw organisatie
-- Je kunt deze vinden door: SELECT organization_id FROM profiles WHERE id = auth.uid();
-- Of gebruik de UUID van een bestaande organisatie uit de organizations tabel
-- ============================================================================

-- Vervang deze UUID door jouw eigen organization_id
-- OF gebruik de onderstaande regel om automatisch de organization_id op te halen:
DO $$
DECLARE
    org_id UUID;
BEGIN
    -- Probeer eerst de organization_id van de ingelogde gebruiker op te halen
    SELECT organization_id INTO org_id
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1;
    
    -- Als er geen ingelogde gebruiker is, gebruik dan jouw organization_id
    IF org_id IS NULL THEN
        org_id := '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID;
    END IF;

    -- ============================================================================
    -- 1. CHAUFFEUR (Jan de Vries)
    -- ============================================================================
    INSERT INTO drivers (
        id,
        organization_id,
        name,
        email,
        phone,
        licenses,
        working_days,
        is_active,
        known_route_ids
    ) VALUES (
        gen_random_uuid(),
        org_id,
    'Jan de Vries',
    'jan.devries@timofleet.nl',
    '06-12345678',
    ARRAY['C', 'BE']::TEXT[],
    ARRAY[1, 2, 3, 4, 5]::INTEGER[],  -- Maandag t/m Vrijdag
    true,
    ARRAY[]::TEXT[]
    )
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================================
    -- 2. VASTE ROUTE (Route Amsterdam Centrum)
    -- ============================================================================
    INSERT INTO fixed_routes (
        id,
        organization_id,
        name,
        region,
        standard_start_time,
        duration_hours,
        required_license,
        requires_electric,
        color,
        allowed_days,
        capacity_chilled,
        capacity_frozen
    ) VALUES (
        'RT-AMSTERDAM-01',
        org_id,
    'Route Amsterdam Centrum',
    'Amsterdam',
    '06:00:00',
    9.0,
    'C',
    false,
    'bg-emerald-500',
    ARRAY[1, 2, 3, 4, 5]::INTEGER[],  -- Maandag t/m Vrijdag
    28,
    8
    )
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================================
    -- 3. VRACHTWAGEN (Mercedes VH-001)
    -- ============================================================================
    INSERT INTO vehicles (
        id,
        organization_id,
        license_plate,
        brand,
        type,
        license_required,
        capacity_chilled,
        capacity_frozen,
        fuel_type,
        max_range_km,
        consumption_per_100km,
        fuel_price_per_unit,
        co2_emission_per_km,
        is_available,
        hourly_rate,
        monthly_fixed_cost,
        assigned_driver_id
    ) VALUES (
        'VH-001',
        org_id,
    '98-BRL-9',
    'Mercedes',
    'VRACHTWAGEN',
    'C',
    28,
    8,
    'Diesel',
    1000,
    26.11,
    1.40,
    700,
    true,
    35.00,
    3820.00,
    NULL  -- Optioneel: koppel later aan chauffeur
    )
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================================
    -- 4. DEBITEUR (Jumbo Supermarkt)
    -- ============================================================================
    INSERT INTO debtors (
        id,
        organization_id,
        debtor_number,
        foundation_name,
        name,
        address,
        postcode,
        city,
        container_location,
        delivery_days,
        time_window_start,
        time_window_end,
        drop_time_minutes,
        containers_chilled,
        containers_frozen,
        fixed_route_id
    ) VALUES (
        gen_random_uuid(),
        org_id,
    '1001',
    'Stichting Jumbo Groep',
    'Jumbo Supermarkt Centrum',
    'Kalverstraat 123',
    '1012 PA',
    'Amsterdam',
    'Achterzijde, laden/lossen zone A',
    ARRAY[1, 3, 5]::INTEGER[],  -- Maandag, Woensdag, Vrijdag
    '07:00:00',
    '10:00:00',
    25,
    12,
    4,
    'RT-AMSTERDAM-01'
    )
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================================
    -- OPTIONEEL: Koppel de chauffeur aan de route en vrachtwagen
    -- ============================================================================

    -- Update chauffeur: voeg route toe aan known_route_ids
    UPDATE drivers
    SET known_route_ids = ARRAY['RT-AMSTERDAM-01']::TEXT[]
    WHERE name = 'Jan de Vries'
      AND organization_id = org_id;

    -- Update vrachtwagen: koppel aan chauffeur
    UPDATE vehicles
    SET assigned_driver_id = (
        SELECT id FROM drivers 
        WHERE name = 'Jan de Vries' 
          AND organization_id = org_id
        LIMIT 1
    )
    WHERE id = 'VH-001'
      AND organization_id = org_id;

END $$;

-- ============================================================================
-- VERIFICATIE: Bekijk de ingevoerde data
-- ============================================================================
-- Vervang de UUID hieronder door jouw organization_id als je niet ingelogd bent
SELECT 
    'Chauffeurs' as type, 
    name, 
    email, 
    phone 
FROM drivers 
WHERE organization_id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
)
UNION ALL
SELECT 
    'Routes', 
    name, 
    region, 
    standard_start_time::text 
FROM fixed_routes 
WHERE organization_id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
)
UNION ALL
SELECT 
    'Voertuigen', 
    license_plate, 
    brand, 
    type 
FROM vehicles 
WHERE organization_id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
)
UNION ALL
SELECT 
    'Debiteuren', 
    name, 
    city, 
    address 
FROM debtors 
WHERE organization_id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
);
