
import React, { useState, useEffect } from 'react';
import { OptimizationResult, OptimizationAdvice } from '../types';
import { Copy, Mail, X, Check, Loader2, Lightbulb, TrendingDown, ArrowRight, Truck, Leaf, Euro, FileText, Sparkles } from 'lucide-react';

interface EmailReportModalProps {
  result: OptimizationResult;
  onClose: () => void;
  advicePromise: Promise<OptimizationAdvice[]>;
}

const EmailReportModal: React.FC<EmailReportModalProps> = ({ result, onClose, advicePromise }) => {
  const [copied, setCopied] = useState(false);
  const [advice, setAdvice] = useState<OptimizationAdvice[] | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(true);

  useEffect(() => {
    advicePromise
        .then(data => {
            setAdvice(data);
            setLoadingAdvice(false);
        })
        .catch(() => setLoadingAdvice(false));
  }, [advicePromise]);

  const generateReportText = () => {
    let text = `PLANNINGSRAPPORT - TIMO FLEET\n`;
    text += `Datum: ${new Date().toLocaleDateString('nl-NL')}\n\n`;
    
    text += `SAMENVATTING:\n`;
    text += `----------------------------------------\n`;
    text += `Totaal Ritten:      ${result.summary.totalRoutes}\n`;
    text += `Totaal Containers:  ${result.summary.totalContainersMoved}\n`;
    text += `Totale Kosten:      €${result.summary.totalCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}\n`;
    text += `Totale CO2:         ${result.summary.totalEmission} g\n`;
    text += `Totaal KM:          ${result.summary.totalDistance} km\n\n`;

    text += `BESPARINGSADVIES (AI):\n`;
    text += `----------------------------------------\n`;
    if (loadingAdvice) {
        text += `(Wordt berekend...)\n\n`;
    } else if (advice && advice.length > 0) {
        advice.forEach(a => {
            text += `KLANT: ${a.debtorName}\n`;
            text += `  Advies: Wijzig venster van ${a.currentWindow} naar ${a.suggestedWindow}\n`;
            text += `  Reden: ${a.reason} (${a.impactDescription})\n`;
            text += `  Potentiële besparing: €${a.potentialSavingEur}\n\n`;
        });
    } else {
        text += `Geen specifieke besparingen gevonden op basis van venstertijden. De huidige planning is optimaal binnen de gestelde kaders.\n\n`;
    }

    text += `DETAILOVERZICHT PER RIT:\n`;
    text += `----------------------------------------\n`;
    
    result.routes.forEach(route => {
        text += `VOERTUIG: ${route.vehicleId} (${route.vehicleType})\n`;
        text += `Tijd: ${route.startTime} - ${route.endTime} (${Math.floor(route.totalDurationMinutes/60)}u ${route.totalDurationMinutes%60}m)\n`;
        text += `Kosten: €${route.totalCost.toFixed(2)} | CO2: ${route.totalCo2Emission}g | KM: ${route.totalDistanceKm}\n`;
        text += `Stops:\n`;
        route.stops.filter(s => s.type === 'DELIVERY').forEach((stop, idx) => {
            text += `  ${idx + 1}. ${stop.arrivalTime} - ${stop.name} (${stop.city})\n`;
        });
        text += `\n`;
    });

    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const StatCard = ({ icon: Icon, label, value, subValue, colorClass, bgClass }: any) => (
    <div className={`p-5 rounded-2xl border ${bgClass} flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} bg-white shadow-sm`}>
            <Icon size={24} />
        </div>
        <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">{label}</div>
            <div className="text-xl font-black text-slate-900">{value}</div>
            {subValue && <div className="text-xs font-medium text-slate-500">{subValue}</div>}
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg"><Mail size={20} className="text-white"/></div>
              Planning & Strategisch Advies
            </h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1 ml-1">AI-Gedreven Route Optimalisatie Rapport</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
            <div className="p-8 space-y-8">
                
                {/* KPI Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        icon={Euro} 
                        label="Totale Kosten" 
                        value={`€${result.summary.totalCost.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        subValue="Brandstof, Personeel & Asset"
                        colorClass="text-indigo-600"
                        bgClass="bg-white border-slate-200"
                    />
                    <StatCard 
                        icon={Truck} 
                        label="Efficiëntie" 
                        value={`${result.summary.totalRoutes} Ritten`}
                        subValue={`${result.summary.totalDistance} km totaal`}
                        colorClass="text-blue-600"
                        bgClass="bg-white border-slate-200"
                    />
                    <StatCard 
                        icon={Leaf} 
                        label="Ecologische Impact" 
                        value={`${(result.summary.totalEmission / 1000).toFixed(2)} kg`}
                        subValue="CO2 Uitstoot"
                        colorClass="text-emerald-600"
                        bgClass="bg-white border-slate-200"
                    />
                </div>

                {/* AI Advies Sectie */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={18} className="text-emerald-600 fill-emerald-100" />
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">AI Besparingskansen</h4>
                    </div>

                    {loadingAdvice ? (
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-pulse flex flex-col items-center justify-center text-center gap-4">
                             <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-emerald-600" size={24} />
                             </div>
                             <div>
                                <div className="h-4 bg-slate-100 rounded w-48 mx-auto mb-2"></div>
                                <div className="h-3 bg-slate-50 rounded w-64 mx-auto"></div>
                             </div>
                        </div>
                    ) : (advice && advice.length > 0) ? (
                        <div className="grid grid-cols-1 gap-4">
                            {advice.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-2xl border-l-4 border-emerald-500 shadow-sm p-5 flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-shadow">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">Klant</span>
                                            <span className="font-bold text-slate-900">{item.debtorName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-slate-400 line-through decoration-red-400">
                                                <span className="font-mono">{item.currentWindow}</span>
                                            </div>
                                            <ArrowRight size={14} className="text-emerald-500" />
                                            <div className="flex items-center gap-2 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                                <span className="font-mono">{item.suggestedWindow}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 italic border-t border-slate-50 pt-2 mt-2">
                                            "{item.reason}"
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-col items-end pl-6 md:border-l border-slate-100">
                                        <div className="text-[10px] font-black text-emerald-600 uppercase mb-1">Potentiële Winst</div>
                                        <div className="text-2xl font-black text-emerald-700 flex items-center gap-1">
                                            <TrendingDown size={20} /> €{item.potentialSavingEur}
                                        </div>
                                        <div className="text-[9px] text-slate-400 max-w-[120px] text-right mt-1">
                                            {item.impactDescription}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center gap-4 text-slate-400">
                            <Check className="text-emerald-500" size={24} />
                            <span className="text-sm font-medium">Huidige planning is optimaal. Geen significante besparingen gevonden door vensterwijzigingen.</span>
                        </div>
                    )}
                </div>

                {/* Email Preview */}
                <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-slate-400" />
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Email Voorbeeld</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Klaar om te kopiëren</span>
                     </div>
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-inner overflow-hidden">
                        <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                            {generateReportText()}
                        </pre>
                    </div>
                </div>

            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center z-10">
            <div className="text-xs text-slate-400 font-medium hidden md:block">
                Gegenereerd door Gemini 3 Pro AI
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <button onClick={onClose} className="flex-1 md:flex-none px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                    Sluiten
                </button>
                <button 
                    onClick={handleCopy}
                    className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-sm font-black shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${
                        copied 
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/20'
                    }`}
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Gekopieerd!' : 'Kopieer naar Klembord'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmailReportModal;
