import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, VehicleType, LicenseType, FuelType, Language, Driver } from '../types';
import { Truck, Car, Snowflake, Sun, Battery, Fuel, Edit2, Zap, Settings, Gauge, Wallet, Plus, Trash2, Download, DollarSign, Activity, Users, Boxes, X, ShieldCheck, Leaf, Landmark, User } from 'lucide-react';
import { translations } from '../translations';

interface FleetManagementProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  onToggleAvailability: (id: string) => void;
  onUpdateVehicle: (updatedVehicle: Vehicle) => void;
  onAddVehicle: (newVehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  language: Language;
}

const FleetManagement: React.FC<FleetManagementProps> = ({ vehicles, drivers, onToggleAvailability, onUpdateVehicle, onAddVehicle, onDeleteVehicle, language }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const t = translations[language];

  const stats = useMemo(() => {
    const total = vehicles.length;
    // Fix: use snake_case properties
    const available = vehicles.filter(v => v.is_available).length;
    const electric = vehicles.filter(v => v.fuel_type === FuelType.ELECTRIC).length;
    const cLicense = vehicles.filter(v => v.license_required === LicenseType.C).length;
    const totalChilled = vehicles.reduce((acc, v) => acc + v.capacity.chilled, 0);
    const totalFrozen = vehicles.reduce((acc, v) => acc + v.capacity.frozen, 0);
    const assigned = vehicles.filter(v => !!v.assigned_driver_id).length;
    
    return { total, available, electric, cLicense, totalChilled, totalFrozen, assigned };
  }, [vehicles]);

  const groupedVehicles = useMemo(() => {
    return {
      // Fix: use snake_case property
      heavy: vehicles.filter(v => v.license_required === LicenseType.C),
      light: vehicles.filter(v => v.license_required !== LicenseType.C)
    };
  }, [vehicles]);

  const handleAddNew = () => {
      const newId = `AUTO-${Math.floor(Math.random() * 10000)}`;
      // Fix: use snake_case properties
      const emptyVehicle: Vehicle = {
          id: newId,
          organization_id: 'temp-org-id', // Placeholder
          license_plate: '',
          brand: '',
          type: VehicleType.TRUCK,
          license_required: LicenseType.C,
          capacity: { chilled: 0, frozen: 0 },
          fuel_type: FuelType.DIESEL,
          max_range_km: 500,
          consumption_per_100km: 25,
          fuel_price_per_unit: 1.45,
          co2_emission_per_km: 600,
          is_available: true,
          hourly_rate: 35, // Updated default from 65 to 35
          monthly_fixed_cost: 1500
      };
      setSelectedVehicle(emptyVehicle);
      setIsCreatingNew(true);
  };

  const handleExportCSV = () => {
    if (vehicles.length === 0) return;

    const headers = [
      'ID', 'Kenteken', 'Merk', 'Type', 'Rijbewijs', 'Chauffeur',
      'Capaciteit Koel', 'Capaciteit Vries', 'Brandstof', 
      'Bereik (km)', 'Verbruik/100km', 'Prijs/Eenheid', 
      'CO2/km', 'Uurtarief', 'Maandlasten', 'Beschikbaar'
    ].join(';');

    const rows = vehicles.map(v => {
      // Fix: use snake_case property
      const driver = drivers.find(d => d.id === v.assigned_driver_id);
      // Fix: use snake_case properties
      return [
      v.id,
      v.license_plate || 'N.v.t.',
      v.brand,
      v.type,
      v.license_required,
      driver ? driver.name : 'Geen',
      v.capacity.chilled,
      v.capacity.frozen,
      v.fuel_type,
      v.max_range_km,
      v.consumption_per_100km,
      v.fuel_price_per_unit,
      v.co2_emission_per_km,
      v.hourly_rate,
      v.monthly_fixed_cost,
      v.is_available ? 'Ja' : 'Nee'
    ].join(';')});

    const csvContent = headers + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vloot_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Fleet Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Truck size={20} /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Totale Vloot</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.total}</span>
                <span className="text-xs text-slate-500 font-medium">voertuigen</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-medium"> waarvan {stats.available} momenteel actief</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Groot Materieel</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.cLicense}</span>
                <span className="text-xs text-slate-500 font-medium">C-Rijbewijs</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-500 font-bold">
                 {stats.assigned} vaste koppelingen
            </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Boxes size={20} /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capaciteit</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.totalChilled + stats.totalFrozen}</span>
                <span className="text-xs text-slate-500 font-medium">Containers</span>
            </div>
            <div className="mt-2 text-[11px] flex gap-2">
                <span className="text-orange-600 flex items-center gap-0.5"><Sun size={10}/> {stats.totalChilled}</span>
                <span className="text-blue-600 flex items-center gap-0.5"><Snowflake size={10}/> {stats.totalFrozen}</span>
            </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Zap size={20} /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duurzaamheid</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.electric}</span>
                <span className="text-xs text-slate-500 font-medium">Elektrisch</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 font-bold">0g CO2 uitstoot</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-3">
            <Activity className="text-emerald-500" /> Vlootoverzicht & Status
        </h2>
        <div className="flex gap-3">
            <button
                onClick={handleExportCSV}
                disabled={vehicles.length === 0}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            >
                <Download size={18} /> Export CSV
            </button>
            <button 
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl shadow-lg transition-all text-sm font-bold active:scale-95"
            >
                <Plus size={18} /> Voertuig Toevoegen
            </button>
        </div>
      </div>

      <div className="space-y-12">
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-px bg-slate-200 flex-grow"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4">Zwaar Materieel (Rijbewijs C)</span>
                <div className="h-px bg-slate-200 flex-grow"></div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {groupedVehicles.heavy.map(v => (
                    <VehicleCard key={v.id} vehicle={v} drivers={drivers} onToggle={onToggleAvailability} onEdit={setSelectedVehicle} language={language} />
                ))}
            </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="h-px bg-slate-200 flex-grow"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4">Licht Materieel (Rijbewijs B / BE)</span>
                <div className="h-px bg-slate-200 flex-grow"></div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {groupedVehicles.light.map(v => (
                    <VehicleCard key={v.id} vehicle={v} drivers={drivers} onToggle={onToggleAvailability} onEdit={setSelectedVehicle} language={language} />
                ))}
            </div>
        </div>
      </div>

      {selectedVehicle && (
        <EditVehicleModal 
            vehicle={selectedVehicle} 
            drivers={drivers}
            allVehicles={vehicles}
            isNew={isCreatingNew}
            onClose={() => {
                setSelectedVehicle(null);
                setIsCreatingNew(false);
            }} 
            onSave={(v) => {
                if (isCreatingNew) onAddVehicle(v);
                else onUpdateVehicle(v);
                setSelectedVehicle(null);
            }} 
            onDelete={(id) => {
                if (window.confirm("Zeker weten?")) {
                    onDeleteVehicle(id);
                    setSelectedVehicle(null);
                }
            }}
            language={language}
        />
      )}
    </div>
  );
};

