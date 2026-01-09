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
import PasswordReset from './components/PasswordReset';
// Added missing import for DebtorManagement
import DebtorManagement from './components/DebtorManagement';
import PerformanceModule from './components/PerformanceModule';
import ProfileModal from './components/ProfileModal';
import { Truck, Menu, X, CircleHelp, LogOut, ChevronDown, User as UserIcon, Settings, Sparkles } from 'lucide-react';
import { Vehicle, Language, Driver, FixedRoute, User, UserRole, Debtor, LicenseType, VehicleType, FuelType } from './types';
import { translations } from './translations';
import { getCurrentUser, logout } from './auth';
import { supabase } from './services/supabaseClient';

type View = 'home' | 'dashboard' | 'fleet' | 'drivers' | 'fixedRoutes' | 'debtors' | 'performance';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // App Data State - geïnitialiseerd met lege arrays
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [fixedRoutes, setFixedRoutes] = useState<FixedRoute[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  
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

  // Haal data op uit Supabase wanneer gebruiker is ingelogd
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setIsLoadingData(false);
        return;
      }

      setIsLoadingData(true);

      try {
        // Haal drivers op
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .order('name');

        if (driversError) {
          console.error('Error fetching drivers:', driversError);
        } else {
          const mappedDrivers: Driver[] = (driversData || []).map((d: any) => ({
            id: d.id,
            organization_id: d.organization_id,
            name: d.name,
            email: d.email || '',
            phone: d.phone || '',
            licenses: (d.licenses || []) as LicenseType[],
            known_route_ids: d.known_route_ids || [],
            working_days: d.working_days || [1, 2, 3, 4, 5],
            is_active: d.is_active ?? true,
            photo_url: d.photo_url,
            schedule: {} // Wordt later geladen indien nodig
          }));
          setDrivers(mappedDrivers);
        }

        // Haal fixed routes op
        const { data: routesData, error: routesError } = await supabase
          .from('fixed_routes')
          .select('*')
          .order('name');

        if (routesError) {
          console.error('Error fetching fixed routes:', routesError);
        } else {
          const mappedRoutes: FixedRoute[] = (routesData || []).map((r: any) => ({
            id: r.id,
            organization_id: r.organization_id,
            name: r.name,
            region: r.region || '',
            standard_start_time: r.standard_start_time || '08:00',
            duration_hours: Number(r.duration_hours) || 8,
            required_license: r.required_license as LicenseType,
            requires_electric: r.requires_electric || false,
            color: r.color || 'bg-slate-500',
            allowed_days: r.allowed_days || [1, 2, 3, 4, 5],
            capacity: {
              chilled: r.capacity_chilled || 0,
              frozen: r.capacity_frozen || 0
            },
            assignments: {} // Wordt later geladen indien nodig
          }));
          setFixedRoutes(mappedRoutes);
        }

        // Haal debtors op
        const { data: debtorsData, error: debtorsError } = await supabase
          .from('debtors')
          .select('*')
          .order('name');

        if (debtorsError) {
          console.error('Error fetching debtors:', debtorsError);
        } else {
          const mappedDebtors: Debtor[] = (debtorsData || []).map((d: any) => ({
            id: d.id,
            organization_id: d.organization_id,
            debtor_number: d.debtor_number,
            foundation_name: d.foundation_name,
            name: d.name,
            address: d.address,
            postcode: d.postcode,
            city: d.city,
            container_location: d.container_location,
            delivery_days: d.delivery_days || [],
            time_window_start: d.time_window_start || '08:00',
            time_window_end: d.time_window_end || '17:00',
            drop_time_minutes: d.drop_time_minutes || 15,
            containers_chilled: d.containers_chilled || 0,
            containers_frozen: d.containers_frozen || 0,
            fixed_route_id: d.fixed_route_id
          }));
          setDebtors(mappedDebtors);
        }

        // Haal vehicles op
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .order('license_plate');

        if (vehiclesError) {
          console.error('Error fetching vehicles:', vehiclesError);
        } else {
          const mappedVehicles: Vehicle[] = (vehiclesData || []).map((v: any) => ({
            id: v.id,
            organization_id: v.organization_id,
            license_plate: v.license_plate || '',
            brand: v.brand || '',
            type: v.type as VehicleType,
            license_required: v.license_required as LicenseType,
            capacity: {
              chilled: v.capacity_chilled || 0,
              frozen: v.capacity_frozen || 0
            },
            fuel_type: v.fuel_type as FuelType,
            max_range_km: v.max_range_km || 0,
            consumption_per_100km: Number(v.consumption_per_100km) || 0,
            fuel_price_per_unit: Number(v.fuel_price_per_unit) || 0,
            co2_emission_per_km: Number(v.co2_emission_per_km) || 0,
            is_available: v.is_available ?? true,
            hourly_rate: Number(v.hourly_rate) || 0,
            monthly_fixed_cost: Number(v.monthly_fixed_cost) || 0,
            assigned_driver_id: v.assigned_driver_id
          }));
          setFleet(mappedVehicles);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Check if there's a password reset token in the URL
  const checkPasswordResetToken = () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    return type === 'recovery';
  };

  // --- CRUD Handlers (Lokaal) ---

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setFleet(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    if (currentUser) {
      setFleet(prev => [...prev, { ...newVehicle, organization_id: currentUser.organization_id }]);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    setFleet(prev => prev.filter(v => v.id !== id));
  };

  const handleAddDriver = (newDriver: Driver) => {
      if (currentUser) {
        setDrivers(prev => [...prev, { ...newDriver, organization_id: currentUser.organization_id }]);
      }
  };

  const handleUpdateDriver = (updatedDriver: Driver) => {
      setDrivers(prev => prev.map(d => d.id === updatedDriver.id ? updatedDriver : d));
  };

  const handleDeleteDriver = (id: string) => {
      setDrivers(prev => prev.filter(d => d.id !== id));
  };

  const handleAddDebtor = (newDebtor: Debtor) => {
      if (currentUser) {
        setDebtors(prev => [...prev, { ...newDebtor, organization_id: currentUser.organization_id }]);
      }
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
  
  // Check for password reset token first
  if (!currentUser && checkPasswordResetToken()) {
    return <PasswordReset onResetSuccess={() => setCurrentUser(null)} language={language} />;
  }
  
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
          {isLoadingData ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
                <p className="text-slate-600 font-medium">Gegevens laden...</p>
              </div>
            </div>
          ) : (
            <>
              {currentView === 'home' && <Home onNavigate={(v: any) => setCurrentView(v)} language={language} />}
              {currentView === 'dashboard' && <Dashboard vehicles={fleet} language={language} initialDebtors={planningSessionDebtors} setInitialDebtors={setPlanningSessionDebtors} />}
              {currentView === 'fleet' && <FleetManagement vehicles={fleet} drivers={drivers} onUpdateVehicle={handleUpdateVehicle} onAddVehicle={handleAddVehicle} onDeleteVehicle={handleDeleteVehicle} onToggleAvailability={() => {}} language={language}/>}
              {currentView === 'debtors' && <DebtorManagement language={language} debtors={debtors} fixedRoutes={fixedRoutes} onAddDebtor={handleAddDebtor} onUpdateDebtor={handleUpdateDebtor} onDeleteDebtor={handleDeleteDebtor} onCopyToPlanning={handleCopyToPlanning} />}
              {currentView === 'drivers' && <DriverPlanner language={language} drivers={drivers} vehicles={fleet} setDrivers={setDrivers} fixedRoutes={fixedRoutes} setFixedRoutes={setFixedRoutes} onUpdateDriver={handleUpdateDriver} onAddDriver={handleAddDriver} onDeleteDriver={handleDeleteDriver} />}
              {currentView === 'fixedRoutes' && <FixedRoutePlanner language={language} drivers={drivers} fixedRoutes={fixedRoutes} setFixedRoutes={setFixedRoutes} vehicles={fleet} debtors={debtors} onUpdateDebtor={handleUpdateDebtor} />}
              {currentView === 'performance' && <PerformanceModule language={language} drivers={drivers} fixedRoutes={fixedRoutes} />}
            </>
          )}
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