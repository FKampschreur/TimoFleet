import React, { useState, useMemo } from 'react';
import { Debtor, FixedRoute, Language } from '../types';
import { translations } from '../translations';
import { Users, Plus, Edit2, Trash2, X, MapPin, Clock, Search, Building, Boxes, Sun, Snowflake, Map, CalendarDays, CheckSquare, Square, ArrowRight, LayoutDashboard, ArrowUpDown } from 'lucide-react';

interface DebtorManagementProps {
    language: Language;
    debtors: Debtor[];
    fixedRoutes: FixedRoute[];
    onAddDebtor: (debtor: Debtor) => void;
    onUpdateDebtor: (debtor: Debtor) => void;
    onDeleteDebtor: (id: string) => void;
    onCopyToPlanning?: (debtors: Debtor[]) => void;
}

type SortOption = 'name' | 'city' | 'foundation' | 'location';

const DebtorManagement: React.FC<DebtorManagementProps> = ({ language, debtors, fixedRoutes, onAddDebtor, onUpdateDebtor, onDeleteDebtor, onCopyToPlanning }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const t = translations[language];

    const filteredAndSortedDebtors = useMemo(() => {
        // 1. Filter
        let result = debtors.filter(d => 
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (d.foundation_name && d.foundation_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.debtor_number && d.debtor_number.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // 2. Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'city':
                    return a.city.localeCompare(b.city);
                case 'foundation':
                    return (a.foundation_name || '').localeCompare(b.foundation_name || '');
                case 'location':
                    return (a.container_location || '').localeCompare(b.container_location || '');
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return result;
    }, [debtors, searchTerm, sortBy]);

    const handleAddNew = () => {
        setIsCreating(true);
        setEditingDebtor({
            id: crypto.randomUUID(),
            organization_id: 'org-1',
            debtor_number: '',
            foundation_name: '',
            name: '',
            address: '',
            postcode: '',
            city: '',
            container_location: '',
            delivery_days: [1, 2, 3, 4, 5], // Default Ma-Vr
            time_window_start: '09:00',
            time_window_end: '12:00',
            drop_time_minutes: 15,
            containers_chilled: 0,
            containers_frozen: 0
        });
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAndSortedDebtors.length && filteredAndSortedDebtors.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAndSortedDebtors.map(d => d.id)));
        }
    };

    const handleCopy = () => {
        if (onCopyToPlanning && selectedIds.size > 0) {
            const selected = debtors.filter(d => selectedIds.has(d.id));
            onCopyToPlanning(selected);
            setSelectedIds(new Set()); // Reset selection
        }
    };

    const dayLabels = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative pb-24">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Building size={20} /></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.debtors.totalDebtors}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">{debtors.length}</span>
                    </div>
                </div>
                 <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white flex flex-col justify-center items-start md:col-span-3">
                     <h3 className="font-black text-lg mb-1">{t.debtors.title}</h3>
                     <p className="text-xs text-slate-400">{t.debtors.subtitle}</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={t.debtors.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    
                    <div className="relative">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="name">{t.debtors.sort.name}</option>
                            <option value="city">{t.debtors.sort.city}</option>
                            <option value="foundation">{t.debtors.sort.foundation}</option>
                            <option value="location">{t.debtors.sort.location}</option>
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleAddNew}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl shadow-lg transition-all text-sm font-bold active:scale-95"
                >
                    <Plus size={18} /> {t.debtors.addDebtor}
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-5 w-12 text-center">
                                    <button 
                                        onClick={toggleSelectAll}
                                        className="text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {filteredAndSortedDebtors.length > 0 && selectedIds.size === filteredAndSortedDebtors.length ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} />}
                                    </button>
                                </th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.debtors.table.name}</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.debtors.table.address}</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.debtors.table.deliveryDays}</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.debtors.table.timeWindow}</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gekoppelde Rit</th>
                                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.debtors.table.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAndSortedDebtors.map(debtor => {
                                const linkedRoute = fixedRoutes.find(r => r.id === debtor.fixed_route_id);
                                const isSelected = selectedIds.has(debtor.id);
                                return (
                                <tr key={debtor.id} className={`transition-colors group ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                                    <td className="p-5 text-center">
                                        <button onClick={() => toggleSelect(debtor.id)} className="text-slate-300 hover:text-emerald-500 transition-colors">
                                            {isSelected ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} />}
                                        </button>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2 mb-1">
                                            {debtor.debtor_number && (
                                                <span className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-bold">#{debtor.debtor_number}</span>
                                            )}
                                            {debtor.foundation_name && (
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{debtor.foundation_name}</div>
                                            )}
                                        </div>
                                        <div className="font-black text-slate-800 text-sm">{debtor.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 flex items-center gap-1">
                                            <Boxes size={10} /> {debtor.drop_time_minutes} min service
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-start gap-2">
                                            <MapPin size={14} className="text-slate-300 mt-0.5" />
                                            <div>
                                                <div className="text-xs font-bold text-slate-600">{debtor.address}</div>
                                                <div className="text-[10px] text-slate-400">{debtor.postcode} {debtor.city}</div>
                                                {debtor.container_location && (
                                                    <div className="text-[10px] text-indigo-500 font-medium mt-1">
                                                        Locatie: {debtor.container_location}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5, 6, 0].map(day => (
                                                <span 
                                                    key={day} 
                                                    className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold ${
                                                        (debtor.delivery_days || []).includes(day) 
                                                        ? 'bg-slate-900 text-white' 
                                                        : 'bg-slate-100 text-slate-300'
                                                    }`}
                                                >
                                                    {dayLabels[day][0]}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100">
                                            <Clock size={12} />
                                            <span className="text-xs font-black">{debtor.time_window_start} - {debtor.time_window_end}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {linkedRoute ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-[9px] font-black ${linkedRoute.color}`}>
                                                    {linkedRoute.id.split('-')[1]}
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{linkedRoute.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Geen vaste rit</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setIsCreating(false); setEditingDebtor(debtor); }} 
                                                className="p-2 text-slate-300 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => { if(window.confirm('Verwijderen?')) onDeleteDebtor(debtor.id); }} 
                                                className="p-2 text-slate-300 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Selection Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40 animate-in slide-in-from-bottom-10 fade-in border border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm">
                            {selectedIds.size}
                        </div>
                        <span className="font-bold text-sm">{t.debtors.selected}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-700"></div>
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                    >
                        <LayoutDashboard size={18} /> {t.debtors.copyToPlanning}
                    </button>
                    <button onClick={() => setSelectedIds(new Set())} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            )}

            {editingDebtor && (
                <DebtorModal 
                    debtor={editingDebtor} 
                    fixedRoutes={fixedRoutes}
                    isNew={isCreating} 
                    onClose={() => setEditingDebtor(null)} 
                    onSave={(d) => { isCreating ? onAddDebtor(d) : onUpdateDebtor(d); setEditingDebtor(null); }}
                    language={language}
                />
            )}
        </div>
    );
};

interface DebtorModalProps {
    debtor: Debtor;
    fixedRoutes: FixedRoute[];
    isNew: boolean;
    onClose: () => void;
    onSave: (debtor: Debtor) => void;
    language: Language;
}

const DebtorModal: React.FC<DebtorModalProps> = ({ debtor, fixedRoutes, isNew, onClose, onSave, language }) => {
    const [form, setForm] = useState<Debtor>(debtor);
    const t = translations[language];

    const toggleDay = (dayIndex: number) => {
        const currentDays = form.delivery_days || [];
        let newDays;
        if (currentDays.includes(dayIndex)) {
            newDays = currentDays.filter(d => d !== dayIndex);
        } else {
            newDays = [...currentDays, dayIndex].sort();
        }
        setForm({...form, delivery_days: newDays});
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{isNew ? t.debtors.modal.newTitle : t.debtors.modal.editTitle}</h3>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-white rounded-full text-slate-400 hover:text-slate-900 border border-slate-200 transition-all">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.debtors.modal.foundation}</label>
                            <input type="text" value={form.foundation_name || ''} onChange={e => setForm({...form, foundation_name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.debtors.modal.debtorNumber}</label>
                            <input type="text" value={form.debtor_number || ''} onChange={e => setForm({...form, debtor_number: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="1001" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.debtors.modal.name}</label>
                            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.debtors.modal.address}</label>
                            <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.debtors.modal.postcode}</label>
                            <input type="text" value={form.postcode} onChange={e => setForm({...form, postcode: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.debtors.modal.city}</label>
                            <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">{t.debtors.modal.containerLocation}</label>
                            <input type="text" value={form.container_location || ''} onChange={e => setForm({...form, container_location: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex items-center gap-1">
                            <CalendarDays size={12} /> {t.debtors.modal.deliveryDays}
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                            {[
                                { i: 1, l: 'Ma' }, { i: 2, l: 'Di' }, { i: 3, l: 'Wo' }, 
                                { i: 4, l: 'Do' }, { i: 5, l: 'Vr' }, { i: 6, l: 'Za' }, { i: 0, l: 'Zo' }
                            ].map(day => (
                                <button
                                    key={day.i}
                                    onClick={() => toggleDay(day.i)}
                                    className={`h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                                        (form.delivery_days || []).includes(day.i)
                                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                    }`}
                                >
                                    {day.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex items-center gap-1">
                            <Map size={14} className="text-indigo-500"/> Gekoppelde Vaste Rit
                        </label>
                        <select 
                            value={form.fixed_route_id || ''} 
                            onChange={(e) => setForm({...form, fixed_route_id: e.target.value || undefined })}
                            className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">-- Geen Vaste Rit Geselecteerd --</option>
                            {fixedRoutes.map(route => (
                                <option key={route.id} value={route.id}>
                                    {route.id} - {route.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 italic">Selecteer een vaste route om deze debiteur automatisch mee te plannen in de capaciteitsberekening.</p>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-4">
                        <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} /> Levervenster & Bloktijden
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-emerald-600 uppercase block mb-1">{t.debtors.modal.windowStart}</label>
                                <input type="time" value={form.time_window_start} onChange={e => setForm({...form, time_window_start: e.target.value})} className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-emerald-600 uppercase block mb-1">{t.debtors.modal.windowEnd}</label>
                                <input type="time" value={form.time_window_end} onChange={e => setForm({...form, time_window_end: e.target.value})} className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-emerald-600 uppercase block mb-1">{t.debtors.modal.dropTime}</label>
                                <input type="number" value={form.drop_time_minutes} onChange={e => setForm({...form, drop_time_minutes: Number(e.target.value)})} className="w-full px-4 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <label className="text-[10px] font-black text-orange-600 uppercase block mb-1 flex items-center gap-1"><Sun size={12}/> {t.debtors.modal.chilled}</label>
                            <input type="number" value={form.containers_chilled} onChange={e => setForm({...form, containers_chilled: Number(e.target.value)})} className="w-full px-4 py-2 bg-white border border-orange-200 rounded-xl text-sm font-bold outline-none" />
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <label className="text-[10px] font-black text-blue-600 uppercase block mb-1 flex items-center gap-1"><Snowflake size={12}/> {t.debtors.modal.frozen}</label>
                            <input type="number" value={form.containers_frozen} onChange={e => setForm({...form, containers_frozen: Number(e.target.value)})} className="w-full px-4 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold outline-none" />
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-400 hover:text-slate-800">{t.common.cancel}</button>
                    <button onClick={() => onSave(form)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-black">{t.common.save}</button>
                </div>
            </div>
        </div>
    );
};

export default DebtorManagement;