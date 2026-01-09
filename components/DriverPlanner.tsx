import React, { useState, useMemo } from 'react';
// Fix: Added ScheduleEntry to import, which is added to types.ts
import { Driver, LicenseType, Language, ScheduleType, ScheduleEntry, FixedRoute, Vehicle, FuelType } from '../types';
import { translations } from '../translations';
import { Users, ChevronLeft, ChevronRight, Search, Filter, CalendarDays, Briefcase, UserCheck, UserX, Clock, Moon, Sun, Thermometer, Palmtree, Trash2, X, AlertOctagon, Sunrise, UserPlus, Edit2, ShieldCheck, Mail, Phone, User, Check, Sparkles, ArrowRight, Loader2, Lightbulb, TriangleAlert, MapPin, CheckSquare, Square, Camera, Upload, GraduationCap, CalendarOff, Calendar, Plus, AlertTriangle } from 'lucide-react';
// Fix: MOCK_DRIVERS is not exported and no longer used, remove import.

interface DriverPlannerProps {
    language: Language;
    drivers?: Driver[];
    vehicles?: Vehicle[]; // Add vehicles prop for Auto Plan logic
    setDrivers?: React.Dispatch<React.SetStateAction<Driver[]>>;
    fixedRoutes: FixedRoute[];
    setFixedRoutes?: React.Dispatch<React.SetStateAction<FixedRoute[]>>; // Added setter for Auto-Plan
    onAddDriver?: (driver: Driver) => void;
    onUpdateDriver?: (driver: Driver) => void;
    onDeleteDriver?: (id: string) => void;
}

interface ShortageReport {
    date: string;
    license: LicenseType;
    count: number;
}

