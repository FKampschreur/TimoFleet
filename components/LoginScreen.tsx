import React, { useState } from 'react';
import { Truck, Mail, Lock, Loader2, AlertTriangle, ArrowRight, Sparkles, ShieldCheck, Zap, Leaf } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../translations';
import { login } from '../auth';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  language: Language;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, language }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const user = await login(email, password);
        onLoginSuccess(user);
    } catch (err: any) {
        console.error("Auth Error:", err);
        setError(err.message || t.login.error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden p-4 md:p-8 font-sans">
        {/* Abstract Background Decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

        {/* Central Master Card */}
        <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row relative z-10 border border-white">
            
            {/* Left Side: Brand & Value (Dark) */}
            <div className="md:w-[45%] bg-slate-900 p-10 md:p-14 text-white relative flex flex-col justify-between overflow-hidden">
                {/* Internal Glow for depth */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
                            <Truck size={28} className="text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase">Timo<span className="text-emerald-500">Fleet</span></span>
                    </div>

                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                            <Sparkles size={10} fill="currentColor" /> Intelligence Platform
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight">
                            Strategisch <br />
                            <span className="text-emerald-400">Vlootbeheer.</span>
                        </h1>
                        <p className="text-slate-400 text-sm lg:text-base font-medium leading-relaxed max-w-sm">
                            Transformeer logistieke data in rendement. Beheer chauffeurs, optimaliseer routes en verlaag uw CO2-footprint met één krachtig dashboard.
                        </p>
                    </div>

                    <div className="space-y-5 mt-12">
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/10 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                <Zap size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-slate-200">Efficiëntie</div>
                                <div className="text-[10px] text-slate-500 font-bold">AI-gestuurde routeoptimalisatie</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 border border-white/10 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-slate-200">Controle</div>
                                <div className="text-[10px] text-slate-500 font-bold">Realtime kosten en personeelsbezetting</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group cursor-default">
                            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-emerald-300 border border-white/10 group-hover:bg-emerald-300 group-hover:text-slate-900 transition-all duration-300">
                                <Leaf size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-slate-200">Duurzaamheid</div>
                                <div className="text-[10px] text-slate-500 font-bold">Focus op elektrische vloot & CO2 reductie</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-10 mt-auto">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                        © {new Date().getFullYear()} Timo Intelligence
                    </p>
                </div>
            </div>

            {/* Right Side: Action (Light) */}
            <div className="md:w-[55%] p-10 md:p-14 lg:p-20 flex flex-col justify-center bg-white">
                <div className="mb-12">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welkom terug</h2>
                    <p className="text-slate-500 font-medium text-sm mt-2">Log in om uw vloot te beheren.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">E-mailadres</label>
                        <div className="relative group">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                placeholder="naam@bedrijf.nl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wachtwoord</label>
                            <button type="button" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                Vergeten?
                            </button>
                        </div>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm shadow-xl shadow-slate-900/20 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:bg-slate-400 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                Inloggen
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
                
                {/* Demo Credentials Hint */}
                <div className="mt-12 pt-10 border-t border-slate-50">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Demo Account</div>
                        <div className="flex gap-6">
                            <div className="text-center sm:text-left">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">E-mail</p>
                                <p className="text-[11px] font-mono font-black text-slate-700">admin@timo.nl</p>
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                            <div className="text-center sm:text-left">
                                <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Wachtwoord</p>
                                <p className="text-[11px] font-mono font-black text-slate-700">demo123</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;