const VehicleCard: React.FC<{ 
    vehicle: Vehicle, 
    drivers: Driver[],
    onToggle: (id: string) => void, 
    onEdit: (v: Vehicle) => void,
    language: Language 
}> = ({ vehicle, drivers, onToggle, onEdit, language }) => {
    // Fix: use snake_case properties
    const isElectric = vehicle.fuel_type === FuelType.ELECTRIC;
    const isTruck = vehicle.type === VehicleType.TRUCK;
    const assignedDriver = vehicle.assigned_driver_id ? drivers.find(d => d.id === vehicle.assigned_driver_id) : null;

    return (
        // Fix: use snake_case property
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md ${!vehicle.is_available ? 'opacity-60 grayscale' : ''}`}>
            <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative ${isElectric ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        {isTruck ? <Truck size={28} /> : <Car size={28} />}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white ${isElectric ? 'bg-emerald-500' : 'bg-slate-500'}`}>
                            {isElectric ? <Zap size={12} fill="currentColor" /> : <Fuel size={12} />}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            {/* Fix: use snake_case property */}
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{vehicle.license_plate || 'N.v.t.'}</h3>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">ID: {vehicle.id}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{vehicle.brand} • {vehicle.type}</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            {/* Fix: use snake_case property */}
                            <div className="text-xs font-black text-slate-900">€{vehicle.monthly_fixed_cost}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Lease p/m</div>
                        </div>
                        <button 
                            onClick={() => onToggle(vehicle.id)}
                            // Fix: use snake_case property
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${
                                vehicle.is_available ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                        >
                            {/* Fix: use snake_case property */}
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${vehicle.is_available ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <button 
                        onClick={() => onEdit(vehicle)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                    >
                        <Edit2 size={16} />
                    </button>
                </div>
            </div>

            <div className="px-5 pb-5 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span>Capaciteit</span>
                        <span className="text-slate-900">{vehicle.capacity.chilled + vehicle.capacity.frozen} cont.</span>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
                        <div className="bg-orange-400 h-full" style={{ width: `${(vehicle.capacity.chilled / 35) * 100}%` }}></div>
                        <div className="bg-blue-400 h-full" style={{ width: `${(vehicle.capacity.frozen / 35) * 100}%` }}></div>
                    </div>
                    
                    {/* Assigned Driver Section */}
                    {assignedDriver ? (
                        <div className="mt-2 flex items-center gap-2 bg-purple-50 p-1.5 rounded-lg border border-purple-100">
                            <div className="w-5 h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-[9px] font-black">
                                {assignedDriver.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-[9px] font-black text-purple-900 truncate">{assignedDriver.name}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 text-[9px] font-medium text-slate-400 flex items-center gap-1 p-1.5">
                           <User size={10} /> Geen vaste chauffeur
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Gauge size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Tarieven</span>
                        </div>
                        {/* Fix: use snake_case property */}
                        <span className="text-xs font-black text-slate-900">€{vehicle.hourly_rate} p/u</span>
                    </div>
                    <div className="mt-1 text-[9px] text-slate-400 font-medium">
                        {/* Fix: use snake_case property */}
                        Afschrijving: €{((vehicle.monthly_fixed_cost || 0) / 160).toFixed(2)} p/u
                    </div>
                </div>
            </div>
        </div>
    );
};

interface EditVehicleModalProps {
    vehicle: Vehicle;
    drivers: Driver[];
    allVehicles: Vehicle[];
    isNew: boolean;
    onClose: () => void;
    onSave: (vehicle: Vehicle) => void;
    onDelete: (id: string) => void;
    language: Language;
}

const EditVehicleModal: React.FC<EditVehicleModalProps> = ({ vehicle, drivers, allVehicles, isNew, onClose, onSave, onDelete, language }) => {
    const [form, setForm] = useState<Vehicle>(JSON.parse(JSON.stringify(vehicle)));
    const t = translations[language];

    const handleChange = (field: keyof Vehicle, value: any) => {
        let updatedForm = { ...form, [field]: value };
        // Fix: use snake_case properties
        if (field === 'license_required') {
            updatedForm.hourly_rate = value === LicenseType.C ? 35 : 30; // Updated logic: 35 for C, 30 for B/BE
            // Clear assigned driver if license mismatches (simple check)
            if (updatedForm.assigned_driver_id) {
                const driver = drivers.find(d => d.id === updatedForm.assigned_driver_id);
                // Simple logic: if driver exists but license isn't compatible, clear it? 
            }
        }
        setForm(updatedForm);
    };

    const handleNestedChange = (parent: 'capacity', field: string, value: any) => {
        setForm(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }));
    };

    // Filter compatible AND available drivers
    const compatibleDrivers = useMemo(() => {
        // Find all driver IDs that are assigned to OTHER vehicles
        const assignedDriverIds = new Set(
            allVehicles
                .filter(v => v.id !== form.id) // Don't count the current vehicle's assignment against itself
                // Fix: use snake_case property
                .map(v => v.assigned_driver_id)
                .filter(id => !!id)
        );

        return drivers.filter(d => {
            // 1. Check if already assigned to another truck
            if (assignedDriverIds.has(d.id)) return false;

            // 2. License Check - Does driver HAVE the required license?
            // Fix: use snake_case property
            return d.licenses.includes(form.license_required);
        });
        // Fix: use snake_case property
    }, [drivers, form.license_required, allVehicles, form.id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
                
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">{isNew ? "Nieuw Voertuig" : "Voertuig Aanpassen"}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{isNew ? "Voeg een nieuwe asset toe aan de vloot" : `Wijziging voertuig ID: ${form.id}`}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Settings size={14} /> Algemene Informatie
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Intern ID</label>
                                <input 
                                    type="text" 
                                    value={form.id} 
                                    disabled={!isNew}
                                    onChange={e => handleChange('id', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Kenteken</label>
                                <input 
                                    type="text" 
                                    // Fix: use snake_case property
                                    value={form.license_plate} 
                                    onChange={e => handleChange('license_plate', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Merk / Model</label>
                                <input 
                                    type="text" 
                                    value={form.brand} 
                                    onChange={e => handleChange('brand', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Type Voertuig</label>
                                <select 
                                    value={form.type}
                                    onChange={e => handleChange('type', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none"
                                >
                                    <option value={VehicleType.TRUCK}>{VehicleType.TRUCK}</option>
                                    <option value={VehicleType.VAN}>{VehicleType.VAN}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <ShieldCheck size={14} /> Chauffeur & Rijbewijs
                            </h4>
                            <select 
                                // Fix: use snake_case property
                                value={form.license_required}
                                onChange={e => handleChange('license_required', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none appearance-none"
                            >
                                <option value={LicenseType.C}>C - Groot Vrachtwagen (€35 p/u)</option>
                                <option value={LicenseType.BE}>BE - Bestelbus met aanhanger (€30 p/u)</option>
                                <option value={LicenseType.B}>B - Standaard Bestelbus (€30 p/u)</option>
                            </select>
                            
                            <div className="relative">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                    <User size={12} className="text-purple-500"/> Vaste Chauffeur
                                </label>
                                <select 
                                    // Fix: use snake_case property
                                    value={form.assigned_driver_id || ''}
                                    onChange={e => handleChange('assigned_driver_id', e.target.value === '' ? undefined : e.target.value)}
                                    className="w-full px-4 py-2 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none appearance-none"
                                >
                                    <option value="">-- Geen vaste chauffeur --</option>
                                    {compatibleDrivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.name} ({driver.licenses.join(', ')})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-slate-400 mt-1 italic">
                                    Alleen beschikbare chauffeurs met geschikt rijbewijs worden getoond (reeds gekoppelde chauffeurs zijn verborgen).
                                </p>
                            </div>

                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mt-2">
                                <label className="text-[10px] font-black text-emerald-600 uppercase mb-2 block">Uurloon Chauffeur (€)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-emerald-900">€</span>
                                    <input 
                                        type="number" 
                                        // Fix: use snake_case property
                                        value={form.hourly_rate} 
                                        onChange={e => handleChange('hourly_rate', Number(e.target.value))}
                                        className="bg-transparent border-none text-xl font-black text-emerald-900 w-full outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <Landmark size={14} /> Financiële Lasten
                            </h4>
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                                <label className="text-[10px] font-black text-indigo-600 uppercase mb-2 block">Maandlasten (Lease/Afschrijving)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-indigo-900">€</span>
                                    <input 
                                        type="number" 
                                        // Fix: use snake_case property
                                        value={form.monthly_fixed_cost} 
                                        onChange={e => handleChange('monthly_fixed_cost', Number(e.target.value))}
                                        className="bg-transparent border-none text-xl font-black text-indigo-900 w-full outline-none"
                                    />
                                </div>
                                <p className="text-[10px] text-indigo-400 mt-1 italic">Vaste kosten per maand voor het voertuig</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Gauge size={14} /> Technische Specificaties
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Brandstof Type</label>
                                <select 
                                    // Fix: use snake_case property
                                    value={form.fuel_type}
                                    onChange={e => handleChange('fuel_type', e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                >
                                    <option value={FuelType.DIESEL}>{FuelType.DIESEL}</option>
                                    <option value={FuelType.ELECTRIC}>{FuelType.ELECTRIC}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Max. Bereik (km)</label>
                                <input 
                                    type="number" 
                                    // Fix: use snake_case property
                                    value={form.max_range_km} 
                                    onChange={e => handleChange('max_range_km', Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Verbruik / 100km</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    // Fix: use snake_case property
                                    value={form.consumption_per_100km} 
                                    onChange={e => handleChange('consumption_per_100km', Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex items-center gap-1">
                                    <Leaf size={12} className="text-emerald-500" /> CO2 Uitstoot (g/km)
                                </label>
                                <input 
                                    type="number" 
                                    // Fix: use snake_case property
                                    value={form.co2_emission_per_km} 
                                    onChange={e => handleChange('co2_emission_per_km', Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                           <Boxes size={14} /> Laadcapaciteit (Containers)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-black text-orange-900">KOELVERS</div>
                                    <div className="text-[9px] font-bold text-orange-600 uppercase">Aantal containers</div>
                                </div>
                                <input 
                                    type="number"
                                    value={form.capacity.chilled}
                                    onChange={e => handleNestedChange('capacity', 'chilled', Number(e.target.value))}
                                    className="w-16 bg-white border border-orange-200 rounded-xl py-2 text-center text-lg font-black text-orange-900"
                                />
                            </div>
                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-black text-blue-900">DIEPVRIES</div>
                                    <div className="text-[9px] font-bold text-blue-600 uppercase">Aantal containers</div>
                                </div>
                                <input 
                                    type="number"
                                    value={form.capacity.frozen}
                                    onChange={e => handleNestedChange('capacity', 'frozen', Number(e.target.value))}
                                    className="w-16 bg-white border border-blue-200 rounded-xl py-2 text-center text-lg font-black text-blue-900"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <button 
                        onClick={() => onDelete(form.id)}
                        className="text-red-500 text-xs font-bold uppercase tracking-widest hover:text-red-700 transition-colors flex items-center gap-1"
                    >
                        <Trash2 size={14} /> Verwijder Asset
                    </button>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900">Annuleer</button>
                        <button 
                            onClick={() => onSave(form)}
                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-black transition-all active:scale-95"
                        >
                            Sla Wijzigingen Op
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FleetManagement;