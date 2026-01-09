import React, { useState, useCallback, useEffect } from 'react';
import { Debtor, OptimizationResult, PlanningConfig, VehicleType, Vehicle, Language, Route, Stop, PlanningStrategy, OptimizationAdvice } from '../types';
import FileUpload from './FileUpload';
import RouteMap from './RouteMap';
// Fix: added getBrainInstruction to imports from geminiService
import { generateOptimalRoutes, recalculateRouteWithOrder, generateSavingsAdvice, getBrainInstruction } from '../services/geminiService';
import { Truck, Clock, Play, Loader2, Route as RouteIcon, Car, Coffee, Settings, Search, Building, Map as MapIcon, ChevronUp, ChevronDown, Package, CheckCircle2, XCircle, Timer, MapPin, ArrowRight, AlertTriangle, Landmark, Euro, Info, Brain, GitBranch, Eye, X, Mail, AlertOctagon, FileText, Save, RotateCcw, Trash2, Snowflake, Sun } from 'lucide-react';
import { translations } from '../translations';
import EmailReportModal from './EmailReportModal';

interface DashboardProps {
    vehicles: Vehicle[];
    language: Language;
    initialDebtors?: Debtor[];
    setInitialDebtors?: React.Dispatch<React.SetStateAction<Debtor[]>>;
}

const formatDuration = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = Math.round(totalMinutes % 60);
    return `${h}u ${m}m`;
};

