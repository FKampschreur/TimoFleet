import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import FleetManagement from './components/FleetManagement';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import AboutModal from './components/AboutModal';
import DriverPlanner from './components/DriverPlanner';
import FixedRoutePlanner from './components/FixedRoutePlanner';
import Home from './components/Home';
import Chatbot from './components/Chatbot';
import LoginScreen from './components/LoginScreen';
// Added missing import for DebtorManagement
import DebtorManagement from './components/DebtorManagement';
import PerformanceModule from './components/PerformanceModule';
import ProfileModal from './components/ProfileModal';
import { Truck, Menu, X, CircleHelp, LogOut, ChevronDown, User as UserIcon, Settings, Sparkles } from 'lucide-react';
import { Vehicle, Language, Driver, FixedRoute, User, UserRole, Debtor } from './types';
import { translations } from './translations';
import { getCurrentUser, logout } from './auth';
import { FLEET_CONFIG, MOCK_DRIVERS, MOCK_FIXED_ROUTES, MOCK_DEBTORS } from './constants';

type View = 'home' | 'dashboard' | 'fleet' | 'drivers' | 'fixedRoutes' | 'debtors' | 'performance';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // App Data State geïnitialiseerd met Mock Data (Staat van gister 23:50)
  const [fleet, setFleet] = useState<Vehicle[]>(FLEET_CONFIG);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>(MOCK_FIXED_ROUTES);
  const [debtors, setDebtors] = useState<Debtor[]>(MOCK_DEBTORS);
  
  // Planning Session State (Sandboxed from main debtors list)
  const [planningSessionDebtors, setPlanningSessionDebtors] = useState<Debtor[]>([]);

  const [language] = useState<Language>('nl');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const t = translations[language];

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const available = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(available);
      } else {
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkApiKey();

    const checkSession = async () => {
        const user = await getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    };
    checkSession();
  }, []);

  // --- CRUD Handlers (Lokaal) ---

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setFleet(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    setFleet(prev => [...prev, { ...newVehicle, organization_id: 'local-org' }]);
  };

  const handleDeleteVehicle = (id: string) => {
    setFleet(prev => prev.filter(v => v.id !== id));
  };

  const handleAddDriver = (newDriver: Driver) => {
      setDrivers(prev => [...prev, { ...newDriver, organization_id: 'local-org' }]);
  };

  const handleUpdateDriver = (updatedDriver: Driver) => {
      setDrivers(prev => prev.map(d => d.id === updatedDriver.id ? updatedDriver : d));
  };

  const handleDeleteDriver = (id: string) => {
      setDrivers(prev => prev.filter(d => d.id !== id));
  };

  const handleAddDebtor = (newDebtor: Debtor) => {
      setDebtors(prev => [...prev, { ...newDebtor, organization_id: 'local-org' }]);
  };

  const handleUpdateDebtor = (updatedDebtor: Debtor) => {
      setDebtors(prev => prev.map(d => d.id === updatedDebtor.id ? updatedDebtor : d));
  };

  const handleDeleteDebtor = (id: string) => {
      setDebtors(prev => prev.filter(d => d.id !== id));
  };

  // Logic to copy selected debtors to the planning sandbox
  const handleCopyToPlanning = (selectedDebtors: Debtor[]) => {
      // Deep copy to break references
      const sessionCopy = selectedDebtors.map(d => ({...d}));
      
      // Append to existing planning list or overwrite? 
      // Let's Append, filtering out duplicates based on ID if they already exist in session
      setPlanningSessionDebtors(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = sessionCopy.filter(d => !existingIds.has(d.id));
          return [...prev, ...newItems];
      });
      
      // Switch view
      setCurrentView('dashboard');
      alert(`${selectedDebtors.length} ${t.debtors.copySuccess}`);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setIsProfileOpen(false);
    setCurrentView('home');
  };

  if (!hasApiKey) return <ApiKeyPrompt setHasApiKey={setHasApiKey} language={language} />;
  if (!currentUser) return <LoginScreen onLoginSuccess={(u) => { setCurrentUser(u); }} language={language} />;

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
                                {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('') : '?'}
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

                            <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg font-bold transition-colors">
                                <LogOut size={16} /> {t.profile.logout}
                            </button>
                        </div>
                    )}
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Direct Uitloggen">
                    <LogOut size={20} />
                </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
          {currentView === 'home' && <Home onNavigate={(v: any) => setCurrentView(v)} language={language} />}
          {currentView === 'dashboard' && <Dashboard vehicles={fleet} language={language} initialDebtors={planningSessionDebtors} setInitialDebtors={setPlanningSessionDebtors} />}
          {currentView === 'fleet' && <FleetManagement vehicles={fleet} drivers={drivers} onUpdateVehicle={handleUpdateVehicle} onAddVehicle={handleAddVehicle} onDeleteVehicle={handleDeleteVehicle} onToggleAvailability={() => {}} language={language}/>}
          {currentView === 'debtors' && <DebtorManagement language={language} debtors={debtors} fixedRoutes={fixedRoutes} onAddDebtor={handleAddDebtor} onUpdateDebtor={handleUpdateDebtor} onDeleteDebtor={handleDeleteDebtor} onCopyToPlanning={handleCopyToPlanning} />}
          {currentView === 'drivers' && <DriverPlanner language={language} drivers={drivers} vehicles={fleet} setDrivers={setDrivers} fixedRoutes={fixedRoutes} setFixedRoutes={setFixedRoutes} onUpdateDriver={handleUpdateDriver} onAddDriver={handleAddDriver} onDeleteDriver={handleDeleteDriver} />}
          {currentView === 'fixedRoutes' && <FixedRoutePlanner language={language} drivers={drivers} fixedRoutes={fixedRoutes} setFixedRoutes={setFixedRoutes} vehicles={fleet} debtors={debtors} onUpdateDebtor={handleUpdateDebtor} />}
          {currentView === 'performance' && <PerformanceModule language={language} drivers={drivers} fixedRoutes={fixedRoutes} />}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Timo Fleet. Optimization powered by Timo Intelligence.
          </p>
        </div>
      </footer>
      <Chatbot language={language} />
      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} language={language} />}
      
      {showProfileModal && currentUser && (
          <ProfileModal 
            user={currentUser} 
            language={language} 
            onClose={() => setShowProfileModal(false)}
            onUpdate={(updatedUser) => setCurrentUser(updatedUser)}
          />
      )}
    </div>
  );
}

export default App;