
export type Language = 'nl' | 'en';

export enum UserRole {
  ADMIN = 'Beheerder',
  USER = 'Gebruiker'
}

// Represents the user profile stored in the 'profiles' table.
export interface User {
  id: string; // Corresponds to auth.users.id
  name: string;
  email: string; // For display, master is in auth.users
  role: UserRole;
  organization_id: string; // UUID of the organization
  password_plaintext?: string; // Only used for creation, not stored
  photo_url?: string; // Base64 string or URL
}

export enum VehicleType {
  TRUCK = 'VRACHTWAGEN',
  VAN = 'BESTELBUS'
}

export enum LicenseType {
  B = 'B',
  BE = 'BE',
  C = 'C'
}

export enum FuelType {
  DIESEL = 'Diesel',
  ELECTRIC = 'Elektrisch'
}

export type PlanningStrategy = 'JIT' | 'DENSITY';

export interface Debtor {
  id: string;
  organization_id: string;
  debtor_number?: string; // Nieuw: Debiteurnummer
  foundation_name?: string; // Nieuw: Stichting
  name: string; // Dit is nu Klantnaam
  address: string;
  postcode: string;
  city: string;
  container_location?: string; // Nieuw: Locatie specifieke aanduiding
  delivery_days?: number[]; // Nieuw: Dagen van levering (0=Zo, 1=Ma...)
  time_window_start: string;
  time_window_end: string;
  drop_time_minutes: number;
  containers_chilled: number;
  containers_frozen: number;
  fixed_route_id?: string; // Koppeling naar vaste rit
}

export interface Vehicle {
  id: string;
  organization_id: string;
  license_plate: string;
  brand: string;
  type: VehicleType;
  license_required: LicenseType;
  capacity: {
    chilled: number;
    frozen: number;
  };
  fuel_type: FuelType;
  max_range_km: number;
  consumption_per_100km: number;
  fuel_price_per_unit: number;
  co2_emission_per_km: number;
  is_available: boolean;
  hourly_rate: number;
  monthly_fixed_cost: number;
  assigned_driver_id?: string;
}

export type ScheduleType = 'WORK' | 'SICK' | 'VACATION' | 'ROSTER_FREE' | 'TRAINING';

// Fix: Add ScheduleEntry type, as it's used in components but was missing.
export type ScheduleEntry = {
    type: ScheduleType;
    startTime?: string;
    endTime?: string;
    label?: string;
};

export interface Driver {
    id: string;
    organization_id: string;
    name: string;
    photo_url?: string;
    licenses: LicenseType[];
    known_route_ids: string[];
    working_days: number[];
    email: string;
    phone: string;
    is_active: boolean;
    // Fix: Add schedule property to match usage in DriverPlanner.tsx, despite the comment.
    schedule: { [date: string]: ScheduleEntry };
}

export interface DriverSchedule {
    id?: number;
    organization_id: string;
    driver_id: string;
    date: string; // ISO 'YYYY-MM-DD'
    type: ScheduleType;
    start_time?: string; // 'HH:MM'
    end_time?: string;   // 'HH:MM'
    label?: string;
}

export interface FixedRoute {
    id: string;
    organization_id: string;
    name: string;
    region: string;
    standard_start_time: string;
    duration_hours: number;
    required_license: LicenseType;
    requires_electric?: boolean;
    color: string;
    allowed_days: number[];
    capacity: {
        chilled: number;
        frozen: number;
    };
    // Fix: Add assignments property to match usage in FixedRoutePlanner.tsx, despite the comment.
    assignments: { [date: string]: string }; // driverId
    // New: Store assigned vehicle ID per date
    vehicleAssignments?: { [date: string]: string }; // vehicleId
}

export interface FixedRouteAssignment {
    id?: number;
    organization_id: string;
    route_id: string;
    driver_id: string;
    date: string; // ISO 'YYYY-MM-DD'
    type: ScheduleType;
    start_time?: string; // 'HH:MM'
    end_time?: string;   // 'HH:MM'
    label?: string;
}

export interface Stop {
  type?: 'DELIVERY' | 'BREAK' | 'IDLE';
  debtorId?: string;
  name: string;
  address?: string;
  postcode?: string;
  city?: string;
  arrivalTime: string;
  timeWindow?: string;
  durationMinutes?: number;
  containers?: number;
  containersChilled?: number;
  containersFrozen?: number;
  lat?: number;
  lng?: number;
  earlyMinutes?: number;
  lateMinutes?: number;
  deviation?: number;
  distanceFromPreviousStop?: number;
}

export interface Route {
  vehicleId: string;
  vehicleType: VehicleType;
  stops: Stop[];
  totalContainers: number;
  totalContainersChilled: number;
  totalContainersFrozen: number;
  startTime: string;
  endTime: string;
  estimatedDurationHours: number;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  totalCost: number;
  costBreakdown: {
    personnel: number;
    personnelDetail: string;
    fuel: number;
    fuelDetail: string;
    fixed: number;
    depreciation: number;
    depreciationDetail: string;
  };
  totalCo2Emission: number;
  totalPauseMinutes: number;
  isModified?: boolean;
  hasBeenRecalculated?: boolean;
  analysis?: {
    pros: string[];
    cons: string[];
  };
}

export interface TimeRecord {
    id: string;
    organization_id: string;
    date: string; // YYYY-MM-DD
    driver_id: string;
    route_id: string; // Fixed Route ID
    start_time: string; // HH:MM
    end_time: string; // HH:MM
    duration_minutes: number;
    remarks?: string;
    exclude_from_analysis?: boolean; // Nieuw: Uitsluiten van statistieken
}

export interface OptimizationAdvice {
  debtorName: string;
  currentWindow: string;
  suggestedWindow: string;
  reason: string;
  potentialSavingEur: number;
  impactDescription: string;
}

export interface OptimizationResult {
  routes: Route[];
  totalUnassigned: number;
  summary: {
    totalRoutes: number;
    totalContainersMoved: number;
    totalCo2Saved: number;
    totalCost: number;
    totalDistance: number;
    totalEmission: number;
  }
}

export interface PlanningConfig {
  defaultStartTime: string;
  maxRouteDurationHours: number;
  breakTimeMinutes: number;
  maxDrivingTimeBetweenBreaksMinutes: number;
  timeWindowToleranceMinutes: number;
  depotAddress: string;
  depotCity: string;
  strictTimeWindows: boolean;
  selectedStrategy: PlanningStrategy;
  customInstruction?: string; // New field for user-editable prompt
}