const Dashboard: React.FC<DashboardProps> = ({ vehicles, language, initialDebtors, setInitialDebtors }) => {
  // Use passed state if available, otherwise local state (fallback)
  const [localDebtors, setLocalDebtors] = useState<Debtor[]>([]);
  const debtors = initialDebtors || localDebtors;
  const setDebtors = setInitialDebtors ? (data: Debtor[] | ((prev: Debtor[]) => Debtor[])) => setInitialDebtors(data) : setLocalDebtors;

  const [loading, setLoading] = useState(false);
  const [loadingRouteIdx, setLoadingRouteIdx] = useState<number | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBrainModal, setShowBrainModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [advicePromise, setAdvicePromise] = useState<Promise<OptimizationAdvice[]> | null>(null);
  
  // State for editing instructions
  const [tempInstruction, setTempInstruction] = useState('');

  const t = translations[language];
  
  const [config, setConfig] = useState<PlanningConfig>({
    defaultStartTime: '07:00',
    maxRouteDurationHours: 12,
    breakTimeMinutes: 45, 
    maxDrivingTimeBetweenBreaksMinutes: 270, 
    timeWindowToleranceMinutes: 15, 
    depotAddress: 'Bijsterhuizen 2513',
    depotCity: 'Wijchen',
    strictTimeWindows: true,
    selectedStrategy: 'JIT',
    customInstruction: ''
  });

  const handleOptimize = useCallback(async () => {
    if (debtors.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateOptimalRoutes(debtors, vehicles, config);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Fout bij genereren.");
    } finally {
      setLoading(false);
    }
  }, [debtors, vehicles, config]);

  const handleOpenReport = () => {
      if (!result) return;
      setAdvicePromise(generateSavingsAdvice(result.routes, debtors));
      setShowEmailModal(true);
  };

  const handleClearData = () => {
      setDebtors([]);
      setResult(null);
      setError(null);
  };

  const handleOpenInstructionModal = () => {
      // If there is a custom instruction saved, use it. Otherwise, load the default generated text.
      const currentText = config.customInstruction || getBrainInstruction(config.selectedStrategy, config.timeWindowToleranceMinutes, config.maxRouteDurationHours);
      setTempInstruction(currentText);
      setShowBrainModal(true);
  };

  const handleSaveInstruction = () => {
      setConfig(prev => ({ ...prev, customInstruction: tempInstruction }));
      setShowBrainModal(false);
  };

  const handleResetInstruction = () => {
      // Clear custom instruction so it falls back to default generator
      const defaultText = getBrainInstruction(config.selectedStrategy, config.timeWindowToleranceMinutes, config.maxRouteDurationHours);
      setTempInstruction(defaultText);
      setConfig(prev => ({ ...prev, customInstruction: '' }));
  };

  const getStopStatus = (stop: Stop) => {
      if (stop.type !== 'DELIVERY') return null;
      if (stop.lateMinutes && stop.lateMinutes > config.timeWindowToleranceMinutes) return { label: `${stop.lateMinutes}m laat`, color: 'text-red-600 bg-red-50 border-red-100', icon: <XCircle size={10}/> };
      if (stop.lateMinutes && stop.lateMinutes > 0) return { label: `${stop.lateMinutes}m vertraging`, color: 'text-orange-600 bg-orange-50 border-orange-100', icon: <AlertTriangle size={10}/> };
      if (stop.earlyMinutes && stop.earlyMinutes > 0) return { label: `${stop.earlyMinutes}m vroeg`, color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <Clock size={10}/> };
      return { label: 'Binnen venster', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={10}/> };
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="shrink-0" size={20} />
          <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        <div className="lg:col-span-1 space-y-6">
          <FileUpload onDataLoaded={(data) => { setDebtors(data); setResult(null); setError(null); }} />
          
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <Settings size={18} className="text-emerald-600" /> Planning Engine
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Brain size={12} /> Selecteer Strategie
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setConfig(prev => ({ ...prev, selectedStrategy: 'JIT' }))}
                            className={`flex-1 flex items-center p-3 rounded-xl border transition-all text-left group ${config.selectedStrategy === 'JIT' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${config.selectedStrategy === 'JIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Clock size={16} />
                            </div>
                            <div>
                                <div className={`text-xs font-black ${config.selectedStrategy === 'JIT' ? 'text-emerald-900' : 'text-slate-700'}`}>Smart JIT</div>
                                <div className="text-[9px] text-slate-400 font-medium leading-tight">Focus op tijdvensters</div>
                            </div>
                        </button>
                        <button 
                            onClick={handleOpenInstructionModal}
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-400 hover:text-emerald-600 transition-all shadow-sm h-full"
                            title="Bewerk Planning Instructie"
                        >
                            <FileText size={18} />
                        </button>
                    </div>
                </div>
              </div>
              
              <button 
                onClick={handleOptimize} 
                disabled={loading || debtors.length === 0} 
                className="w-full py-5 px-4 rounded-2xl flex items-center justify-center gap-3 font-black text-white bg-slate-900 hover:bg-black shadow-xl disabled:bg-slate-300 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} fill="currentColor" />} Optimaliseer Routes
              </button>
            </div>
          </div>

          {/* Unassigned Orders Section */}
          {result && result.totalUnassigned > 0 && (
            <div className="bg-red-50 rounded-[2rem] border border-red-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-5 border-b border-red-100 flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-xl"><AlertOctagon size={18} /></div>
                    <div>
                        <h3 className="text-xs font-black text-red-900 uppercase tracking-wider">{result.totalUnassigned} Orders Niet Ingepland</h3>
                        <p className="text-[10px] text-red-600 font-medium">Pasten niet binnen venster of ritduur</p>
                    </div>
                </div>
                <div className="p-5 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {/* In een echte app zouden we hier de lijst met namen tonen */}
                    <p className="text-[10px] text-red-500 italic">Deze orders overschrijden de maximale ritduur van {config.maxRouteDurationHours}u of vallen buiten de bloktijden.</p>
                </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-10">
          {result ? (
             <div className="space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full md:w-auto flex-1">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><RouteIcon size={24}/></div>
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aantal Ritten</div>
                                <div className="text-xl font-black text-slate-900">{result.summary.totalRoutes}</div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Package size={24}/></div>
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Containers</div>
                                <div className="text-xl font-black text-slate-900">{result.summary.totalContainersMoved}</div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Euro size={24}/></div>
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale Kosten</div>
                                <div className="text-xl font-black text-slate-900">€{result.summary.totalCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleOpenReport}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-[2rem] shadow-lg flex flex-col items-center justify-center min-w-[140px] transition-all hover:scale-105"
                    >
                        <Mail size={24} className="mb-2" />
                        <span className="text-xs font-black uppercase text-center">Rapport &<br/>Advies</span>
                    </button>
                </div>

                <div className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <RouteMap routes={result.routes} />
                </div>

                <div className="space-y-8">
                    {result.routes.map((route, routeIdx) => {
                        const isRecalculating = loadingRouteIdx === routeIdx;
                        let deliveryCount = 0;
                        let accumulatedKm = 0;

                        return (
                            <div key={routeIdx} className={`bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden transition-all ${isRecalculating ? 'opacity-50 grayscale scale-[0.98]' : ''}`}>
                                
                                <div className="bg-slate-50/50 px-10 py-8 border-b border-slate-100 flex flex-wrap justify-between items-center gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center">
                                            {route.vehicleType === VehicleType.TRUCK ? <Truck className="text-blue-600" size={36} /> : <Car className="text-emerald-600" size={36} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{route.vehicleId}</h4>
                                                <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest">{route.vehicleType}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-5 text-xs font-bold text-slate-400">
                                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-500"/> {formatDuration(route.totalDurationMinutes)}</span>
                                                <span className="flex items-center gap-1.5"><RouteIcon size={14} className="text-blue-500"/> {route.totalDistanceKm} km</span>
                                                <span className="flex items-center gap-1.5"><Package size={14} className="text-orange-500"/> {route.totalContainers} Cont.</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Ritprijs</div>
                                            <div className="text-xl font-black text-emerald-700">
                                                €{route.totalCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto p-2">
                                    <table className="w-full text-left border-separate border-spacing-0">
                                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            <tr>
                                                <th className="px-10 py-5 w-24">Pos</th>
                                                <th className="px-4 py-5 w-32">ETA</th>
                                                <th className="px-4 py-5 w-24">Duur</th>
                                                <th className="px-4 py-5 w-32">Bloktijd</th>
                                                <th className="px-4 py-5">Bestemming</th>
                                                <th className="px-4 py-5">Status</th>
                                                <th className="px-10 py-5 text-right">Afstand</th>
                                            </tr>
                                        </thead>
                                        <tbody className="relative">
                                            <tr className="group">
                                                <td className="px-10 py-6 relative z-10">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border-4 border-white shadow-md flex items-center justify-center text-white"><Building size={16}/></div>
                                                </td>
                                                <td className="px-4 py-6 font-mono font-black text-slate-700">{route.startTime}</td>
                                                <td className="px-4 py-6 text-slate-400">-</td>
                                                <td className="px-4 py-6 text-slate-400">-</td>
                                                <td className="px-4 py-6 font-black text-slate-900 text-sm">Depot Wijchen</td>
                                                <td className="px-4 py-6 uppercase text-[9px] font-black text-slate-300 tracking-widest">Start</td>
                                                <td className="px-10 py-6 text-right font-black text-slate-400">0.0 km</td>
                                            </tr>

                                            {route.stops.map((stop, sIdx) => {
                                                const isDelivery = stop.type === 'DELIVERY';
                                                if (isDelivery) deliveryCount++;
                                                const status = getStopStatus(stop);
                                                accumulatedKm += (stop.distanceFromPreviousStop || 0);

                                                return (
                                                    <tr key={`${routeIdx}-${sIdx}`} className={`group hover:bg-slate-50/50 transition-colors`}>
                                                        <td className="px-10 py-6 relative z-10">
                                                            {isDelivery ? (
                                                                <div className="w-10 h-10 rounded-2xl bg-white border-4 border-slate-900 shadow-sm flex items-center justify-center text-slate-900 font-black text-sm">
                                                                    {deliveryCount}
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-2xl bg-white border-4 border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                                                                    {stop.type === 'BREAK' ? <Coffee size={16}/> : <Timer size={16}/>}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-6 font-mono font-black text-slate-700 text-sm">{stop.arrivalTime}</td>
                                                        <td className="px-4 py-6 text-xs font-bold text-slate-600">
                                                            {stop.durationMinutes}m
                                                        </td>
                                                        <td className="px-4 py-6 font-mono text-xs font-bold text-slate-500">
                                                            {stop.timeWindow || '-'}
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            <div className={`font-black text-sm ${isDelivery ? 'text-slate-900' : 'text-slate-400 italic'}`}>{stop.name}</div>
                                                            {isDelivery && <div className="text-[10px] text-slate-500 mt-0.5">{stop.city}</div>}
                                                        </td>
                                                        <td className="px-4 py-6">
                                                            {status && (
                                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase ${status.color}`}>
                                                                    {status.icon} {status.label}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-10 py-6 text-right font-black text-slate-700 text-xs">
                                                            {accumulatedKm.toFixed(1)} km
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            <tr className="group bg-slate-50/30 border-t border-slate-100">
                                                <td className="px-10 py-6 relative z-10">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border-4 border-white shadow-md flex items-center justify-center text-white"><Building size={16}/></div>
                                                </td>
                                                <td className="px-4 py-6 font-mono font-black text-slate-700">{route.endTime}</td>
                                                <td className="px-4 py-6 text-slate-400">-</td>
                                                <td className="px-4 py-6 text-slate-400">-</td>
                                                <td className="px-4 py-6 font-black text-slate-900 text-sm">Depot Wijchen</td>
                                                <td className="px-4 py-6 uppercase text-[9px] font-black text-slate-300 tracking-widest">Einde</td>
                                                <td className="px-10 py-6 text-right font-black text-slate-900">{route.totalDistanceKm.toFixed(1)} km</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
          ) : debtors.length > 0 ? (
             <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <FileText size={20} />
                            </div>
                            Werklijst (Planning Sandbox)
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-14">
                            {debtors.length} adressen in deze sessie (losgekoppeld van stamgegevens)
                        </p>
                    </div>
                    <button 
                        onClick={handleClearData}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all active:scale-95"
                    >
                        <Trash2 size={16} /> Lijst Wissen
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Klant & Adres</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tijdvenster</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Service Tijd</th>
                                <th className="px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Lading</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {debtors.map((debtor, i) => (
                                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-10 py-4">
                                        <div className="font-bold text-sm text-slate-900">{debtor.name}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            <MapPin size={12} className="text-slate-300"/> 
                                            {debtor.address}, {debtor.city}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                                            <Clock size={12} className="text-slate-400" />
                                            <span className="text-xs font-mono font-bold text-slate-700">
                                                {debtor.time_window_start} - {debtor.time_window_end}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-xs font-bold text-slate-600">{debtor.drop_time_minutes} min</span>
                                    </td>
                                    <td className="px-10 py-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            {(debtor.containers_chilled || 0) > 0 && (
                                                <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                                    <Sun size={12} /> {debtor.containers_chilled}
                                                </span>
                                            )}
                                            {(debtor.containers_frozen || 0) > 0 && (
                                                <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                    <Snowflake size={12} /> {debtor.containers_frozen}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium italic">
                        Klaar om te plannen? Klik op 'Optimaliseer Routes' in het linker menu.
                    </p>
                </div>
             </div>
          ) : (
             <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-32 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner flex items-center justify-center mx-auto mb-10 text-slate-200">
                    <RouteIcon size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Wachtend op data</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Upload een bestand of kopieer selectie vanuit Debiteurenbeheer</p>
             </div>
          )}
        </div>
      </div>
      
      {showBrainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Brain size={24} className="text-emerald-600"/> Planning Instructie Editor
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Pas het algoritme aan voor specifieke wensen</p>
                    </div>
                    <button onClick={() => setShowBrainModal(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    <div className="bg-amber-50 p-3 border-b border-amber-100 text-xs font-medium text-amber-800 flex items-center gap-2 px-8">
                        <AlertOctagon size={14} />
                        Let op: Wijzigingen in deze instructie hebben directe invloed op de output van de AI. Test zorgvuldig.
                    </div>
                    <textarea 
                        value={tempInstruction}
                        onChange={(e) => setTempInstruction(e.target.value)}
                        className="flex-1 w-full p-8 bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none resize-none custom-scrollbar"
                        spellCheck="false"
                    />
                </div>
                <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
                    <button 
                        onClick={handleResetInstruction}
                        className="text-red-500 text-xs font-bold uppercase tracking-widest hover:text-red-700 flex items-center gap-2 transition-colors"
                    >
                        <RotateCcw size={16} /> Reset naar Standaard
                    </button>
                    <div className="flex gap-4">
                        <button onClick={() => setShowBrainModal(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-900">
                            Annuleren
                        </button>
                        <button 
                            onClick={handleSaveInstruction}
                            className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-sm font-black shadow-lg transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Save size={18} /> Instructie Opslaan
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showEmailModal && result && advicePromise && (
          <EmailReportModal 
            result={result} 
            onClose={() => setShowEmailModal(false)} 
            advicePromise={advicePromise}
          />
      )}
    </div>
  );
};

export default Dashboard;