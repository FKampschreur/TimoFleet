// REFACTORED: AppLayout component voor navigatie en layout structuur

import React from 'react';
import { Truck, LogOut, Settings, Sparkles } from 'lucide-react';
import { User, Language } from '../types';
import { translations } from '../translations';

interface AppLayoutProps {
  currentUser: User;
  currentView: string;
  isProfileOpen: boolean;
  setIsProfileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentView: (view: string) => void;
  setIsAboutOpen: (open: boolean) => void;
  setShowProfileModal: (show: boolean) => void;
  onLogout: () => void;
  language: Language;
  children: React.ReactNode;
  isLoadingData: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  currentView,
  isProfileOpen,
  setIsProfileOpen,
  setCurrentView,
  setIsAboutOpen,
  setShowProfileModal,
  onLogout,
  language,
  children,
  isLoadingData
}) => {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView('home')}>
                <div className="bg-emerald-600 p-2 rounded-lg text-white group-hover:bg-emerald-700 transition-colors">
                    <Truck size={24} />
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight">Timo<span className="text-emerald-600">Fleet</span></span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
               <button onClick={() => setCurrentView('home')} className={`text-slate-900 font-medium px-1 py-5 border-b-2 transition-colors ${currentView === 'home' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.nav.home}</button>
               <button onClick={() => setCurrentView('dashboard')} className={`text-slate-900 font-medium px-1 py-5 border-b-2 transition-colors ${currentView === 'dashboard' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.nav.dashboard}</button>
               <button onClick={() => setCurrentView('fleet')} className={`text-slate-900 font-medium px-1 py-5 border-b-2 transition-colors ${currentView === 'fleet' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.nav.fleet}</button>
               <button onClick={() => setCurrentView('debtors')} className={`text-slate-900 font-medium px-1 py-5 border-b-2 transition-colors ${currentView === 'debtors' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.nav.debtors}</button>
               <button onClick={() => setCurrentView('drivers')} className={`text-slate-900 font-medium px-1 py-5 border-b-2 transition-colors ${currentView === 'drivers' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.nav.drivers}</button>
               <button onClick={() => setCurrentView('fixedRoutes')} className={`text-slate-900 font-medium px-1 py-5 border-b-2 transition-colors ${currentView === 'fixedRoutes' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.nav.fixedRoutes}</button>
               <button onClick={() => setCurrentView('performance')} className={`text-slate-900 font-medium px-1 py-5 border-b-2 transition-colors ${currentView === 'performance' ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t.nav.performance}</button>
            </div>

            <div className="hidden md:flex items-center gap-4">
                <button 
                  onClick={() => setIsAboutOpen(true)} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full border border-emerald-100 transition-all shadow-sm group active:scale-95"
                  title="Onze Visie & Uitleg"
                >
                    <Sparkles size={16} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Visie</span>
                </button>

                <div className="relative">
                    <button onClick={() => setIsProfileOpen(prev => !prev)} className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                         {currentUser.photo_url ? (
                             <img src={currentUser.photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                         ) : (
                             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                                {currentUser.name && currentUser.name.trim() ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?'}
                             </div>
                         )}
                    </button>
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-3">
                                <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                            </div>
                            <div className="h-px bg-slate-100 my-1"></div>
                            
                            <button 
                                onClick={() => { setShowProfileModal(true); setIsProfileOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg font-bold transition-colors"
                            >
                                <Settings size={16} /> {t.profile.editProfile}
                            </button>

                            <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg font-bold transition-colors">
                                <LogOut size={16} /> {t.profile.logout}
                            </button>
                        </div>
                    )}
                </div>
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Direct Uitloggen">
                    <LogOut size={20} />
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
          {isLoadingData ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-slate-600 font-medium">Gegevens laden...</p>
              </div>
            </div>
          ) : (
            children
          )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Timo Fleet. Optimization powered by Timo Intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
};
