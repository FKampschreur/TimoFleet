// Custom hooks voor data fetching van entiteiten

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Driver, Vehicle, Debtor, FixedRoute, LicenseType } from '../types';

/**
 * Hook voor het ophalen van drivers
 */
export const useDrivers = (currentUser: User | null) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchDrivers = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .order('name');

        if (driversError) {
          console.error('Error fetching drivers:', driversError);
        } else if (!cancelled) {
          const mappedDrivers: Driver[] = (driversData || []).map((d: any) => ({
            id: d.id,
            organization_id: d.organization_id,
            name: d.name || 'Onbekende Chauffeur',
            email: d.email || '',
            phone: d.phone || '',
            licenses: (d.licenses || []) as LicenseType[],
            known_route_ids: d.known_route_ids || [],
            working_days: d.working_days || [1, 2, 3, 4, 5],
            is_active: d.is_active ?? true,
            photo_url: d.photo_url,
            schedule: {}
          }));
          setDrivers(mappedDrivers);
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDrivers();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return { drivers, setDrivers, isLoading };
};

/**
 * Hook voor het ophalen van vehicles
 */
export const useVehicles = (currentUser: User | null) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchVehicles = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .order('license_plate');

        if (vehiclesError) {
          console.error('Error fetching vehicles:', vehiclesError);
        } else if (!cancelled) {
          const mappedVehicles: Vehicle[] = (vehiclesData || []).map((v: any) => ({
            id: v.id,
            organization_id: v.organization_id,
            license_plate: v.license_plate || '',
            brand: v.brand || '',
            type: v.type,
            license_required: v.license_required,
            capacity: {
              chilled: v.capacity_chilled || 0,
              frozen: v.capacity_frozen || 0
            },
            fuel_type: v.fuel_type,
            max_range_km: v.max_range_km || 0,
            consumption_per_100km: Number(v.consumption_per_100km) || 0,
            fuel_price_per_unit: Number(v.fuel_price_per_unit) || 0,
            co2_emission_per_km: Number(v.co2_emission_per_km) || 0,
            is_available: v.is_available ?? true,
            hourly_rate: Number(v.hourly_rate) || 0,
            monthly_fixed_cost: Number(v.monthly_fixed_cost) || 0,
            assigned_driver_id: v.assigned_driver_id
          }));
          setVehicles(mappedVehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchVehicles();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return { vehicles, setVehicles, isLoading };
};

/**
 * Hook voor het ophalen van debtors
 */
export const useDebtors = (currentUser: User | null) => {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchDebtors = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data: debtorsData, error: debtorsError } = await supabase
          .from('debtors')
          .select('*')
          .order('name');

        if (debtorsError) {
          console.error('Error fetching debtors:', debtorsError);
        } else if (!cancelled) {
          const mappedDebtors: Debtor[] = (debtorsData || []).map((d: any) => ({
            id: d.id,
            organization_id: d.organization_id,
            debtor_number: d.debtor_number,
            foundation_name: d.foundation_name,
            name: d.name || 'Onbekende Klant',
            address: d.address || '',
            postcode: d.postcode || '',
            city: d.city || '',
            container_location: d.container_location,
            delivery_days: d.delivery_days || [],
            time_window_start: d.time_window_start || '08:00',
            time_window_end: d.time_window_end || '17:00',
            drop_time_minutes: d.drop_time_minutes || 15,
            containers_chilled: d.containers_chilled || 0,
            containers_frozen: d.containers_frozen || 0,
            fixed_route_id: d.fixed_route_id
          }));
          setDebtors(mappedDebtors);
        }
      } catch (error) {
        console.error('Error fetching debtors:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDebtors();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return { debtors, setDebtors, isLoading };
};

/**
 * Hook voor het ophalen van fixed routes
 */
export const useFixedRoutes = (currentUser: User | null) => {
  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchFixedRoutes = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data: routesData, error: routesError } = await supabase
          .from('fixed_routes')
          .select('*')
          .order('name');

        if (routesError) {
          console.error('Error fetching fixed routes:', routesError);
        } else if (!cancelled) {
          const mappedRoutes: FixedRoute[] = (routesData || []).map((r: any) => ({
            id: r.id,
            organization_id: r.organization_id,
            name: r.name || 'Onbekende Route',
            region: r.region || '',
            standard_start_time: r.standard_start_time || '08:00',
            duration_hours: Number(r.duration_hours) || 8,
            required_license: r.required_license as LicenseType,
            requires_electric: r.requires_electric || false,
            color: r.color || 'bg-slate-500',
            allowed_days: r.allowed_days || [1, 2, 3, 4, 5],
            capacity: {
              chilled: r.capacity_chilled || 0,
              frozen: r.capacity_frozen || 0
            },
            assignments: {}
          }));
          setFixedRoutes(mappedRoutes);
        }
      } catch (error) {
        console.error('Error fetching fixed routes:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFixedRoutes();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return { fixedRoutes, setFixedRoutes, isLoading };
};
