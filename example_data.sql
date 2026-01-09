-- ============================================================================
-- VOORBEELD DATA VOOR TIMOFLEET SUPABASE DATABASE
-- Voer dit script uit in de Supabase SQL Editor
-- ============================================================================
-- 
-- BELANGRIJK: Dit script gebruikt de organization_id van de ingelogde gebruiker
-- Zorg dat je eerst ingelogd bent in Supabase voordat je dit script uitvoert
-- ============================================================================

-- Stap 1: Haal de organization_id op van de ingelogde gebruiker
-- (Dit werkt alleen als je ingelogd bent via Supabase Auth)
DO $$
DECLARE
    v_org_id UUID;
    v_driver_id UUID;
BEGIN
    -- Haal organization_id op van de ingelogde gebruiker
    SELECT organization_id INTO v_org_id
    FROM profiles
    WHERE id = auth.uid()
    LIMIT 1;

    -- Als er geen organization_id is gevonden, gebruik dan de opgegeven organization_id
    IF v_org_id IS NULL THEN
        v_org_id := '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID;
    END IF;

    -- Stap 2: Voeg een chauffeur toe
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
        v_org_id,
        'Jan de Vries',
        'jan.devries@timofleet.nl',
        '06-12345678',
        ARRAY['C', 'BE']::TEXT[],
        ARRAY[1, 2, 3, 4, 5]::INTEGER[],
        true,
        ARRAY[]::TEXT[]
    )
    RETURNING id INTO v_driver_id;

    -- Stap 3: Voeg een vaste route toe
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
        v_org_id,
        'Route Amsterdam Centrum',
        'Amsterdam',
        '06:00:00',
        9.0,
        'C',
        false,
        'bg-emerald-500',
        ARRAY[1, 2, 3, 4, 5]::INTEGER[],
        28,
        8
    )
    ON CONFLICT (id) DO NOTHING;

    -- Stap 4: Voeg een vrachtwagen toe en koppel deze aan de chauffeur
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
        v_org_id,
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
        v_driver_id  -- Automatisch gekoppeld aan de chauffeur
    )
    ON CONFLICT (id) DO NOTHING;

    -- Stap 5: Voeg een debiteur toe
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
        v_org_id,
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

    -- Stap 6: Update de chauffeur om de route te kennen
    UPDATE drivers
    SET known_route_ids = ARRAY['RT-AMSTERDAM-01']::TEXT[]
    WHERE id = v_driver_id;

END $$;

-- ============================================================================
-- VERIFICATIE: Controleer of de data correct is ingevoerd
-- ============================================================================
SELECT 
    'Organisaties' as tabel, 
    COUNT(*) as aantal 
FROM organizations
WHERE id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
)
UNION ALL
SELECT 
    'Chauffeurs', 
    COUNT(*) 
FROM drivers 
WHERE organization_id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
)
UNION ALL
SELECT 
    'Vaste Routes', 
    COUNT(*) 
FROM fixed_routes 
WHERE organization_id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
)
UNION ALL
SELECT 
    'Voertuigen', 
    COUNT(*) 
FROM vehicles 
WHERE organization_id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
)
UNION ALL
SELECT 
    'Debiteuren', 
    COUNT(*) 
FROM debtors 
WHERE organization_id = COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid()),
    '2dfbaa0c-f67e-42b7-a206-4974a564b80c'::UUID
);
