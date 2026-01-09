
import React from 'react';
import { Truck, Users, LayoutDashboard, Map, ArrowRight, Building, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface HomeProps {
    onNavigate: (view: 'dashboard' | 'fleet' | 'drivers' | 'fixedRoutes' | 'debtors' | 'performance') => void;
    language: Language;
}

const Home: React.FC<HomeProps> = ({ onNavigate, language }) => {
    const t = translations[language];

    const cards = [
        {
            id: 'dashboard',
            title: t.home.cards.dashboard.title,
            description: t.home.cards.dashboard.desc,
            icon: LayoutDashboard,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-100',
            view: 'dashboard' as const
        },
        {
            id: 'fleet',
            title: t.home.cards.fleet.title,
            description: t.home.cards.fleet.desc,
            icon: Truck,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-100',
            view: 'fleet' as const
        },
        {
            id: 'debtors',
            title: t.home.cards.debtors.title,
            description: t.home.cards.debtors.desc,
            icon: Building,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            borderColor: 'border-indigo-100',
            view: 'debtors' as const
        },
        {
            id: 'drivers',
            title: t.home.cards.drivers.title,
            description: t.home.cards.drivers.desc,
            icon: Users,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-100',
            view: 'drivers' as const
        },
        {
            id: 'fixedRoutes',
            title: t.home.cards.fixedRoutes.title,
            description: t.home.cards.fixedRoutes.desc,
            icon: Map,
            color: 'bg-orange-500',
            textColor: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-100',
            view: 'fixedRoutes' as const
        },
        {
            id: 'performance',
            title: t.home.cards.performance.title,
            description: t.home.cards.performance.desc,
            icon: TrendingUp,
            color: 'bg-rose-500',
            textColor: 'text-rose-600',
            bgColor: 'bg-rose-50',
            borderColor: 'border-rose-100',
            view: 'performance' as const
        }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
            
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100">
                    <Sparkles size={12} fill="currentColor" /> Timo Intelligence Platform
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    Welkom bij <span className="text-emerald-600">Timo Fleet</span>
                </h1>
                <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                    {t.home.subtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {cards.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => onNavigate(card.view)}
                        className={`group relative p-8 rounded-[2.5rem] border-2 text-left transition-all hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] ${card.bgColor} ${card.borderColor} bg-opacity-50 hover:bg-opacity-100`}
                    >
                        <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                            <div className={`p-2 rounded-full ${card.color} text-white shadow-lg`}>
                                <ArrowRight size={20} />
                            </div>
                        </div>

                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${card.color} text-white`}>
                            <card.icon size={32} strokeWidth={1.5} />
                        </div>
                        
                        <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-black">
                            {card.title}
                        </h3>
                        <p className="text-slate-600 font-medium leading-relaxed text-sm">
                            {card.description}
                        </p>
                    </button>
                ))}
            </div>

            <div className="mt-20 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Powered by Timo Intelligence
                </div>
            </div>
        </div>
    );
};

export default Home;
