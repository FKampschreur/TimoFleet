import React, { useState, useMemo } from 'react';
import { TimeRecord, Driver, FixedRoute, Language } from '../types';
import { translations } from '../translations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Clock, Calendar, User, Map, Plus, ArrowRight, Lightbulb, Trophy, AlertTriangle, Timer, Activity, Edit2, Trash2, X, Check, Save, Ban, RotateCcw, MessageSquareWarning, Filter } from 'lucide-react';

interface PerformanceModuleProps {
    language: Language;
    drivers: Driver[];
    fixedRoutes: FixedRoute[];
}

// Mock initial data if not provided (in a real app this comes from Supabase)
import { MOCK_TIME_RECORDS } from '../constants';

const PerformanceModule: React.FC<PerformanceModuleProps> = ({ language, drivers, fixedRoutes }) => {
    const [activeTab, setActiveTab] = useState<'input' | 'analysis'>('analysis');
    const [records, setRecords] = useState<TimeRecord[]>(MOCK_TIME_RECORDS);
    const [selectedRouteId, setSelectedRouteId] = useState<string>('');
    const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);
    const [showExcludedModal, setShowExcludedModal] = useState(false);
    
    // Date Filters for Analysis
    const [analysisStartDate, setAnalysisStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]); // Default 1 month ago
    const [analysisEndDate, setAnalysisEndDate] = useState(new Date().toISOString().split('T')[0]); // Default today
    const [analysisDayOfWeek, setAnalysisDayOfWeek] = useState<string>('ALL'); // 'ALL' or '0'-'6'

    const t = translations[language];

    // Form State for NEW records
    const [newRecord, setNewRecord] = useState<Partial<TimeRecord>>({
        date: new Date().toISOString().split('T')[0],
        start_time: '07:00',
        end_time: '16:00'
    });

    const excludedCount = records.filter(r => r.exclude_from_analysis).length;

    const handleAddRecord = () => {
        if (!newRecord.date || !newRecord.driver_id || !newRecord.route_id || !newRecord.start_time || !newRecord.end_time) {
            alert("Vul alle velden in");
            return;
        }

        const start = new Date(`1970-01-01T${newRecord.start_time}:00`);
        const end = new Date(`1970-01-01T${newRecord.end_time}:00`);
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;

        if (durationMinutes <= 0) {
            alert("Eindtijd moet na starttijd liggen");
            return;
        }

        const record: TimeRecord = {
            id: `TR-${Date.now()}`,
            organization_id: 'org-1',
            date: newRecord.date,
            driver_id: newRecord.driver_id,
            route_id: newRecord.route_id,
            start_time: newRecord.start_time,
            end_time: newRecord.end_time,
            duration_minutes: durationMinutes,
            remarks: newRecord.remarks
        };

        setRecords(prev => [...prev, record]);
        // Reset form slightly but keep date
        setNewRecord(prev => ({ ...prev, driver_id: '', route_id: '', remarks: '' }));
    };

    const handleDeleteRecord = (id: string) => {
        if (window.confirm(t.performance.modal.deleteConfirm)) {
            setRecords(prev => prev.filter(r => r.id !== id));
            if (editingRecord?.id === id) setEditingRecord(null);
        }
    };

    const handleRestoreRecord = (id: string) => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, exclude_from_analysis: false } : r));
    };

    const handleSaveEdit = (updatedRecord: TimeRecord) => {
        // Recalculate duration if times changed
        const start = new Date(`1970-01-01T${updatedRecord.start_time}:00`);
        const end = new Date(`1970-01-01T${updatedRecord.end_time}:00`);
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;

        const finalRecord = { ...updatedRecord, duration_minutes: durationMinutes };

        setRecords(prev => prev.map(r => r.id === finalRecord.id ? finalRecord : r));
        setEditingRecord(null);
    };

    const analysisData = useMemo(() => {
        if (!selectedRouteId) return null;

        // FILTER: Route ID + Not Excluded + Within Date Range + Correct Day of Week
        const routeRecords = records.filter(r => {
            const isRouteMatch = r.route_id === selectedRouteId;
            const isNotExcluded = !r.exclude_from_analysis;
            const isWithinRange = r.date >= analysisStartDate && r.date <= analysisEndDate;
            
            let isDayMatch = true;
            if (analysisDayOfWeek !== 'ALL') {
                const dateObj = new Date(r.date);
                // getDay() returns 0 for Sunday, 1 for Monday, etc.
                isDayMatch = dateObj.getDay().toString() === analysisDayOfWeek;
            }

            return isRouteMatch && isNotExcluded && isWithinRange && isDayMatch;
        });

        if (routeRecords.length === 0) return null;

        // Group by Driver
        const driverStats: { [key: string]: { totalMin: number, count: number, name: string } } = {};
        
        routeRecords.forEach(r => {
            if (!driverStats[r.driver_id]) {
                const driverName = drivers.find(d => d.id === r.driver_id)?.name || 'Onbekend';
                driverStats[r.driver_id] = { totalMin: 0, count: 0, name: driverName };
            }
            driverStats[r.driver_id].totalMin += r.duration_minutes;
            driverStats[r.driver_id].count += 1;
        });

        // Calculate Averages
        const chartData = Object.keys(driverStats).map(dId => {
            const avg = driverStats[dId].totalMin / driverStats[dId].count;
            return {
                name: driverStats[dId].name,
                avgMinutes: Math.round(avg),
                avgHours: (avg / 60).toFixed(1),
                count: driverStats[dId].count
            };
        }).sort((a, b) => a.avgMinutes - b.avgMinutes); // Sort fastest to slowest

        const overallAvg = chartData.reduce((acc, curr) => acc + curr.avgMinutes, 0) / chartData.length;
        const fastest = chartData[0];
        const slowest = chartData[chartData.length - 1];

        return { chartData, overallAvg, fastest, slowest };
    }, [selectedRouteId, records, drivers, analysisStartDate, analysisEndDate, analysisDayOfWeek]);

    const formatDuration = (min: number) => {
        const h = Math.floor(min / 60);
        const m = Math.round(min % 60);
        return `${h}u ${m}m`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div>
                    <h3 className="text-2xl font-black text-slate-900">{t.performance.title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{t.performance.subtitle}</p>
                </div>
                <div className="bg-slate-100 p-1 rounded-xl flex">
                    <button 
                        onClick={() => setActiveTab('input')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'input' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Clock size={16} /> {t.performance.tabInput}
                    </button>
                    <button 
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'analysis' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Activity size={16} /> {t.performance.tabAnalysis}
                    </button>
                </div>
            </div>

            {activeTab === 'input' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Form */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
                        <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-emerald-500"/> {t.performance.addRecord}
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.date}</label>
                                <input type="date" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.driver}</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select 
                                        value={newRecord.driver_id || ''} 
                                        onChange={e => setNewRecord({...newRecord, driver_id: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                                    >
                                        <option value="">Selecteer Chauffeur...</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.route}</label>
                                <div className="relative">
                                    <Map size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select 
                                        value={newRecord.route_id || ''} 
                                        onChange={e => setNewRecord({...newRecord, route_id: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                                    >
                                        <option value="">Selecteer Route...</option>
                                        {fixedRoutes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.start}</label>
                                    <input type="time" value={newRecord.start_time} onChange={e => setNewRecord({...newRecord, start_time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.end}</label>
                                    <input type="time" value={newRecord.end_time} onChange={e => setNewRecord({...newRecord, end_time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.remarks}</label>
                                <textarea 
                                    value={newRecord.remarks || ''} 
                                    onChange={e => setNewRecord({...newRecord, remarks: e.target.value})} 
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                                    placeholder="Bijv: Vertraging door file"
                                />
                            </div>
                            <button onClick={handleAddRecord} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg hover:bg-black transition-all active:scale-95">
                                {t.common.save}
                            </button>
                        </div>
                    </div>

                    {/* Recent Table */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-black text-slate-900">Recente Registraties</h4>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.performance.table.date}</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.performance.table.driver}</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.performance.table.route}</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.performance.table.duration}</th>
                                        <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.performance.table.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[...records].reverse().slice(0, 10).map(rec => {
                                        const drv = drivers.find(d => d.id === rec.driver_id);
                                        const rt = fixedRoutes.find(r => r.id === rec.route_id);
                                        return (
                                            <tr key={rec.id} className={`hover:bg-slate-50/50 transition-colors ${rec.exclude_from_analysis ? 'opacity-60 bg-slate-50' : ''}`}>
                                                <td className="px-6 py-3 text-sm font-bold text-slate-700">{rec.date}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black">
                                                            {drv?.name.charAt(0)}
                                                        </div>
                                                        <span className={`text-sm font-bold text-slate-900 ${rec.exclude_from_analysis ? 'line-through decoration-red-400' : ''}`}>{drv?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-xs font-medium text-slate-600">
                                                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2">{rec.route_id}</span>
                                                    {rt?.name}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                                                    {formatDuration(rec.duration_minutes)}
                                                    {rec.exclude_from_analysis && <span className="ml-2 text-[10px] text-red-500 uppercase tracking-tight font-black">(Uitgesloten)</span>}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => setEditingRecord(rec)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteRecord(rec.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analysis' && (
                <div className="space-y-8">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setShowExcludedModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-200"
                        >
                            <Ban size={14} /> {t.performance.viewExcluded} 
                            {excludedCount > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[9px]">{excludedCount}</span>}
                        </button>
                    </div>

                    {/* Filter Bar (Route + Date Range + Weekday) */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                        {/* Route Selector */}
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t.performance.selectRoute}</label>
                            <div className="relative">
                                <TrendingUp size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select 
                                    value={selectedRouteId}
                                    onChange={(e) => setSelectedRouteId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                                >
                                    <option value="">-- Kies een route --</option>
                                    {fixedRoutes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Date Range Selectors */}
                        <div className="md:col-span-2 flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t.performance.periodStart}</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="date"
                                        value={analysisStartDate}
                                        onChange={(e) => setAnalysisStartDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t.performance.periodEnd}</label>
                                <div className="relative">
                                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="date"
                                        value={analysisEndDate}
                                        onChange={(e) => setAnalysisEndDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Day of Week Selector */}
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">{t.performance.filterDay}</label>
                            <div className="relative">
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select 
                                    value={analysisDayOfWeek}
                                    onChange={(e) => setAnalysisDayOfWeek(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                                >
                                    <option value="ALL">{t.performance.allDays}</option>
                                    <option value="1">{t.performance.weekDays[1]}</option> {/* Maandag */}
                                    <option value="2">{t.performance.weekDays[2]}</option> {/* Dinsdag */}
                                    <option value="3">{t.performance.weekDays[3]}</option> {/* Woensdag */}
                                    <option value="4">{t.performance.weekDays[4]}</option> {/* Donderdag */}
                                    <option value="5">{t.performance.weekDays[5]}</option> {/* Vrijdag */}
                                    <option value="6">{t.performance.weekDays[6]}</option> {/* Zaterdag */}
                                    <option value="0">{t.performance.weekDays[0]}</option> {/* Zondag */}
                                </select>
                            </div>
                        </div>
                    </div>

                    {analysisData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Chart */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Timer size={20} className="text-blue-500"/> Vergelijking Rijtijden (Gemiddeld)
                                </h4>
                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analysisData.chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                                            <Tooltip 
                                                cursor={{fill: 'transparent'}}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl">
                                                                <p className="font-bold text-sm mb-1">{data.name}</p>
                                                                <p className="text-emerald-400 font-mono font-bold">{formatDuration(data.avgMinutes)}</p>
                                                                <p className="text-slate-400 mt-1">{data.count} ritten geregistreerd</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="avgMinutes" radius={[0, 10, 10, 0]} barSize={24}>
                                                {analysisData.chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === analysisData.chartData.length - 1 ? '#f43f5e' : '#64748b'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Insights Panel */}
                            <div className="space-y-6">
                                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                            <Trophy size={16} /> {t.performance.fastest}
                                        </h4>
                                        <div className="text-3xl font-black mb-1">{analysisData.fastest.name}</div>
                                        <div className="text-emerald-300 font-mono font-bold text-xl mb-4">
                                            {formatDuration(analysisData.fastest.avgMinutes)}
                                        </div>
                                        <div className="text-xs text-slate-400 leading-relaxed">
                                            Gemiddeld <span className="text-white font-bold">{formatDuration(Math.round(analysisData.overallAvg - analysisData.fastest.avgMinutes))}</span> sneller dan het routegemiddelde.
                                        </div>
                                    </div>
                                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                                        <Timer size={200} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <Lightbulb size={16} className="text-amber-500" /> {t.performance.insight}
                                    </h4>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1"><AlertTriangle size={16} className="text-orange-500" /></div>
                                            <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                                <span className="font-bold text-slate-900">{analysisData.slowest.name}</span> doet gemiddeld <span className="font-bold text-orange-600">{formatDuration(Math.round(analysisData.slowest.avgMinutes - analysisData.fastest.avgMinutes))}</span> langer over deze route dan de snelste chauffeur.
                                            </p>
                                        </div>
                                        <div className="h-px bg-slate-100"></div>
                                        <p className="text-[10px] text-slate-400 italic">
                                            Tip: Bespreek met {analysisData.slowest.name} of er specifieke uitdagingen zijn bij de afleveradressen of in het verkeer op hun dagen.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center flex flex-col items-center justify-center text-slate-400">
                            <Activity size={48} className="mb-4 opacity-50" />
                            <p className="text-sm font-bold">Selecteer een route om de analyse te starten</p>
                        </div>
                    )}
                </div>
            )}

            {/* EDIT MODAL */}
            {editingRecord && (
                <EditRecordModal 
                    record={editingRecord}
                    drivers={drivers}
                    fixedRoutes={fixedRoutes}
                    onClose={() => setEditingRecord(null)}
                    onSave={handleSaveEdit}
                    onDelete={handleDeleteRecord}
                    t={t}
                />
            )}

            {/* EXCLUDED RECORDS MODAL */}
            {showExcludedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Ban size={20} className="text-red-500" /> {t.performance.modal.excludedTitle}
                                </h3>
                            </div>
                            <button onClick={() => setShowExcludedModal(false)} className="p-2.5 bg-white rounded-full text-slate-400 hover:text-slate-900 border border-slate-200 transition-all shadow-sm">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {excludedCount === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                                    <Check size={48} className="text-emerald-200 mb-4" />
                                    <p className="font-bold text-sm">{t.performance.modal.noExcluded}</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.performance.table.date}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.performance.table.driver}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.performance.table.route}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">{t.performance.table.remarks}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actie</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {records.filter(r => r.exclude_from_analysis).sort((a,b) => b.date.localeCompare(a.date)).map(rec => {
                                            const drv = drivers.find(d => d.id === rec.driver_id);
                                            const rt = fixedRoutes.find(r => r.id === rec.route_id);
                                            return (
                                                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{rec.date}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black">
                                                                {drv?.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-900">{drv?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                                                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2">{rec.route_id}</span>
                                                        {rt?.name}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {rec.remarks ? (
                                                            <div className="flex items-start gap-2">
                                                                <MessageSquareWarning size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                                                <span className="text-xs text-slate-700 italic font-medium">{rec.remarks}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => handleRestoreRecord(rec.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide transition-all"
                                                        >
                                                            <RotateCcw size={12} /> {t.performance.modal.restore}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowExcludedModal(false)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all">
                                {t.common.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface EditRecordModalProps {
    record: TimeRecord;
    drivers: Driver[];
    fixedRoutes: FixedRoute[];
    onClose: () => void;
    onSave: (record: TimeRecord) => void;
    onDelete: (id: string) => void;
    t: any;
}

const EditRecordModal: React.FC<EditRecordModalProps> = ({ record, drivers, fixedRoutes, onClose, onSave, onDelete, t }) => {
    const [form, setForm] = useState(record);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{t.performance.modal.title}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {record.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white rounded-full text-slate-400 hover:text-slate-900 border border-slate-200 transition-all shadow-sm">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.date}</label>
                            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.driver}</label>
                            <select 
                                value={form.driver_id} 
                                onChange={e => setForm({...form, driver_id: e.target.value})}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                            >
                                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.route}</label>
                        <select 
                            value={form.route_id} 
                            onChange={e => setForm({...form, route_id: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        >
                            {fixedRoutes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.start}</label>
                            <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.end}</label>
                            <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.performance.form.remarks}</label>
                        <textarea 
                            value={form.remarks || ''} 
                            onChange={e => setForm({...form, remarks: e.target.value})} 
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none h-24 resize-none"
                            placeholder="Reden voor afwijking..."
                        />
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                        <div className="mt-0.5">
                            <input 
                                type="checkbox" 
                                id="exclude"
                                checked={form.exclude_from_analysis || false} 
                                onChange={e => setForm({...form, exclude_from_analysis: e.target.checked})}
                                className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="exclude" className="text-sm font-bold text-red-900 block cursor-pointer">{t.performance.modal.exclude}</label>
                            <p className="text-[10px] text-red-700 leading-tight mt-1">{t.performance.modal.excludeDesc}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <button 
                        onClick={() => onDelete(record.id)}
                        className="text-red-500 text-xs font-bold uppercase tracking-widest hover:text-red-700 flex items-center gap-2 transition-colors"
                    >
                        <Trash2 size={16} /> {t.common.delete}
                    </button>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors">{t.common.cancel}</button>
                        <button onClick={() => onSave(form)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2">
                            <Save size={16} /> {t.common.save}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PerformanceModule;