const DriverPlanner: React.FC<DriverPlannerProps> = ({ 
    language, 
    drivers: propDrivers, 
    vehicles = [], // Default empty array if not provided
    setDrivers: propSetDrivers, 
    fixedRoutes,
    setFixedRoutes,
    onAddDriver,
    onUpdateDriver,
    onDeleteDriver
}) => {
    // If props are provided (lifted state), use them. Otherwise fallback to local state (for standalone dev).
    // Fix: initialize with empty array instead of missing MOCK_DRIVERS
    const [localDrivers, setLocalDrivers] = useState<Driver[]>([]);
    const drivers = propDrivers || localDrivers;
    const setDrivers = propSetDrivers || setLocalDrivers;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterLicense, setFilterLicense] = useState<LicenseType | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCell, setSelectedCell] = useState<{driverId: string, dateIso: string, driverName: string} | null>(null);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [isCreatingDriver, setIsCreatingDriver] = useState(false);
    
    // Auto-Plan State
    const [showAutoPlanModal, setShowAutoPlanModal] = useState(false);
    const [autoPlanStart, setAutoPlanStart] = useState(new Date().toISOString().split('T')[0]);
    const [autoPlanEnd, setAutoPlanEnd] = useState(new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]);
    
    // Advice State
    const [showAdviceModal, setShowAdviceModal] = useState(false);
    const [shortageReport, setShortageReport] = useState<ShortageReport[]>([]);

    const t = translations[language];

    // Helper to get start of current week (Monday)
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    // Helper to format date locally YYYY-MM-DD
    const toLocalYMD = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const timeToMinutes = (time: string): number => {
        if (!time) return 0;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleCellClick = (driverId: string, driverName: string, dateIso: string) => {
        setSelectedCell({ driverId, driverName, dateIso });
    };

    const handleSetSchedule = (entry: ScheduleEntry | null) => {
        if (!selectedCell) return;

        setDrivers(prev => prev.map(driver => {
            if (driver.id !== selectedCell.driverId) return driver;
            
            const newSchedule = { ...driver.schedule };
            if (entry) {
                newSchedule[selectedCell.dateIso] = entry;
            } else {
                delete newSchedule[selectedCell.dateIso];
            }
            return { ...driver, schedule: newSchedule };
        }));
        setSelectedCell(null);
    };

    const handleAddNewClick = () => {
        const newId = (Math.floor(Math.random() * 90000) + 10000).toString();
        // Fix: use snake_case properties
        const newDriver: Driver = {
            id: newId,
            organization_id: 'temp-org',
            name: '',
            licenses: [LicenseType.B], // Default
            known_route_ids: [],
            working_days: [1,2,3,4,5], // Default Mon-Fri
            email: '',
            phone: '',
            is_active: true,
            schedule: {}
        };
        setEditingDriver(newDriver);
        setIsCreatingDriver(true);
    };

    const handleEditClick = (driver: Driver) => {
        // Ensure workingDays exists (migration fallback)
        // Fix: use snake_case property
        setEditingDriver({ ...driver, working_days: driver.working_days || [1,2,3,4,5] });
        setIsCreatingDriver(false);
    };

    const handleSaveDriver = (driver: Driver) => {
        if (isCreatingDriver) {
            if (onAddDriver) onAddDriver(driver);
        } else {
            if (onUpdateDriver) onUpdateDriver(driver);
        }
        setEditingDriver(null);
    };

    const handleAutoPlanClick = () => {
        // Automatically set the range to the currently visible week
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

        setAutoPlanStart(toLocalYMD(startOfWeek));
        setAutoPlanEnd(toLocalYMD(endOfWeek));
        setShowAutoPlanModal(true);
    };

    // --- AI AUTO-PLANNER LOGIC ---
    const runAutoPlan = () => {
        if (!setFixedRoutes) return;

        const start = new Date(autoPlanStart);
        const end = new Date(autoPlanEnd);
        
        let newDrivers = [...drivers];
        let newFixedRoutes = [...fixedRoutes];
        const missingLog: { date: string, license: LicenseType }[] = [];

        // Loop through each day in range
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateIso = d.toISOString().split('T')[0]; // Matches input YYYY-MM-DD
            const dayOfWeek = d.getDay();
            const dailyUsedVehicles = new Set<string>(); // Track vehicles used this day
            
            // 1. Reset existing WORK assignments for this day (but keep SICK/VACATION/TRAINING/ROSTER_FREE)
            newDrivers = newDrivers.map(drv => {
                const existing = drv.schedule[dateIso];
                if (existing && existing.type !== 'WORK') {
                    return drv; // Keep leave/training/roster free
                }
                const newSchedule = { ...drv.schedule };
                delete newSchedule[dateIso]; // Clear WORK
                return { ...drv, schedule: newSchedule };
            });

            // 2. Clear route and vehicle assignments for this day
            newFixedRoutes = newFixedRoutes.map(r => {
                const newAssignments = { ...r.assignments };
                delete newAssignments[dateIso];
                
                const newVehicleAssignments = { ...(r.vehicleAssignments || {}) };
                delete newVehicleAssignments[dateIso];

                return { ...r, assignments: newAssignments, vehicleAssignments: newVehicleAssignments };
            });

            // 3. Get available drivers for this day
            // UPDATED: Check for workingDays pattern
            let availableDrivers = newDrivers.filter(drv => {
                const s = drv.schedule[dateIso];
                // Only use drivers who are NOT Sick, Vacation, Training, or Roster Free
                if (s) return false;

                // Only use drivers who are contracted to work on this day
                // Fix: use snake_case property
                const workingDays = drv.working_days || [1,2,3,4,5,6];
                return workingDays.includes(dayOfWeek);
            });

            // 4. Sort Routes: Prioritize C routes, then BE, then B. Also earlier start times.
            // Filter routes: Only include routes that are ACTIVE on this day
            const routesToFill = [...newFixedRoutes]
                // Fix: use snake_case property
                .filter(r => (r.allowed_days || [1,2,3,4,5,6]).includes(dayOfWeek))
                .sort((a, b) => {
                    // Fix: use snake_case property
                    const licOrder = { [LicenseType.C]: 3, [LicenseType.BE]: 2, [LicenseType.B]: 1 };
                    const licDiff = licOrder[b.required_license] - licOrder[a.required_license];
                    if (licDiff !== 0) return licDiff;
                    return timeToMinutes(a.standard_start_time) - timeToMinutes(b.standard_start_time);
                });

            // 5. Match Logic
            routesToFill.forEach(route => {
                // Find best matching driver (Has license, Available)
                // NEW: Prioritize drivers who KNOW this route
                // Fix: use snake_case property
                const candidates = availableDrivers.filter(drv => drv.licenses.includes(route.required_license));
                
                // Sort candidates: Those who know the route come first
                candidates.sort((a, b) => {
                    // Fix: use snake_case property
                    const aKnows = (a.known_route_ids || []).includes(route.id) ? 1 : 0;
                    const bKnows = (b.known_route_ids || []).includes(route.id) ? 1 : 0;
                    return bKnows - aKnows; // Descending (1 comes before 0)
                });

                if (candidates.length > 0) {
                    const driver = candidates[0]; // Pick best match
                    
                    // Assign to route
                    const routeIndex = newFixedRoutes.findIndex(r => r.id === route.id);
                    if (routeIndex !== -1) {
                        newFixedRoutes[routeIndex].assignments[dateIso] = driver.id;

                        // --- NEW: AUTO-ASSIGN VEHICLE ---
                        if (vehicles.length > 0) {
                            // Filter vehicles that:
                            // 1. Are available
                            // 2. Match the route license requirement (C=Truck, B/BE=Van)
                            // 3. Match electric requirement if set
                            // 4. Have not been used today
                            const suitableVehicles = vehicles.filter(v => {
                                if (!v.is_available) return false;
                                if (dailyUsedVehicles.has(v.id)) return false;
                                // Simple License Check:
                                if (v.license_required !== route.required_license) return false;
                                // Electric Check:
                                if (route.requires_electric && v.fuel_type !== FuelType.ELECTRIC) return false;
                                return true;
                            });

                            // Sort vehicles: Prioritize driver's fixed vehicle if available
                            suitableVehicles.sort((a, b) => {
                                const aIsFixed = a.assigned_driver_id === driver.id ? 1 : 0;
                                const bIsFixed = b.assigned_driver_id === driver.id ? 1 : 0;
                                return bIsFixed - aIsFixed;
                            });

                            if (suitableVehicles.length > 0) {
                                const selectedVehicle = suitableVehicles[0];
                                if (!newFixedRoutes[routeIndex].vehicleAssignments) {
                                    newFixedRoutes[routeIndex].vehicleAssignments = {};
                                }
                                // Assign vehicle to route for this day
                                newFixedRoutes[routeIndex].vehicleAssignments![dateIso] = selectedVehicle.id;
                                dailyUsedVehicles.add(selectedVehicle.id);
                            }
                        }
                    }

                    // Update Driver Schedule
                    const driverIndex = newDrivers.findIndex(d => d.id === driver.id);
                    if (driverIndex !== -1) {
                        // Fix: use snake_case properties
                        const startTime = route.standard_start_time;
                        // Calculate end time approx (start + duration)
                        const startMin = timeToMinutes(startTime);
                        const endMin = startMin + (route.duration_hours * 60);
                        const h = Math.floor(endMin / 60) % 24;
                        const m = endMin % 60;
                        const endTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

                        // Definitie:
                        // < 05:00 = Nacht
                        // 05:00 <= T < 07:00 = Vroeg
                        // >= 07:00 = Dag
                        let label = 'Dag';
                        if (startMin < 300) label = 'Nacht';
                        else if (startMin < 420) label = 'Vroeg';

                        newDrivers[driverIndex].schedule[dateIso] = {
                            type: 'WORK',
                            startTime,
                            endTime,
                            label
                        };
                    }

                    // Remove from available pool (find index in original availableDrivers array)
                    const removeIdx = availableDrivers.findIndex(d => d.id === driver.id);
                    if (removeIdx !== -1) availableDrivers.splice(removeIdx, 1);

                } else {
                    // RECORD SHORTAGE
                    // Fix: use snake_case property
                    missingLog.push({ date: dateIso, license: route.required_license });
                }
            });
        }

        setDrivers(newDrivers);
        setFixedRoutes(newFixedRoutes);
        setShowAutoPlanModal(false);

        if (missingLog.length > 0) {
            // Aggregate shortages
            const report: ShortageReport[] = [];
            missingLog.forEach(item => {
                const existing = report.find(r => r.date === item.date && r.license === item.license);
                if (existing) {
                    existing.count++;
                } else {
                    report.push({ date: item.date, license: item.license, count: 1 });
                }
            });
            // Sort report by date
            report.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setShortageReport(report);
            setShowAdviceModal(true);
        } else {
            alert(t.drivers.autoPlanModal.success);
        }
    };

    const filteredDrivers = useMemo(() => {
        return drivers.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLicense = filterLicense === 'ALL' || d.licenses.includes(filterLicense);
            return matchesSearch && matchesLicense;
        });
    }, [drivers, searchTerm, filterLicense]);

    const stats = useMemo(() => {
        const todayIso = toLocalYMD(new Date());
        const workingToday = drivers.filter(d => d.schedule[todayIso]?.type === 'WORK').length;
        const absentToday = drivers.filter(d => ['SICK', 'VACATION'].includes(d.schedule[todayIso]?.type)).length;
        // Count based on possession of license
        const totalC = drivers.filter(d => d.licenses.includes(LicenseType.C)).length;
        const totalB_BE = drivers.filter(d => !d.licenses.includes(LicenseType.C) && (d.licenses.includes(LicenseType.BE) || d.licenses.includes(LicenseType.B))).length;
        
        return { workingToday, absentToday, totalC, totalB_BE };
    }, [drivers]);

    // Check if we have enough coverage for fixed routes on a given day and classify type of shortage
    const getCoverageStatus = (dateIso: string): { count: number, label: string } => {
        if (!fixedRoutes) return { count: 0, label: '' };

        const dayOfWeek = new Date(dateIso).getDay();

        // 2. Sort demand (routes) by start time
        // Only consider routes active on this day
        const demand = [...fixedRoutes]
            // Fix: use snake_case property
            .filter(r => (r.allowed_days || [1,2,3,4,5,6]).includes(dayOfWeek))
            .sort((a, b) => timeToMinutes(a.standard_start_time) - timeToMinutes(b.standard_start_time));

        if (demand.length === 0) return { count: 0, label: '' };

        // 3. Sort supply (drivers working that day) by start time
        const workingDrivers = drivers.filter(d => d.schedule[dateIso]?.type === 'WORK' && d.schedule[dateIso]?.startTime);
        const supply = [...workingDrivers].sort((a, b) => 
            timeToMinutes(a.schedule[dateIso]!.startTime!) - timeToMinutes(b.schedule[dateIso]!.startTime!)
        );

        // 4. Match supply to demand
        const missingRoutes: FixedRoute[] = [];
        const availableSupply = [...supply];

        for (const route of demand) {
            // Fix: use snake_case property
            const routeStart = timeToMinutes(route.standard_start_time);
            
            // Find a driver who starts AT or BEFORE the route start time
            // And has the correct license 
            const driverIndex = availableSupply.findIndex(d => 
                timeToMinutes(d.schedule[dateIso]!.startTime!) <= routeStart &&
                // Fix: use snake_case property
                d.licenses.includes(route.required_license)
            );

            if (driverIndex !== -1) {
                availableSupply.splice(driverIndex, 1);
            } else {
                missingRoutes.push(route);
            }
        }

        const count = missingRoutes.length;
        let label = 'Vaste Ritten'; // Default fallback

        if (count > 0) {
            // Determine label based on missing routes start times
            // Fix: use snake_case properties
            const hasNight = missingRoutes.some(r => timeToMinutes(r.standard_start_time) < 300); // < 05:00
            const hasEarly = missingRoutes.some(r => {
                const t = timeToMinutes(r.standard_start_time);
                return t >= 300 && t < 420; // 05:00 - 06:59
            });
            const hasDay = missingRoutes.some(r => timeToMinutes(r.standard_start_time) >= 420); // >= 07:00

            const types = [];
            if (hasNight) types.push('Nacht');
            if (hasEarly) types.push('Vroege');
            if (hasDay) types.push('Dag');

            if (types.length === 1) {
                label = `${types[0]} Ritten`;
            } else if (types.length > 1) {
                label = 'Div. Ritten';
            }
        }

        return { count, label };
    };

    const getLicenseColor = (license: LicenseType) => {
        switch(license) {
            case LicenseType.C: return 'bg-blue-100 text-blue-700 border-blue-200';
            case LicenseType.BE: return 'bg-orange-100 text-orange-700 border-orange-200';
            case LicenseType.B: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getShiftStyle = (entry: ScheduleEntry | undefined) => {
        if (!entry) return 'bg-transparent border-transparent hover:border-slate-200 hover:bg-white text-slate-300';
        
        switch(entry.type) {
            case 'WORK':
                if (entry.label === 'Nacht') return 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300';
                if (entry.label === 'Vroeg') return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300';
                return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300';
            case 'SICK': return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300';
            case 'VACATION': return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300';
            case 'ROSTER_FREE': return 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 hover:border-slate-400';
            case 'TRAINING': return 'bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300';
            default: return 'bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
            {/* ... (Header Stats and Controls remain the same) ... */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.drivers.stats.availableToday}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.workingToday}</span>
                        <span className="text-xs text-slate-500 font-medium">/ {drivers.length}</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-xl"><UserX size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.drivers.stats.onLeave}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.absentToday}</span>
                        <span className="text-xs text-slate-500 font-medium">Afwezig</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.drivers.stats.cLicense}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{stats.totalC}</span>
                        <span className="text-xs text-slate-500 font-medium">Beschikken over C</span>
                    </div>
                </div>
                <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white flex flex-col justify-center items-start">
                     <h3 className="font-black text-lg mb-1">{t.drivers.title}</h3>
                     <p className="text-xs text-slate-400">{t.drivers.subtitle}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={t.drivers.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select 
                            value={filterLicense}
                            onChange={(e) => setFilterLicense(e.target.value as any)}
                            className="pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="ALL">Alle Rijbewijzen</option>
                            <option value={LicenseType.C}>C - Vrachtwagen</option>
                            <option value={LicenseType.BE}>BE - Aanhanger</option>
                            <option value={LicenseType.B}>B - Bestelbus</option>
                        </select>
                    </div>
                    
                    {/* NEW AI BUTTON - Updated onClick */}
                    <button 
                        onClick={handleAutoPlanClick}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                    >
                        <Sparkles size={18} /> {t.drivers.autoPlan}
                    </button>

                    <button 
                        onClick={handleAddNewClick}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
                    >
                        <UserPlus size={18} /> {t.drivers.addDriver}
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button onClick={handlePrevWeek} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 px-2">
                        <CalendarDays size={18} className="text-slate-400" />
                        <span className="text-sm font-black text-slate-800">
                            Week {Math.ceil(((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)}
                        </span>
                        <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                            ({startOfWeek.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric' })} - {new Date(startOfWeek.getTime() + 6 * 86400000).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { month: 'short', day: 'numeric' })})
                        </span>
                    </div>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Schedule Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 bg-slate-50 border-b border-slate-200 min-w-[240px] sticky left-0 z-10 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.drivers.table.driver}</div>
                                </th>
                                {weekDays.map((day, i) => {
                                    const dateIso = toLocalYMD(day);
                                    const status = getCoverageStatus(dateIso);
                                    return (
                                    <th key={i} className={`p-4 bg-slate-50 border-b border-slate-200 min-w-[120px] text-center ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-50/50' : ''}`}>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {day.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'short' })}
                                        </div>
                                        <div className={`text-sm font-black ${day.toDateString() === new Date().toDateString() ? 'text-emerald-600 bg-emerald-50 px-2 rounded-lg inline-block' : 'text-slate-900'}`}>
                                            {day.getDate()}
                                        </div>
                                        {status.count > 0 && (
                                            <div className="mt-2 inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[9px] font-bold border border-red-200 animate-pulse" title={`Tekort aan ${status.count} chauffeurs voor ${status.label}`}>
                                                <AlertOctagon size={10} />
                                                -{status.count}
                                            </div>
                                        )}
                                    </th>
                                )})}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDrivers.map(driver => (
                                <tr key={driver.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                {/* Fix: use snake_case property */}
                                                {driver.photo_url ? (
                                                    <img src={driver.photo_url} alt={driver.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs border border-slate-200">
                                                        {driver.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{driver.name}</div>
                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                        {driver.licenses.map((lic) => (
                                                            <span key={lic} className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black border uppercase ${getLicenseColor(lic)}`}>
                                                                {lic}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleEditClick(driver)}
                                                className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    {weekDays.map((day, i) => {
                                        const dateIso = toLocalYMD(day);
                                        const shift = driver.schedule[dateIso];
                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                        // Fix: use snake_case property
                                        const isNonWorkingDay = !(driver.working_days || [1,2,3,4,5,6]).includes(day.getDay());

                                        return (
                                            <td key={i} className={`p-2 border-l border-slate-50 text-center relative ${isWeekend ? 'bg-slate-50/30' : ''}`}>
                                                <button 
                                                    onClick={() => handleCellClick(driver.id, driver.name, dateIso)}
                                                    style={!shift && isNonWorkingDay ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(203, 213, 225, 0.25) 5px, rgba(203, 213, 225, 0.25) 10px)' } : {}}
                                                    className={`w-full h-12 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 group
                                                        ${getShiftStyle(shift)}
                                                        ${!shift && isNonWorkingDay ? 'bg-slate-100 border-dashed border-slate-300 cursor-pointer' : ''}
                                                    `}
                                                >
                                                    {shift ? (
                                                        <>
                                                            {shift.type === 'WORK' ? (
                                                                <>
                                                                    <span className="text-[10px] font-black uppercase">{shift.label || t.drivers.shiftWork}</span>
                                                                    <span className="text-[9px] font-medium opacity-80">{shift.startTime} - {shift.endTime}</span>
                                                                </>
                                                            ) : shift.type === 'ROSTER_FREE' ? (
                                                                <>
                                                                    <span className="text-[10px] font-black uppercase flex items-center gap-1">
                                                                       <CalendarOff size={12} />
                                                                       {t.drivers.shiftRosterFree}
                                                                    </span>
                                                                </>
                                                            ) : shift.type === 'TRAINING' ? (
                                                                <>
                                                                    <span className="text-[10px] font-black uppercase flex items-center gap-1">
                                                                       <GraduationCap size={12} />
                                                                       Code 95
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-[10px] font-black uppercase flex items-center gap-1">
                                                                       {shift.type === 'SICK' ? <Thermometer size={10} /> : <Palmtree size={10} />}
                                                                       {shift.type === 'SICK' ? t.drivers.shiftSick : t.drivers.shiftVacation}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </>
                                                    ) : isNonWorkingDay ? (
                                                        <div className="w-full h-full flex items-center justify-center group-hover:hidden">
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">VRIJ</span>
                                                        </div>
                                                    ) : (
                                                        <div className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-300 flex items-center gap-1">
                                                            <UserCheck size={12} /> +
                                                        </div>
                                                    )}

                                                    {/* Hover Overlay for Planning */}
                                                    {!shift && (
                                                        <div className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-white/90 backdrop-blur-sm transition-all rounded-lg">
                                                             <div className={`text-[10px] font-bold flex items-center gap-1 uppercase ${isNonWorkingDay ? 'text-orange-500' : 'text-slate-400'}`}>
                                                                {isNonWorkingDay ? <AlertTriangle size={12} /> : <Plus size={12} />}
                                                                {isNonWorkingDay ? 'Extra' : 'Plan'}
                                                             </div>
                                                        </div>
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Shift Selection Modal */}
            {selectedCell && (
                <ShiftModal 
                    selectedCell={selectedCell}
                    onClose={() => setSelectedCell(null)}
                    onSave={handleSetSchedule}
                    language={language}
                />
            )}

            {/* Edit Driver Modal */}
            {editingDriver && (
                <EditDriverModal 
                    driver={editingDriver}
                    isNew={isCreatingDriver}
                    fixedRoutes={fixedRoutes}
                    onClose={() => setEditingDriver(null)}
                    onSave={handleSaveDriver}
                    onDelete={onDeleteDriver}
                    language={language}
                />
            )}

            {/* ... (Auto Plan & Advice Modals remain largely same) ... */}
            {showAutoPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-purple-50">
                            <div>
                                <h3 className="text-lg font-black text-purple-900 flex items-center gap-2">
                                    <Sparkles size={20} /> {t.drivers.autoPlanModal.title}
                                </h3>
                            </div>
                            <button onClick={() => setShowAutoPlanModal(false)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 text-sm text-purple-800 leading-relaxed">
                                {t.drivers.autoPlanModal.description}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                                        {t.drivers.autoPlanModal.startDate}
                                    </label>
                                    <input 
                                        type="date" 
                                        value={autoPlanStart}
                                        onChange={(e) => setAutoPlanStart(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                                        {t.drivers.autoPlanModal.endDate}
                                    </label>
                                    <input 
                                        type="date" 
                                        value={autoPlanEnd}
                                        onChange={(e) => setAutoPlanEnd(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <AlertOctagon size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800 font-medium">
                                    {t.drivers.autoPlanModal.warning}
                                </div>
                            </div>

                            <button 
                                onClick={runAutoPlan}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-black shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={20} /> {t.drivers.autoPlanModal.generate}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Advice / Shortage Modal */}
            {showAdviceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-5 border-b border-orange-100 flex justify-between items-center bg-orange-50">
                            <div>
                                <h3 className="text-lg font-black text-orange-900 flex items-center gap-2">
                                    <TriangleAlert size={20} /> {t.drivers.autoPlanModal.shortageTitle}
                                </h3>
                            </div>
                            <button onClick={() => setShowAdviceModal(false)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <p className="text-sm text-slate-600 font-medium">
                                {t.drivers.autoPlanModal.shortageDesc}
                            </p>

                            <div className="space-y-3">
                                {shortageReport.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex flex-col items-center justify-center border border-red-100">
                                                <span className="text-xs font-bold uppercase">{new Date(item.date).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'short' })}</span>
                                                <span className="text-lg font-black">{new Date(item.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900">
                                                    {t.drivers.autoPlanModal.missing}: <span className="text-red-600">{item.count}x {item.license}</span>
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {t.drivers.autoPlanModal.onDate} {new Date(item.date).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { day: 'numeric', month: 'long' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                                <h4 className="text-sm font-black text-emerald-800 flex items-center gap-2 mb-3">
                                    <Lightbulb size={18} /> {t.drivers.autoPlanModal.adviceHeader}
                                </h4>
                                <ul className="space-y-2 text-xs font-medium text-emerald-700">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight size={14} className="mt-0.5 shrink-0" />
                                        {t.drivers.autoPlanModal.adviceHire}
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight size={14} className="mt-0.5 shrink-0" />
                                        {t.drivers.autoPlanModal.adviceReschedule} <span className="font-bold">{new Date(new Date().setDate(new Date().getDate() + 8)).toLocaleDateString()}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                             <button onClick={() => setShowAdviceModal(false)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all">
                                {t.common.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ShiftModalProps {
    selectedCell: { driverId: string, dateIso: string, driverName: string };
    onClose: () => void;
    onSave: (entry: ScheduleEntry | null) => void;
    language: Language;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ selectedCell, onClose, onSave, language }) => {
    // ... (No changes to ShiftModal logic) ...
    const t = translations[language];
    const [type, setType] = useState<ScheduleType>('WORK');
    const [startTime, setStartTime] = useState('07:00');
    const [endTime, setEndTime] = useState('16:00');
    const [label, setLabel] = useState('Dag');

    const handleSave = () => {
        if (type === 'WORK') {
            onSave({ type, startTime, endTime, label });
        } else {
            onSave({ type });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{t.drivers.modal.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            {t.drivers.modal.subtitle} <span className="font-bold text-slate-900">{selectedCell.driverName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">{t.drivers.modal.shifts}</label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button 
                                onClick={() => setType('WORK')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'WORK' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Clock size={20} />
                                <span className="text-[10px] font-black uppercase">{t.drivers.shiftWork}</span>
                            </button>
                            <button 
                                onClick={() => setType('ROSTER_FREE')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'ROSTER_FREE' ? 'bg-slate-100 border-slate-400 text-slate-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <CalendarOff size={20} />
                                <span className="text-[10px] font-black uppercase">{t.drivers.shiftRosterFree}</span>
                            </button>
                        </div>

                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">{t.drivers.modal.absence}</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => setType('SICK')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'SICK' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Thermometer size={20} />
                                <span className="text-[10px] font-black uppercase">{t.drivers.shiftSick}</span>
                            </button>
                            <button 
                                onClick={() => setType('VACATION')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'VACATION' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Palmtree size={20} />
                                <span className="text-[10px] font-black uppercase">{t.drivers.shiftVacation}</span>
                            </button>
                            <button 
                                onClick={() => setType('TRAINING')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'TRAINING' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <GraduationCap size={20} />
                                <span className="text-[10px] font-black uppercase">Code 95</span>
                            </button>
                        </div>
                    </div>

                    {type === 'WORK' && (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Dienst Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => { setLabel('Nacht'); setStartTime('03:00'); setEndTime('12:00'); }}
                                        className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition-all ${label === 'Nacht' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        {t.drivers.modal.night}
                                    </button>
                                    <button 
                                        onClick={() => { setLabel('Vroeg'); setStartTime('05:00'); setEndTime('14:00'); }}
                                        className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition-all ${label === 'Vroeg' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        {t.drivers.modal.early}
                                    </button>
                                    <button 
                                        onClick={() => { setLabel('Dag'); setStartTime('07:00'); setEndTime('16:00'); }}
                                        className={`px-2 py-2 rounded-lg text-[10px] font-bold border transition-all ${label === 'Dag' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        {t.drivers.modal.normal}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Start</label>
                                    <input 
                                        type="time" 
                                        value={startTime} 
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Eind</label>
                                    <input 
                                        type="time" 
                                        value={endTime} 
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => onSave(null)}
                            className="flex-1 py-3 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                        >
                            {t.drivers.modal.clear}
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex-[2] py-3 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg hover:bg-black transition-all"
                        >
                            {t.common.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface EditDriverModalProps {
    driver: Driver;
    isNew: boolean;
    fixedRoutes: FixedRoute[];
    onClose: () => void;
    onSave: (driver: Driver) => void;
    onDelete?: (id: string) => void;
    language: Language;
}

const EditDriverModal: React.FC<EditDriverModalProps> = ({ driver, isNew, fixedRoutes, onClose, onSave, onDelete, language }) => {
    const t = translations[language];
    // Fix: use snake_case property
    const [form, setForm] = useState<Driver>({ ...driver, known_route_ids: driver.known_route_ids || [] });

    const toggleLicense = (lic: LicenseType) => {
        setForm(prev => {
            const exists = prev.licenses.includes(lic);
            let newLicenses = exists 
                ? prev.licenses.filter(l => l !== lic)
                : [...prev.licenses, lic];
            return { ...prev, licenses: newLicenses };
        });
    };

    const toggleRoute = (routeId: string) => {
        setForm(prev => {
            // Fix: use snake_case property
            const exists = (prev.known_route_ids || []).includes(routeId);
            let newRoutes = exists 
                ? (prev.known_route_ids || []).filter(id => id !== routeId)
                : [...(prev.known_route_ids || []), routeId];
            return { ...prev, known_route_ids: newRoutes };
        });
    };

    const toggleWorkingDay = (dayIndex: number) => {
        setForm(prev => {
            // Fix: use snake_case property
            const currentDays = prev.working_days || [1,2,3,4,5,6]; // Default fallback
            let newDays;
            if (currentDays.includes(dayIndex)) {
                newDays = currentDays.filter(d => d !== dayIndex);
            } else {
                newDays = [...currentDays, dayIndex].sort();
            }
            return { ...prev, working_days: newDays };
        });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Fix: use snake_case property
                setForm(prev => ({ ...prev, photo_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        // Fix: use snake_case property
        setForm(prev => ({ ...prev, photo_url: undefined }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{isNew ? t.drivers.manage.newTitle : t.drivers.manage.editTitle}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            ID: <span className="font-mono text-slate-700">{form.id}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Profile Photo Section */}
                    <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                        <div className="relative group">
                            {/* Fix: use snake_case property */}
                            {form.photo_url ? (
                                <img src={form.photo_url} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border-4 border-white shadow-lg">
                                    <User size={40} />
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full cursor-pointer shadow-md transition-colors">
                                <Camera size={14} />
                                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-slate-900 mb-1">{t.drivers.manage.photo}</h4>
                            <div className="flex gap-3">
                                <label className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-2">
                                    <Upload size={14} /> {t.drivers.manage.uploadPhoto}
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                </label>
                                {/* Fix: use snake_case property */}
                                {form.photo_url && (
                                    <button onClick={handleRemovePhoto} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">
                                        {t.drivers.manage.removePhoto}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.drivers.manage.name}</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.drivers.manage.email}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="email" 
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.drivers.manage.phone}</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">{t.drivers.manage.license}</label>
                                <div className="flex gap-2">
                                    {[LicenseType.C, LicenseType.BE, LicenseType.B].map(lic => (
                                        <button
                                            key={lic}
                                            onClick={() => toggleLicense(lic)}
                                            className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                                                form.licenses.includes(lic) 
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                                            }`}
                                        >
                                            {lic}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Working Days Selector */}
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 flex items-center gap-1">
                                    <Calendar size={12} /> {t.drivers.manage.workingDays}
                                </label>
                                <div className="grid grid-cols-7 gap-2">
                                    {[
                                        { i: 1, l: 'Ma' }, { i: 2, l: 'Di' }, { i: 3, l: 'Wo' }, 
                                        { i: 4, l: 'Do' }, { i: 5, l: 'Vr' }, { i: 6, l: 'Za' }, { i: 0, l: 'Zo' }
                                    ].map(day => (
                                        <button
                                            key={day.i}
                                            onClick={() => toggleWorkingDay(day.i)}
                                            // Fix: use snake_case property
                                            className={`h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                                                (form.working_days || []).includes(day.i)
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                        >
                                            {day.l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Route Knowledge Section */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col h-full md:row-span-2">
                            <div className="mb-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.drivers.manage.routeKnowledge}</label>
                                <p className="text-[10px] text-slate-400 leading-tight">{t.drivers.manage.routeKnowledgeDesc}</p>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-1 pr-2 mt-2 custom-scrollbar">
                                {fixedRoutes.map(route => {
                                    // Fix: use snake_case property
                                    const isKnown = (form.known_route_ids || []).includes(route.id);
                                    return (
                                        <div 
                                            key={route.id}
                                            onClick={() => toggleRoute(route.id)}
                                            className={`p-2 rounded-lg border flex items-center gap-3 cursor-pointer transition-all ${
                                                isKnown 
                                                ? 'bg-white border-blue-500 shadow-sm' 
                                                : 'bg-slate-100/50 border-transparent hover:bg-white hover:border-slate-200'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isKnown ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                {isKnown ? <CheckSquare size={14} /> : <Square size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`text-xs font-bold ${isKnown ? 'text-slate-900' : 'text-slate-500'}`}>{route.name}</div>
                                                <div className="text-[9px] text-slate-400">{route.region}</div>
                                            </div>
                                            {/* Fix: use snake_case property */}
                                            <div className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${
                                                route.required_license === LicenseType.C ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                                {route.required_license}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-4">
                    {!isNew && onDelete ? (
                        <button 
                            onClick={() => {
                                if (window.confirm(t.drivers.manage.deleteConfirm)) {
                                    onDelete(form.id);
                                    onClose();
                                }
                            }}
                            className="px-4 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-sm">
                            {t.common.cancel}
                        </button>
                        <button 
                            onClick={() => onSave(form)}
                            className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg hover:bg-black transition-all"
                        >
                            {t.common.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverPlanner;