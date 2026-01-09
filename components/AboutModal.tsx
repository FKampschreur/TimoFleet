
import React from 'react';
import { X, BookOpen, Target, Zap, TrendingDown, LayoutDashboard, Cpu, BrainCircuit, Activity, BarChart3, Database, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface AboutModalProps {
  onClose: () => void;
  language: Language;
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose, language }) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
               <Database size={24} className="text-emerald-600"/> {t.about.title}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.about.subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white p-8 space-y-12">
            
            {/* High Impact Hero Section inside Modal */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl border border-white/10 group cursor-default">
                {/* Abstract Background Decoration */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[80px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[60px] animate-pulse animation-delay-2000"></div>

                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                        <Sparkles size={12} fill="currentColor" /> Timo Intelligence
                    </div>
                    
                    <div className="max-w-xl space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                            Meester over uw <span className="text-emerald-400">Logistiek</span>
                        </h2>
                        <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">
                            Ervaar de kracht van AI-gedreven routeplanning en realtime vlootbeheer. 
                            Optimaliseer ritten, verlaag kosten en verhoog efficiëntie met één centraal platform.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10">
                            <LayoutDashboard size={16} className="text-emerald-400" /> Smart Planning
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10">
                            <ShieldCheck size={16} className="text-blue-400" /> Veilig & Betrouwbaar
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                {/* Strategic Intro */}
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                    <h4 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                        <Activity className="text-emerald-500" />
                        {t.about.introTitle}
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                        {t.about.introText}
                    </p>
                </div>

                {/* Intelligence & Acronym */}
                <div>
                    <div className="text-center max-w-2xl mx-auto mb-8">
                        <h4 className="text-xl font-black text-slate-900 mb-2">{t.about.intelligenceTitle}</h4>
                        <p className="text-slate-500 text-sm">
                            {t.about.intelligenceText}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* T */}
                        <div className="p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all hover:border-blue-200 group bg-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">T</div>
                                <h5 className="font-black text-slate-900 text-lg">{t.about.acronym_t_title}</h5>
                            </div>
                            <p className="text-sm text-slate-500 pl-[52px]">
                                {t.about.acronym_t_desc}
                            </p>
                        </div>

                        {/* I */}
                        <div className="p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all hover:border-emerald-200 group bg-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">I</div>
                                <h5 className="font-black text-slate-900 text-lg">{t.about.acronym_i_title}</h5>
                            </div>
                            <p className="text-sm text-slate-500 pl-[52px]">
                                {t.about.acronym_i_desc}
                            </p>
                        </div>

                        {/* M */}
                        <div className="p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all hover:border-purple-200 group bg-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">M</div>
                                <h5 className="font-black text-slate-900 text-lg">{t.about.acronym_m_title}</h5>
                            </div>
                            <p className="text-sm text-slate-500 pl-[52px]">
                                {t.about.acronym_m_desc}
                            </p>
                        </div>

                        {/* O */}
                        <div className="p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-all hover:border-orange-200 group bg-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">O</div>
                                <h5 className="font-black text-slate-900 text-lg">{t.about.acronym_o_title}</h5>
                            </div>
                            <p className="text-sm text-slate-500 pl-[52px]">
                                {t.about.acronym_o_desc}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all">
                {t.common.close}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
