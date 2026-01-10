// Entity mapping functies voor conversie tussen frontend en database formaten

import { Vehicle, Driver, Debtor, FixedRoute, LicenseType } from '../types';

/**
 * Converteer Vehicle naar database formaat (snake_case)
 */
export const mapVehicleToDb = (vehicle: Vehicle, orgId: string): any => {
  const dbData: any = {
    organization_id: orgId,
    license_plate: vehicle.license_plate || null,
    brand: vehicle.brand || null,
    type: vehicle.type,
    license_required: vehicle.license_required,
    capacity_chilled: vehicle.capacity.chilled,
    capacity_frozen: vehicle.capacity.frozen,
    fuel_type: vehicle.fuel_type,
    max_range_km: vehicle.max_range_km,
    consumption_per_100km: vehicle.consumption_per_100km,
    fuel_price_per_unit: vehicle.fuel_price_per_unit,
    co2_emission_per_km: vehicle.co2_emission_per_km,
    is_available: vehicle.is_available,
    hourly_rate: vehicle.hourly_rate,
    monthly_fixed_cost: vehicle.monthly_fixed_cost,
    assigned_driver_id: vehicle.assigned_driver_id || null
  };
  
  // id is verplicht voor vehicles (TEXT PRIMARY KEY, geen auto-generated UUID)
  if (vehicle.id) {
    dbData.id = vehicle.id;
  }
  
  return dbData;
};

/**
 * Converteer Driver naar database formaat (snake_case)
 */
export const mapDriverToDb = (driver: Driver, orgId: string): any => {
  return {
    organization_id: orgId,
    name: driver.name,
    email: driver.email || null,
    phone: driver.phone || null,
    licenses: driver.licenses || [],
    working_days: driver.working_days || [1, 2, 3, 4, 5],
    is_active: driver.is_active ?? true,
    photo_url: driver.photo_url || null,
    known_route_ids: driver.known_route_ids || []
  };
};

/**
 * Converteer Debtor naar database formaat (snake_case)
 */
export const mapDebtorToDb = (debtor: Debtor, orgId: string): any => {
  return {
    organization_id: orgId,
    debtor_number: debtor.debtor_number || null,
    foundation_name: debtor.foundation_name || null,
    name: debtor.name,
    address: debtor.address,
    postcode: debtor.postcode,
    city: debtor.city,
    container_location: debtor.container_location || null,
    delivery_days: debtor.delivery_days || [],
    time_window_start: debtor.time_window_start,
    time_window_end: debtor.time_window_end,
    drop_time_minutes: debtor.drop_time_minutes || 15,
    containers_chilled: debtor.containers_chilled || 0,
    containers_frozen: debtor.containers_frozen || 0,
    fixed_route_id: debtor.fixed_route_id || null
  };
};

/**
 * Converteer FixedRoute naar database formaat (snake_case)
 */
export const mapFixedRouteToDb = (route: FixedRoute, orgId: string): any => {
  const dbData: any = {
    organization_id: orgId,
    name: route.name,
    region: route.region || null,
    standard_start_time: route.standard_start_time,
    duration_hours: route.duration_hours,
    required_license: route.required_license,
    requires_electric: route.requires_electric || false,
    color: route.color || null,
    allowed_days: route.allowed_days || [1, 2, 3, 4, 5],
    capacity_chilled: route.capacity.chilled,
    capacity_frozen: route.capacity.frozen
  };
  
  // Alleen id toevoegen als het bestaat (voor updates)
  if (route.id) {
    dbData.id = route.id;
  }
  
  return dbData;
};

/**
 * Converteer database Driver terug naar frontend formaat
 */
export const mapDriverFromDb = (dbData: any, driver: Driver): Driver => {
  return {
    ...driver,
    id: dbData.id
  };
};

/**
 * Converteer database Debtor terug naar frontend formaat
 */
export const mapDebtorFromDb = (dbData: any, debtor: Debtor): Debtor => {
  return {
    ...debtor,
    id: dbData.id
  };
};
