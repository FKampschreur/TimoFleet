import React, { useState } from 'react';
import { FixedRoute, Driver, LicenseType, Language, Vehicle, Debtor } from '../types';
import { translations } from '../translations';
import { MapPin, Clock, CalendarDays, ChevronLeft, ChevronRight, User, Plus, Search, X, Check, AlertCircle, UserX, AlertTriangle, Medal, Star, TrendingUp, Edit2, Calendar, Layout, Box, Snowflake, Sun, Trash2, ShieldCheck, Leaf, Map, Truck, Package, Eye, Power } from 'lucide-react';

interface FixedRoutePlannerProps {
    language: Language;
    drivers: Driver[];
    fixedRoutes: FixedRoute[];
    setFixedRoutes: React.Dispatch<React.SetStateAction<FixedRoute[]>>;
    vehicles?: Vehicle[];
    debtors: Debtor[];
    onUpdateDebtor?: (debtor: Debtor) => void;
}

const FixedRoutePlanner: React.FC<FixedRoutePlannerProps> = ({ language, drivers, fixedRoutes, setFixedRoutes, vehicles = [], debtors = [], onUpdateDebtor }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCell, setSelectedCell] = useState<{routeId: string, dateIso: string, routeName: string} | null>(null);
    const [editingRoute, setEditingRoute] = useState<FixedRoute | null>(null);
    const [driverSearch, setDriverSearch] = useState('');
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>(''); 
    const [selectedRouteDay, setSelectedRouteDay] = useState<{routeId: string, date: Date} | null>(null); // For Detail Modal
    const t = translations[language];

    // Helper to get start of current week (Monday)
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
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

    const handleCellClick = (routeId: string, routeName: string, dateIso: string, isActive: boolean) => {
        if (!isActive) return;
        setSelectedCell({ routeId, routeName, dateIso });
        setSelectedVehicleId(''); // Reset vehicle selection
    };

    const handleShowDayDetails = (routeId: string, date: Date) => {
        setSelectedRouteDay({ routeId, date });
    };

    const handleAssignDriver = (driverId: string) => {
        if (!selectedCell) return;
        
        let finalVehicleId = selectedVehicleId;
        if (!finalVehicleId) {
             const preferredVehicle = vehicles.find(v => v.assigned_driver_id === driverId);
             if (preferredVehicle) {
                 finalVehicleId = preferredVehicle.id;
             }
        }

        setFixedRoutes(prev => prev.map(route => {
            if (route.id !== selectedCell.routeId) return route;
            return {
                ...route,
                assignments: {
                    ...route.assignments,
                    [selectedCell.dateIso]: driverId
                },
                vehicleAssignments: {
                    ...(route.vehicleAssignments || {}),
                    [selectedCell.dateIso]: finalVehicleId
                }
            };
        }));
        setSelectedCell(null);
    };

    const handleClearAssignment = () => {
        if (!selectedCell) return;
        setFixedRoutes(prev => prev.map(route => {
             if (route.id !== selectedCell.routeId) return route;
             const newAssignments = { ...route.assignments };
             delete newAssignments[selectedCell.dateIso];
             
             const newVehicleAssignments = { ...(route.vehicleAssignments || {}) };
             delete newVehicleAssignments[selectedCell.dateIso];

             return { ...route, assignments: newAssignments, vehicleAssignments: newVehicleAssignments };
        }));
        setSelectedCell(null);
    };

    const toggleRouteDay = (dayIndex: number) => {
        if (!editingRoute) return;
        const currentDays = editingRoute.allowed_days || [];
        let newDays;
        if (currentDays.includes(dayIndex)) {
            newDays = currentDays.filter(d => d !== dayIndex);
        } else {
            newDays = [...currentDays, dayIndex].sort();
        }
        setEditingRoute({ ...editingRoute, allowed_days: newDays });
    };

    const saveRouteChanges = () => {
        if (!editingRoute) return;
        setFixedRoutes(prev => {
            const exists = prev.some(r => r.id === editingRoute.id);
            if (exists) {
                return prev.map(r => r.id === editingRoute.id ? editingRoute : r);
            } else {
                return [...prev, editingRoute];
            }
        });
        setEditingRoute(null);
    };

    const handleDeleteRoute = () => {
        if (!editingRoute) return;
        if (window.confirm(t.fixedRoutes.edit.deleteConfirm)) {
             setFixedRoutes(prev => prev.filter(r => r.id !== editingRoute.id));
             setEditingRoute(null);
        }
    };

    const handleAddRoute = () => {
        const existingIds = fixedRoutes
            .map(r => parseInt(r.id.split('-')[1]))
            .filter(n => !isNaN(n));
        
        const nextNum = (Math.max(...existingIds, 0) + 1);
        const nextNumStr = nextNum.toString().padStart(2, '0');
        const newId = `RT-${nextNumStr}`;
        
        const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-rose-500', 'bg-pink-500'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newRoute: FixedRoute = {
            id: newId,
            organization_id: 'temp-org',
            name: `${nextNumStr}. Nieuwe Route`,
            region: 'Nieuwe Regio',
            standard_start_time: '06:00',
            duration_hours: 8,
            required_license: LicenseType.C,
            requires_electric: false,
            color: randomColor,
            allowed_days: [1, 2, 3, 4, 5, 6], 
            assignments: {},
            capacity: { chilled: 0, frozen: 0 }
        };
        
        setEditingRoute(newRoute);
    };

    const getAvailableDriverCount = (route: FixedRoute, dateIso: string): number => {
        const routeStartMinutes = timeToMinutes(route.standard_start_time);
        
        return drivers.filter(d => {
            const schedule = d.schedule[dateIso];
            if (!schedule || schedule.type !== 'WORK') return false;
            if (!d.licenses.includes(route.required_license)) return false;
            
            if (schedule.startTime) {
                const driverStartMinutes = timeToMinutes(schedule.startTime);
                if (driverStartMinutes > routeStartMinutes) return false;
            }

            const isAssignedElsewhere = fixedRoutes.some(r => 
                r.id !== route.id && 
                r.assignments[dateIso] === d.id
            );
            if (isAssignedElsewhere) return false;

            return true;
        }).length;
    };

    return (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                     <h3 className="text-2xl font-black text-slate-900">{t.fixedRoutes.title}</h3>
                     <p className="text-sm text-slate-500 font-medium">{t.fixedRoutes.subtitle}</p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleAddRoute}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl shadow-lg transition-all text-sm font-bold active:scale-95"
                    >
                        <Plus size={18} /> {t.fixedRoutes.addRoute}
                    </button>

                    <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-600">
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
                        <button onClick={handleNextWeek} className="p-2 hover:bg-slate-50 rounded-lg transition-all text-slate-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="p-4 bg-slate-50 border-b border-slate-200 min-w-[300px] sticky left-0 z-10 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.fixedRoutes.routeInfo}</div>
                                </th>
                                {weekDays.map((day, i) => (
                                    <th key={i} className={`p-4 bg-slate-50 border-b border-slate-200 min-w-[140px] text-center ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-50/50' : ''}`}>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {day.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'short' })}
                                        </div>
                                        <div className={`text-sm font-black ${day.toDateString() === new Date().toDateString() ? 'text-emerald-600 bg-emerald-50 px-2 rounded-lg inline-block' : 'text-slate-900'}`}>
                                            {day.getDate()}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {fixedRoutes.map(route => {
                                const linkedDebtors = debtors.filter(d => d.fixed_route_id === route.id);
                                const totalChilled = linkedDebtors.reduce((sum, d) => sum + (d.containers_chilled || 0), 0);
                                const totalFrozen = linkedDebtors.reduce((sum, d) => sum + (d.containers_frozen || 0), 0);

                                return (
                                <tr key={route.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm font-black text-xs shrink-0 ${route.color}`}>
                                                    {route.id.split('-')[1]}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900">{route.name}</div>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                                            <MapPin size={10} /> {route.region}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                            <Clock size={10} /> {route.standard_start_time} ({route.duration_hours}u)
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-2" title="Totale lading (alle dagen)">
                                                            <span className="flex items-center gap-1 text-orange-600"><Sun size={10} /> {totalChilled}</span>
                                                            <span className="w-px h-3 bg-slate-300"></span>
                                                            <span className="flex items-center gap-1 text-blue-600"><Snowflake size={10} /> {totalFrozen}</span>
                                                        </span>
                                                        {route.requires_electric && (
                                                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1" title="Elektrisch voertuig vereist">
                                                                <Leaf size={10} /> EV
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setEditingRoute({ ...route })}
                                                className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title={t.fixedRoutes.edit.title}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                        <div className="mt-2 pl-14">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                                route.required_license === LicenseType.C ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                route.required_license === LicenseType.BE ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                                {t.fixedRoutes.requiredLicense}: {route.required_license}
                                            </span>
                                        </div>
                                    </td>
                                    {weekDays.map((day, i) => {
                                        const dateIso = day.toISOString().split('T')[0];
                                        const assignedDriverId = route.assignments[dateIso];
                                        const assignedDriver = assignedDriverId ? drivers.find(d => d.id === assignedDriverId) : null;
                                        
                                        const assignedVehicleId = route.vehicleAssignments ? route.vehicleAssignments[dateIso] : null;
                                        const assignedVehicle = assignedVehicleId ? vehicles.find(v => v.id === assignedVehicleId) : null;

                                        const dayIndex = day.getDay();
                                        const isActiveDay = (route.allowed_days || [1,2,3,4,5,6]).includes(dayIndex); 
                                        const isWeekend = dayIndex === 0 || dayIndex === 6;
                                        const knowsRoute = assignedDriver && (assignedDriver.known_route_ids || []).includes(route.id);
                                        
                                        const availableCount = isActiveDay && !assignedDriver ? getAvailableDriverCount(route, dateIso) : 0;
                                        const isImpossible = isActiveDay && !assignedDriver && availableCount === 0;

                                        // Stop Counter Calculation
                                        const stopsForDay = linkedDebtors.filter(d => (d.delivery_days || []).includes(dayIndex));
                                        const stopCount = stopsForDay.length;

                                        return (
                                            <td key={i} className={`p-2 border-l border-slate-50 text-center relative ${isWeekend ? 'bg-slate-50/30' : ''}`}>
                                                {!isActiveDay ? (
                                                    <div className="w-full h-16 rounded-xl border border-slate-100 bg-slate-100/50 flex items-center justify-center opacity-50 relative overflow-hidden">
                                                        <div className="absolute inset-0 pattern-diagonal-lines opacity-10"></div>
                                                        <span className="text-[10px] font-bold text-slate-300 transform -rotate-12 select-none">Vrij</span>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleCellClick(route.id, route.name, dateIso, isActiveDay)}
                                                        className={`w-full h-16 rounded-xl border-2 transition-all relative overflow-hidden group/cell ${
                                                            assignedDriver 
                                                                ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md' 
                                                                : `flex flex-col items-center justify-center gap-1 ${
                                                                    isImpossible
                                                                        ? 'bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer'
                                                                        : 'bg-slate-50 border-dashed border-slate-200 hover:border-slate-400 hover:bg-white'
                                                                  }`
                                                        }`}
                                                    >
                                                        {assignedDriver ? (
                                                            <>
                                                                <div className="flex flex-col items-start justify-center h-full pl-3 pb-0.5">
                                                                    <div className="relative mb-1">
                                                                        {assignedDriver.photo_url ? (
                                                                            <img src={assignedDriver.photo_url} alt={assignedDriver.name} className="w-6 h-6 rounded-full object-cover border border-slate-200 shadow-sm" />
                                                                        ) : (
                                                                            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-black">
                                                                                {assignedDriver.name.split(' ').map(n => n[0]).join('')}
                                                                            </div>
                                                                        )}
                                                                        {knowsRoute && (
                                                                            <div className="absolute -bottom-1.5 -right-1.5 bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10" title="Kent deze route">
                                                                                <Map size={8} fill="currentColor" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-slate-700 truncate w-full text-left pr-1">
                                                                        {assignedDriver.name}
                                                                    </div>
                                                                </div>
                                                                
                                                                {assignedVehicle && (
                                                                    <div className="absolute top-1 right-1 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[8px] font-black text-slate-600 flex items-center gap-1 shadow-sm">
                                                                        <Truck size={8} className="text-slate-400" /> {assignedVehicle.license_plate}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : isImpossible ? (
                                                            <>
                                                                <div className="text-red-400 animate-pulse">
                                                                    <AlertTriangle size={20} />
                                                                </div>
                                                                <div className="text-[9px] font-black text-red-500 uppercase">Geen Chauffeur</div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="text-slate-300">
                                                                    <Plus size={16} />
                                                                </div>
                                                                {availableCount < 3 && (
                                                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[8px] font-bold flex items-center justify-center border border-orange-200">
                                                                        {availableCount}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* STOP COUNTER - CLICK TO OPEN DETAIL */}
                                                        {stopCount > 0 && (
                                                            <div 
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent opening driver select
                                                                    handleShowDayDetails(route.id, day);
                                                                }}
                                                                className={`absolute bottom-1 right-1 z-20 px-1.5 py-0.5 rounded text-[8px] font-black flex items-center gap-1 border transition-all hover:scale-110 active:scale-95 ${
                                                                    assignedDriver ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' : 'bg-white text-slate-400 border-slate-200 shadow-sm'
                                                                }`}
                                                                title="Bekijk stops en beheer leverdagen"
                                                            >
                                                                <Package size={8} /> {stopCount}
                                                            </div>
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Selection Modal (Driver) */}
            {selectedCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">{t.fixedRoutes.modalTitle}</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    {t.fixedRoutes.modalSubtitle} <span className="font-bold text-slate-900">{selectedCell.routeName}</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedCell(null)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder={t.fixedRoutes.searchDriver}
                                    value={driverSearch}
                                    onChange={(e) => setDriverSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                             </div>
                             
                             {/* Vehicle Selector in Modal */}
                             <div>
                                <select 
                                    value={selectedVehicleId}
                                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">-- Automatisch Voorkeursvoertuig --</option>
                                    {vehicles.filter(v => v.is_available).map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.license_plate} - {v.brand} ({v.type})
                                        </option>
                                    ))}
                                </select>
                             </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Logic to find available drivers */}
                            {(() => {
                                const currentRoute = fixedRoutes.find(r => r.id === selectedCell.routeId);
                                const availableDrivers = drivers.filter(d => {
                                    const schedule = d.schedule[selectedCell.dateIso];
                                    if (!schedule || schedule.type !== 'WORK') return false;
                                    if (currentRoute && !d.licenses.includes(currentRoute.required_license)) return false;
                                    
                                    if (currentRoute && schedule.startTime) {
                                        const routeStartMinutes = timeToMinutes(currentRoute.standard_start_time);
                                        const driverStartMinutes = timeToMinutes(schedule.startTime);
                                        if (driverStartMinutes > routeStartMinutes) return false;
                                    }

                                    const isAssignedElsewhere = fixedRoutes.some(r => 
                                        r.id !== selectedCell.routeId && 
                                        r.assignments[selectedCell.dateIso] === d.id
                                    );
                                    if (isAssignedElsewhere) return false;

                                    if (!d.name.toLowerCase().includes(driverSearch.toLowerCase())) return false;
                                    
                                    return true;
                                });

                                if (availableDrivers.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                                            <AlertCircle size={24} className="text-red-400" />
                                            <p className="text-sm font-medium text-slate-600">{t.fixedRoutes.noDrivers}</p>
                                        </div>
                                    );
                                }

                                const sortedDrivers = availableDrivers.sort((a, b) => {
                                    if (!currentRoute) return 0;
                                    const aKnows = (a.known_route_ids || []).includes(currentRoute.id) ? 1 : 0;
                                    const bKnows = (b.known_route_ids || []).includes(currentRoute.id) ? 1 : 0;
                                    if (aKnows !== bKnows) return bKnows - aKnows; 

                                    const routeStart = timeToMinutes(currentRoute.standard_start_time);
                                    const startA = timeToMinutes(a.schedule[selectedCell.dateIso].startTime!);
                                    const startB = timeToMinutes(b.schedule[selectedCell.dateIso].startTime!);
                                    return (routeStart - startA) - (routeStart - startB);
                                });

                                const top3 = sortedDrivers.slice(0, 3);
                                const others = sortedDrivers.slice(3);

                                const renderDriverButton = (driver: Driver, index: number, isTop: boolean) => {
                                    const knowsRoute = currentRoute && (driver.known_route_ids || []).includes(currentRoute.id);
                                    const preferredVehicle = vehicles.find(v => v.assigned_driver_id === driver.id);

                                    return (
                                    <button
                                        key={driver.id}
                                        onClick={() => handleAssignDriver(driver.id)}
                                        className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between group ${
                                            isTop 
                                            ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md' 
                                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {driver.photo_url ? (
                                                    <img src={driver.photo_url} alt={driver.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                                                        isTop ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {driver.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                )}
                                                
                                                {isTop && index === 0 && (
                                                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-white shadow-sm z-10">
                                                        <Star size={8} fill="currentColor" />
                                                    </div>
                                                )}

                                                {knowsRoute && (
                                                    <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm z-10" title="Kent deze route">
                                                        <Map size={8} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-left">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="text-sm font-black text-slate-900">{driver.name}</div>
                                                    {knowsRoute && (
                                                        <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                                                            <Map size={8} /> Kent Route
                                                        </span>
                                                    )}
                                                    {isTop && index === 0 && (
                                                        <span className="text-[8px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                                                            Best Match
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                        {driver.licenses.map(lic => (
                                                            <span key={lic} className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                                {lic}
                                                            </span>
                                                        ))}
                                                    </span>
                                                    {preferredVehicle && !selectedVehicleId && (
                                                        <span className="text-[9px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                            <Truck size={8}/> {preferredVehicle.license_plate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                            isTop 
                                            ? 'border-emerald-200 bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' 
                                            : 'border-slate-200 text-transparent group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                                        }`}>
                                            <Check size={16} />
                                        </div>
                                    </button>
                                )};

                                return (
                                    <>
                                        {top3.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 px-1">
                                                    <Medal size={14} className="text-yellow-500" />
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Top 3 Aanbevelingen
                                                    </h4>
                                                </div>
                                                <div className="space-y-2">
                                                    {top3.map((d, i) => renderDriverButton(d, i, true))}
                                                </div>
                                            </div>
                                        )}

                                        {others.length > 0 && (
                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center gap-2 px-1">
                                                    <User size={14} className="text-slate-400" />
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Overige Opties
                                                    </h4>
                                                </div>
                                                <div className="space-y-2 opacity-80">
                                                    {others.map((d, i) => renderDriverButton(d, i, false))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                             <button 
                                onClick={handleClearAssignment}
                                className="w-full py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                             >
                                 {t.common.delete}
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ROUTE DAY DETAIL MODAL */}
            {selectedRouteDay && (
                <RouteDayDetailModal 
                    routeId={selectedRouteDay.routeId}
                    date={selectedRouteDay.date}
                    debtors={debtors}
                    fixedRoutes={fixedRoutes}
                    onClose={() => setSelectedRouteDay(null)}
                    onUpdateDebtor={onUpdateDebtor}
                    language={language}
                />
            )}

            {/* Route Edit Modal */}
            {editingRoute && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">{fixedRoutes.some(r => r.id === editingRoute.id) ? t.fixedRoutes.edit.title : t.fixedRoutes.edit.newTitle}</h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    ID: <span className="font-mono text-slate-700">{editingRoute.id}</span>
                                </p>
                            </div>
                            <button onClick={() => setEditingRoute(null)} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-sm text-blue-800 leading-relaxed">
                                {t.fixedRoutes.edit.description}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.fixedRoutes.edit.name}</label>
                                    <input 
                                        type="text" 
                                        value={editingRoute.name} 
                                        onChange={(e) => setEditingRoute({...editingRoute, name: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.fixedRoutes.edit.region}</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            value={editingRoute.region} 
                                            onChange={(e) => setEditingRoute({...editingRoute, region: e.target.value})}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.fixedRoutes.edit.startTime}</label>
                                    <input 
                                        type="time" 
                                        value={editingRoute.standard_start_time} 
                                        onChange={(e) => setEditingRoute({...editingRoute, standard_start_time: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.fixedRoutes.edit.duration}</label>
                                    <input 
                                        type="number" 
                                        value={editingRoute.duration_hours} 
                                        onChange={(e) => setEditingRoute({...editingRoute, duration_hours: Number(e.target.value)})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                        <ShieldCheck size={12} className="text-emerald-500"/> {t.fixedRoutes.requiredLicense}
                                    </label>
                                    <select
                                        value={editingRoute.required_license}
                                        onChange={(e) => setEditingRoute({...editingRoute, required_license: e.target.value as LicenseType})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value={LicenseType.B}>Rijbewijs B (Bestelbus)</option>
                                        <option value={LicenseType.BE}>Rijbewijs BE (Aanhanger)</option>
                                        <option value={LicenseType.C}>Rijbewijs C (Vrachtwagen)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Electric Requirement Toggle */}
                            <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                <div className={`p-2 rounded-lg ${editingRoute.requires_electric ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}>
                                    <Leaf size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-slate-900">{t.fixedRoutes.edit.requiresElectric}</div>
                                    <div className="text-[10px] text-slate-500">Alleen elektrische voertuigen toegestaan</div>
                                </div>
                                <button
                                    onClick={() => setEditingRoute({...editingRoute, requires_electric: !editingRoute.requires_electric})}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                                        editingRoute.requires_electric ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        editingRoute.requires_electric ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {/* Container Capacity Fields Removed in Edit Modal because they are now calculated */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                                <p className="text-xs text-slate-500">Container aantallen worden automatisch berekend op basis van gekoppelde debiteuren.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                    <Calendar size={12} /> {t.fixedRoutes.edit.days}
                                </label>
                                <div className="grid grid-cols-7 gap-2">
                                    {[
                                        { i: 1, l: 'Ma' }, { i: 2, l: 'Di' }, { i: 3, l: 'Wo' }, 
                                        { i: 4, l: 'Do' }, { i: 5, l: 'Vr' }, { i: 6, l: 'Za' }, { i: 0, l: 'Zo' }
                                    ].map(day => (
                                        <button
                                            key={day.i}
                                            onClick={() => toggleRouteDay(day.i)}
                                            className={`h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                                                (editingRoute.allowed_days || []).includes(day.i)
                                                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                        >
                                            {day.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 flex justify-between items-center gap-4">
                                {fixedRoutes.some(r => r.id === editingRoute.id) ? (
                                    <button 
                                        onClick={handleDeleteRoute}
                                        className="px-4 py-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl text-sm font-bold transition-all flex items-center gap-2"
                                    >
                                        <Trash2 size={18} /> {t.fixedRoutes.edit.deleteRoute}
                                    </button>
                                ) : (
                                    <div></div>
                                )}
                                <button 
                                    onClick={saveRouteChanges}
                                    className="px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-black shadow-lg hover:shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 ml-auto"
                                >
                                    <Check size={18} /> {t.common.save}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface RouteDayDetailModalProps {
    routeId: string;
    date: Date;
    debtors: Debtor[];
    fixedRoutes: FixedRoute[];
    onClose: () => void;
    onUpdateDebtor?: (debtor: Debtor) => void;
    language: Language;
}

const RouteDayDetailModal: React.FC<RouteDayDetailModalProps> = ({ routeId, date, debtors, fixedRoutes, onClose, onUpdateDebtor, language }) => {
    const t = translations[language];
    const route = fixedRoutes.find(r => r.id === routeId);
    const dayIndex = date.getDay();
    const dayName = date.toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    // Filter debtors linked to this route AND active on this day
    const activeDebtors = debtors.filter(d => d.fixed_route_id === routeId && (d.delivery_days || []).includes(dayIndex));
    
    // Also find debtors linked to this route but NOT active on this day (optional, for adding)
    // For now, let's just focus on removing active ones as requested.

    const toggleDebtorDay = (debtor: Debtor) => {
        if (!onUpdateDebtor) return;
        const currentDays = debtor.delivery_days || [];
        let newDays;
        if (currentDays.includes(dayIndex)) {
            newDays = currentDays.filter(d => d !== dayIndex);
        } else {
            newDays = [...currentDays, dayIndex].sort();
        }
        onUpdateDebtor({ ...debtor, delivery_days: newDays });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{t.fixedRoutes.dayDetail.title}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                            {t.fixedRoutes.dayDetail.subtitle} <span className="font-bold text-slate-900">{route?.name}</span> op <span className="font-bold text-emerald-600 capitalize">{dayName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeDebtors.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <Package size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">{t.fixedRoutes.dayDetail.empty}</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.fixedRoutes.dayDetail.stops} ({activeDebtors.length})</h4>
                            </div>
                            <div className="space-y-2">
                                {activeDebtors.map(debtor => (
                                    <div key={debtor.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all group">
                                        <div>
                                            <div className="font-bold text-sm text-slate-900">{debtor.name}</div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <MapPin size={10} /> {debtor.address}, {debtor.city}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => toggleDebtorDay(debtor)}
                                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 group-hover:visible"
                                            title="Klik om deze dag te verwijderen voor deze klant"
                                        >
                                            <span className="group-hover:hidden flex items-center gap-1"><Check size={10} /> {t.fixedRoutes.dayDetail.active}</span>
                                            <span className="hidden group-hover:flex items-center gap-1"><X size={10} /> {t.fixedRoutes.dayDetail.inactive}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all">
                        {t.common.close}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FixedRoutePlanner;