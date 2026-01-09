// =============================================================================
//                                  IMPORTANT
// This file contains mock data for reference and local development.
// The application uses this when running in offline/demo mode.
// =============================================================================

import { Vehicle, VehicleType, LicenseType, FuelType, Driver, FixedRoute, ScheduleType, User, UserRole, Debtor, TimeRecord } from './types';

export const FLEET_CONFIG: Vehicle[] = [
  // 101 - 116: Mercedes VW Medium (Diesel Trucks - C License)
  ...[
    { id: '101', lp: '98-BRL-9' }, { id: '102', lp: '88-BTR-3' }, { id: '103', lp: '92-BTR-3' },
    { id: '104', lp: '71-BTR-5' }, { id: '105', lp: '69-BTX-1' }, { id: '106', lp: '70-BTX-1' },
    { id: '107', lp: '09-BZT-3' }, { id: '108', lp: '80-BTZ-6' }, { id: '109', lp: '94-BTZ-9' },
    { id: '110', lp: '40-BVB-6' }, { id: '111', lp: '14-BVD-3' }, { id: '112', lp: '14-BZG-9' },
    { id: '113', lp: '18-BZG-9' }, { id: '114', lp: '21-BZG-9' }, { id: '115', lp: '25-BZG-9' },
    { id: '116', lp: '27-BZG-9' }
  ].map(v => ({
    id: v.id,
    organization_id: 'local-org',
    license_plate: v.lp,
    brand: 'Mercedes',
    type: VehicleType.TRUCK,
    license_required: LicenseType.C,
    capacity: { chilled: 28, frozen: 8 },
    fuel_type: FuelType.DIESEL,
    max_range_km: 1000,
    consumption_per_100km: 26.11,
    fuel_price_per_unit: 1.40,
    co2_emission_per_km: 700,
    is_available: true,
    hourly_rate: 35,
    monthly_fixed_cost: 3820
  })),

  // 117: Volvo Elektrisch
  {
    id: '117',
    organization_id: 'local-org',
    license_plate: 'BB-487-T',
    brand: 'Volvo',
    type: VehicleType.TRUCK,
    license_required: LicenseType.C,
    capacity: { chilled: 25, frozen: 7 },
    fuel_type: FuelType.ELECTRIC,
    max_range_km: 375,
    consumption_per_100km: 100,
    fuel_price_per_unit: 0.20,
    co2_emission_per_km: 0,
    is_available: true,
    hourly_rate: 35,
    monthly_fixed_cost: 5500
  },

  // 201 - 203: Mercedes VW Klein (BE License Vans)
  ...['V-61-KGH', 'V-62-KGH', 'V-88-KSK'].map((lp, i) => ({
    id: `20${i + 1}`,
    organization_id: 'local-org',
    license_plate: lp,
    brand: 'Mercedes',
    type: VehicleType.VAN,
    license_required: LicenseType.BE,
    capacity: { chilled: 11, frozen: 4 },
    fuel_type: FuelType.DIESEL,
    max_range_km: 500,
    consumption_per_100km: 16.5,
    fuel_price_per_unit: 1.40,
    co2_emission_per_km: 390,
    is_available: true,
    hourly_rate: 30,
    monthly_fixed_cost: 1150
  })),

  // 301: FUSO VW Klein
  {
    id: '301',
    organization_id: 'local-org',
    license_plate: '30-BPK-7',
    brand: 'FUSO',
    type: VehicleType.TRUCK,
    license_required: LicenseType.C,
    capacity: { chilled: 12, frozen: 4 },
    fuel_type: FuelType.DIESEL,
    max_range_km: 400,
    consumption_per_100km: 25.0,
    fuel_price_per_unit: 1.40,
    co2_emission_per_km: 400,
    is_available: true,
    hourly_rate: 35,
    monthly_fixed_cost: 1450
  },

  // 401: Mercedes Bestelbus (B License)
  {
    id: '401',
    organization_id: 'local-org',
    license_plate: 'VSL-26-V',
    brand: 'Mercedes',
    type: VehicleType.VAN,
    license_required: LicenseType.B,
    capacity: { chilled: 7, frozen: 0 },
    fuel_type: FuelType.DIESEL,
    max_range_km: 600,
    consumption_per_100km: 12.0,
    fuel_price_per_unit: 1.40,
    co2_emission_per_km: 260,
    is_available: true,
    hourly_rate: 30,
    monthly_fixed_cost: 850
  }
];

export const MOCK_DRIVERS: Driver[] = [
    {
        id: 'd-1',
        organization_id: 'local-org',
        name: 'Hans de Vries',
        licenses: [LicenseType.C, LicenseType.BE],
        known_route_ids: ['RT-01', 'RT-02', 'RT-03'],
        working_days: [1, 2, 3, 4, 5],
        email: 'hans@timo.nl',
        phone: '06-12345678',
        is_active: true,
        schedule: {}
    },
    {
        id: 'd-2',
        organization_id: 'local-org',
        name: 'Karel Jansen',
        licenses: [LicenseType.C],
        known_route_ids: ['RT-03'],
        working_days: [1, 2, 3, 4, 5],
        email: 'karel@timo.nl',
        phone: '06-87654321',
        is_active: true,
        schedule: {}
    },
    {
        id: 'd-3',
        organization_id: 'local-org',
        name: 'Piet Pietersen',
        licenses: [LicenseType.B, LicenseType.BE],
        known_route_ids: ['RT-04'],
        working_days: [1, 2, 3, 4, 5, 6],
        email: 'piet@timo.nl',
        phone: '06-11223344',
        is_active: true,
        schedule: {}
    },
    {
        id: 'd-4',
        organization_id: 'local-org',
        name: 'Mo Ahmed',
        licenses: [LicenseType.C, LicenseType.BE, LicenseType.B],
        known_route_ids: ['RT-01', 'RT-05', 'RT-03'],
        working_days: [1, 3, 4, 5, 6],
        email: 'mo@timo.nl',
        phone: '06-55443322',
        is_active: true,
        schedule: {}
    },
    {
        id: 'd-5',
        organization_id: 'local-org',
        name: 'Sophie Bakker',
        licenses: [LicenseType.B],
        known_route_ids: [],
        working_days: [1, 2, 4, 5],
        email: 'sophie@timo.nl',
        phone: '06-99887766',
        is_active: true,
        schedule: {}
    }
];

export const MOCK_FIXED_ROUTES: FixedRoute[] = [
    {
        id: 'RT-01',
        organization_id: 'local-org',
        name: 'Route Amsterdam Centrum',
        region: 'Amsterdam',
        standard_start_time: '05:30',
        duration_hours: 9,
        required_license: LicenseType.C,
        requires_electric: true,
        color: 'bg-emerald-500',
        allowed_days: [1, 3, 5],
        capacity: { chilled: 25, frozen: 5 },
        assignments: {}
    },
    {
        id: 'RT-02',
        organization_id: 'local-org',
        name: 'Route Utrecht Horeca',
        region: 'Utrecht',
        standard_start_time: '06:00',
        duration_hours: 8,
        required_license: LicenseType.C,
        requires_electric: false,
        color: 'bg-blue-500',
        allowed_days: [1, 2, 3, 4, 5],
        capacity: { chilled: 20, frozen: 8 },
        assignments: {}
    },
    {
        id: 'RT-03',
        organization_id: 'local-org',
        name: 'Route Nijmegen Dorpen',
        region: 'Nijmegen',
        standard_start_time: '07:00',
        duration_hours: 7,
        required_license: LicenseType.C,
        requires_electric: false,
        color: 'bg-indigo-500',
        allowed_days: [2, 4, 6],
        capacity: { chilled: 18, frozen: 10 },
        assignments: {}
    },
    {
        id: 'RT-04',
        organization_id: 'local-org',
        name: 'Snelle Rit Arnhem',
        region: 'Arnhem',
        standard_start_time: '08:00',
        duration_hours: 5,
        required_license: LicenseType.BE,
        requires_electric: false,
        color: 'bg-orange-500',
        allowed_days: [1, 2, 3, 4, 5],
        capacity: { chilled: 10, frozen: 2 },
        assignments: {}
    },
    {
        id: 'RT-05',
        organization_id: 'local-org',
        name: 'Nachtrit Distributie',
        region: 'Landelijk',
        standard_start_time: '03:00',
        duration_hours: 10,
        required_license: LicenseType.C,
        requires_electric: false,
        color: 'bg-purple-500',
        allowed_days: [1, 2, 3, 4, 5],
        capacity: { chilled: 30, frozen: 0 },
        assignments: {}
    }
];

export const MOCK_USERS: User[] = [
    {
        id: 'mock-user-123',
        name: 'Demo Beheerder',
        email: 'admin@timo.nl',
        role: UserRole.ADMIN,
        organization_id: 'local-org'
    },
    {
        id: 'mock-user-456',
        name: 'Timo Planner',
        email: 'planning@timo.nl',
        role: UserRole.USER,
        organization_id: 'local-org'
    },
    {
        id: 'mock-user-789',
        name: 'Wagenpark Beheer',
        email: 'fleet@timo.nl',
        role: UserRole.USER,
        organization_id: 'local-org'
    }
];

export const MOCK_DEBTORS: Debtor[] = [
    {
        id: 'DEB-001',
        organization_id: 'local-org',
        debtor_number: '1001',
        foundation_name: 'Stichting Jumbo Groep',
        name: 'Jumbo Supermarkt',
        address: 'Burchtstraat 14',
        postcode: '6511 RC',
        city: 'Nijmegen',
        container_location: 'Achterzijde, laden/lossen zone A',
        delivery_days: [1, 3, 5], // Ma, Wo, Vr
        time_window_start: '07:00',
        time_window_end: '10:00',
        drop_time_minutes: 25,
        containers_chilled: 12,
        containers_frozen: 4,
        fixed_route_id: 'RT-03'
    },
    {
        id: 'DEB-002',
        organization_id: 'local-org',
        debtor_number: '1002',
        name: 'Albert Heijn XL',
        address: 'St. Jacobslaan 61',
        postcode: '6533 BN',
        city: 'Nijmegen',
        container_location: 'Magazijn 2',
        delivery_days: [1, 2, 3, 4, 5, 6], // Ma-Za
        time_window_start: '06:00',
        time_window_end: '09:00',
        drop_time_minutes: 30,
        containers_chilled: 15,
        containers_frozen: 6,
        fixed_route_id: 'RT-03'
    },
    {
        id: 'DEB-003',
        organization_id: 'local-org',
        debtor_number: '1003',
        foundation_name: 'Stichting CWZ Zorg',
        name: 'Ziekenhuis CWZ',
        address: 'Weg door Jonkerbos 100',
        postcode: '6532 SZ',
        city: 'Nijmegen',
        container_location: 'Centrale Keuken',
        delivery_days: [1, 2, 3, 4, 5], // Ma-Vr
        time_window_start: '08:00',
        time_window_end: '12:00',
        drop_time_minutes: 45,
        containers_chilled: 8,
        containers_frozen: 2,
        fixed_route_id: 'RT-03'
    },
    {
        id: 'DEB-004',
        organization_id: 'local-org',
        debtor_number: '1004',
        name: 'Hotel Blue',
        address: 'Oranjesingel 14',
        postcode: '6511 NT',
        city: 'Nijmegen',
        delivery_days: [1, 4], // Ma, Do
        time_window_start: '09:00',
        time_window_end: '11:00',
        drop_time_minutes: 15,
        containers_chilled: 4,
        containers_frozen: 1,
        fixed_route_id: 'RT-03'
    },
    {
        id: 'DEB-005',
        organization_id: 'local-org',
        debtor_number: '1005',
        name: 'Coop Supermarkt',
        address: 'Markt 10',
        postcode: '6602 AM',
        city: 'Wijchen',
        container_location: 'Steeg zijkant',
        delivery_days: [2, 5], // Di, Vr
        time_window_start: '07:30',
        time_window_end: '09:30',
        drop_time_minutes: 20,
        containers_chilled: 10,
        containers_frozen: 3
    },
    {
        id: 'DEB-006',
        organization_id: 'local-org',
        debtor_number: '1006',
        name: 'Restaurant Sterrebosch',
        address: 'Kasteellaan 6',
        postcode: '6602 DE',
        city: 'Wijchen',
        delivery_days: [4, 5, 6], // Do, Vr, Za
        time_window_start: '10:00',
        time_window_end: '14:00',
        drop_time_minutes: 15,
        containers_chilled: 5,
        containers_frozen: 2
    },
    {
        id: 'DEB-007',
        organization_id: 'local-org',
        debtor_number: '1007',
        name: 'Bakkerij ' + "'t Kraayennest",
        address: 'Touwweg 12',
        postcode: '6604 BA',
        city: 'Wijchen',
        delivery_days: [1, 2, 3, 4, 5, 6],
        time_window_start: '05:00',
        time_window_end: '07:00',
        drop_time_minutes: 15,
        containers_chilled: 2,
        containers_frozen: 0
    },
    {
        id: 'DEB-008',
        organization_id: 'local-org',
        debtor_number: '1008',
        name: 'Plus Supermarkt',
        address: 'Kerkstraat 23',
        postcode: '6641 BS',
        city: 'Beuningen',
        delivery_days: [1, 3, 5],
        time_window_start: '08:00',
        time_window_end: '11:00',
        drop_time_minutes: 20,
        containers_chilled: 9,
        containers_frozen: 3
    },
    {
        id: 'DEB-009',
        organization_id: 'local-org',
        debtor_number: '1009',
        foundation_name: 'Stichting Ouderenzorg Beuningen',
        name: 'Woonzorgcentrum De Alde Steeg',
        address: 'De Alde Steeg 2',
        postcode: '6641 CP',
        city: 'Beuningen',
        container_location: 'Goederenontvangst achter',
        delivery_days: [2, 5],
        time_window_start: '09:00',
        time_window_end: '13:00',
        drop_time_minutes: 25,
        containers_chilled: 6,
        containers_frozen: 2
    },
    {
        id: 'DEB-010',
        organization_id: 'local-org',
        debtor_number: '1010',
        name: 'Lidl Arnhem',
        address: 'Dr. C. Lelyweg 9',
        postcode: '6827 BH',
        city: 'Arnhem',
        delivery_days: [1, 2, 3, 4, 5, 6],
        time_window_start: '06:00',
        time_window_end: '10:00',
        drop_time_minutes: 30,
        containers_chilled: 14,
        containers_frozen: 5,
        fixed_route_id: 'RT-04'
    },
    {
        id: 'DEB-011',
        organization_id: 'local-org',
        debtor_number: '1011',
        foundation_name: 'Stichting Rijnstate',
        name: 'Rijnstate Ziekenhuis',
        address: 'Wagnerlaan 55',
        postcode: '6815 AD',
        city: 'Arnhem',
        container_location: 'Dock 4 & 5',
        delivery_days: [1, 2, 3, 4, 5],
        time_window_start: '07:00',
        time_window_end: '11:00',
        drop_time_minutes: 50,
        containers_chilled: 10,
        containers_frozen: 4,
        fixed_route_id: 'RT-04'
    },
    {
        id: 'DEB-012',
        organization_id: 'local-org',
        debtor_number: '1012',
        name: 'Spar City',
        address: 'Koningstraat 28',
        postcode: '6811 DE',
        city: 'Arnhem',
        delivery_days: [1, 4],
        time_window_start: '08:30',
        time_window_end: '10:30',
        drop_time_minutes: 15,
        containers_chilled: 5,
        containers_frozen: 1,
        fixed_route_id: 'RT-04'
    },
    {
        id: 'DEB-013',
        organization_id: 'local-org',
        debtor_number: '1013',
        name: 'Van der Valk Hotel Tiel',
        address: 'Laan van Westroijen 10',
        postcode: '4003 AZ',
        city: 'Tiel',
        delivery_days: [1, 3, 5],
        time_window_start: '09:00',
        time_window_end: '12:00',
        drop_time_minutes: 30,
        containers_chilled: 12,
        containers_frozen: 6
    },
    {
        id: 'DEB-014',
        organization_id: 'local-org',
        debtor_number: '1014',
        name: 'Slagerij van der Ven',
        address: 'Dorpsplein 4',
        postcode: '5361 GA',
        city: 'Grave',
        delivery_days: [2, 5],
        time_window_start: '07:00',
        time_window_end: '09:00',
        drop_time_minutes: 15,
        containers_chilled: 4,
        containers_frozen: 0
    },
    {
        id: 'DEB-015',
        organization_id: 'local-org',
        debtor_number: '1015',
        foundation_name: 'Stichting De Waalboog',
        name: 'Verpleeghuis Joachim en Anna',
        address: 'Groesbeekseweg 327',
        postcode: '6523 PA',
        city: 'Nijmegen',
        delivery_days: [1, 3, 5],
        time_window_start: '10:00',
        time_window_end: '14:00',
        drop_time_minutes: 20,
        containers_chilled: 7,
        containers_frozen: 2
    },
    {
        id: 'DEB-016',
        organization_id: 'local-org',
        debtor_number: '1016',
        name: 'Café de Plak',
        address: 'Bloemerstraat 90',
        postcode: '6511 EL',
        city: 'Nijmegen',
        delivery_days: [3, 5],
        time_window_start: '11:00',
        time_window_end: '15:00',
        drop_time_minutes: 15,
        containers_chilled: 3,
        containers_frozen: 2
    },
    {
        id: 'DEB-017',
        organization_id: 'local-org',
        debtor_number: '1017',
        name: 'MCD Supermarkt',
        address: 'Markt 3',
        postcode: '6651 BC',
        city: 'Druten',
        delivery_days: [1, 2, 4, 5],
        time_window_start: '07:00',
        time_window_end: '09:30',
        drop_time_minutes: 25,
        containers_chilled: 11,
        containers_frozen: 3
    },
    {
        id: 'DEB-018',
        organization_id: 'local-org',
        debtor_number: '1018',
        name: 'Pannenkoekenhuis De Heksendans',
        address: 'Oude Kleefsebaan 425',
        postcode: '6572 AZ',
        city: 'Berg en Dal',
        delivery_days: [5, 6, 0], // Vr, Za, Zo
        time_window_start: '10:30',
        time_window_end: '12:30',
        drop_time_minutes: 15,
        containers_chilled: 6,
        containers_frozen: 4
    },
    {
        id: 'DEB-019',
        organization_id: 'local-org',
        debtor_number: '1019',
        foundation_name: 'Stichting RU',
        name: 'Radboud Universiteit Catering',
        address: 'Erasmusplein 1',
        postcode: '6525 HT',
        city: 'Nijmegen',
        container_location: 'Refter ingang zuid',
        delivery_days: [1, 2, 3, 4, 5],
        time_window_start: '06:30',
        time_window_end: '08:30',
        drop_time_minutes: 30,
        containers_chilled: 18,
        containers_frozen: 5,
        fixed_route_id: 'RT-03'
    },
    {
        id: 'DEB-020',
        organization_id: 'local-org',
        debtor_number: '1020',
        name: 'EkoPlaza',
        address: 'Ziekerstraat 32',
        postcode: '6511 LJ',
        city: 'Nijmegen',
        delivery_days: [1, 3, 5],
        time_window_start: '07:00',
        time_window_end: '09:00',
        drop_time_minutes: 20,
        containers_chilled: 8,
        containers_frozen: 2,
        fixed_route_id: 'RT-03'
    }
];

export const MOCK_TIME_RECORDS: TimeRecord[] = [
    // RT-03 Analysis Data (Hans vs Karel vs Mo)
    { id: 'TR-001', organization_id: 'local-org', date: '2023-10-02', driver_id: 'd-1', route_id: 'RT-03', start_time: '07:00', end_time: '14:30', duration_minutes: 450 },
    { id: 'TR-002', organization_id: 'local-org', date: '2023-10-03', driver_id: 'd-1', route_id: 'RT-03', start_time: '07:05', end_time: '14:40', duration_minutes: 455 },
    { id: 'TR-003', organization_id: 'local-org', date: '2023-10-04', driver_id: 'd-2', route_id: 'RT-03', start_time: '07:00', end_time: '15:15', duration_minutes: 495 }, // Karel is slower
    { id: 'TR-004', organization_id: 'local-org', date: '2023-10-05', driver_id: 'd-2', route_id: 'RT-03', start_time: '07:00', end_time: '15:30', duration_minutes: 510 },
    { id: 'TR-005', organization_id: 'local-org', date: '2023-10-06', driver_id: 'd-4', route_id: 'RT-03', start_time: '07:00', end_time: '14:15', duration_minutes: 435 }, // Mo is fast
    { id: 'TR-006', organization_id: 'local-org', date: '2023-10-09', driver_id: 'd-1', route_id: 'RT-03', start_time: '07:00', end_time: '14:25', duration_minutes: 445 },
    
    // RT-01 Analysis (Hans vs Mo)
    { id: 'TR-007', organization_id: 'local-org', date: '2023-10-02', driver_id: 'd-4', route_id: 'RT-01', start_time: '05:30', end_time: '14:30', duration_minutes: 540 },
    { id: 'TR-008', organization_id: 'local-org', date: '2023-10-04', driver_id: 'd-1', route_id: 'RT-01', start_time: '05:30', end_time: '15:00', duration_minutes: 570 },
];