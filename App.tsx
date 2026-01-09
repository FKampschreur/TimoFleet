import React, { useState, useEffect, useMemo } from 'react';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import AboutModal from './components/AboutModal';
import Chatbot from './components/Chatbot';
import LoginScreen from './components/LoginScreen';
import PasswordReset from './components/PasswordReset';
import ProfileModal from './components/ProfileModal';
import { AppLayout } from './components/AppLayout';
import { AppRouter } from './components/AppRouter';
import { Language, Debtor, User } from './types';
import { translations } from './translations';
import { getCurrentUser, logout } from './auth';
import { useDrivers, useVehicles, useDebtors, useFixedRoutes } from './hooks/useEntityData';
import { createUpdateHandler, createAddHandler, createDeleteHandler } from './utils/crudHelpers';
import { mapVehicleToDb, mapDriverToDb, mapDebtorToDb, mapFixedRouteToDb, mapDriverFromDb, mapDebtorFromDb } from './services/entityMappers';
import { Vehicle, Driver, FixedRoute } from './types';

type View = 'home' | 'dashboard' | 'fleet' | 'drivers' | 'fixedRoutes' | 'debtors' | 'performance';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  
  // Planning Session State (Sandboxed from main debtors list)
  const [planningSessionDebtors, setPlanningSessionDebtors] = useState<Debtor[]>([]);

  const [language] = useState<Language>('nl');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const t = translations[language];

  // REFACTORED: Gebruik custom hooks voor data fetching
  const { drivers, setDrivers, isLoading: isLoadingDrivers } = useDrivers(currentUser);
  const { vehicles: fleet, setVehicles: setFleet, isLoading: isLoadingVehicles } = useVehicles(currentUser);
  const { debtors, setDebtors, isLoading: isLoadingDebtors } = useDebtors(currentUser);
  const { fixedRoutes, setFixedRoutes, isLoading: isLoadingRoutes } = useFixedRoutes(currentUser);
  
  const isLoadingData = isLoadingDrivers || isLoadingVehicles || isLoadingDebtors || isLoadingRoutes;

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

  // REFACTORED: Data fetching gebeurt nu via custom hooks (useDrivers, useVehicles, etc.)
  // Geen lokale fetchData meer nodig - hooks handelen dit af

  // Check if there's a password reset token in the URL
  const checkPasswordResetToken = () => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    return type === 'recovery';
  };

  // REFACTORED: CRUD Handlers met generieke factory functies
  // Gebruik useMemo om handlers alleen opnieuw te maken wanneer currentUser verandert
  const vehicleCrudConfig = useMemo(() => ({
    tableName: 'vehicles' as const,
    user: currentUser,
    entityName: 'voertuig',
    mapToDb: mapVehicleToDb
  }), [currentUser]);

  const handleUpdateVehicle = useMemo(() => {
    const handler = createUpdateHandler<Vehicle>(vehicleCrudConfig);
    return (updatedVehicle: Vehicle) => handler(updatedVehicle, setFleet);
  }, [vehicleCrudConfig]);

  const handleAddVehicle = useMemo(() => {
    const handler = createAddHandler<Vehicle>(vehicleCrudConfig);
    return (newVehicle: Vehicle) => handler(newVehicle, setFleet);
  }, [vehicleCrudConfig]);

  const handleDeleteVehicle = useMemo(() => {
    const handler = createDeleteHandler<Vehicle>(vehicleCrudConfig);
    return (id: string) => handler(id, setFleet);
  }, [vehicleCrudConfig]);

  const driverCrudConfig = useMemo(() => ({
    tableName: 'drivers' as const,
    user: currentUser,
    entityName: 'chauffeur',
    mapToDb: mapDriverToDb,
    mapFromDb: mapDriverFromDb
  }), [currentUser]);

  const handleAddDriver = useMemo(() => {
    const handler = createAddHandler<Driver>(driverCrudConfig);
    return (newDriver: Driver) => handler(newDriver, setDrivers);
  }, [driverCrudConfig]);

  const handleUpdateDriver = useMemo(() => {
    const handler = createUpdateHandler<Driver>(driverCrudConfig);
    return (updatedDriver: Driver) => handler(updatedDriver, setDrivers);
  }, [driverCrudConfig]);

  const handleDeleteDriver = useMemo(() => {
    const handler = createDeleteHandler<Driver>(driverCrudConfig);
    return (id: string) => handler(id, setDrivers);
  }, [driverCrudConfig]);

  const debtorCrudConfig = useMemo(() => ({
    tableName: 'debtors' as const,
    user: currentUser,
    entityName: 'debiteur',
    mapToDb: mapDebtorToDb,
    mapFromDb: mapDebtorFromDb
  }), [currentUser]);

  const handleAddDebtor = useMemo(() => {
    const handler = createAddHandler<Debtor>(debtorCrudConfig);
    return (newDebtor: Debtor) => handler(newDebtor, setDebtors);
  }, [debtorCrudConfig]);

  const handleUpdateDebtor = useMemo(() => {
    const handler = createUpdateHandler<Debtor>(debtorCrudConfig);
    return (updatedDebtor: Debtor) => handler(updatedDebtor, setDebtors);
  }, [debtorCrudConfig]);

  const handleDeleteDebtor = useMemo(() => {
    const handler = createDeleteHandler<Debtor>(debtorCrudConfig);
    return (id: string) => handler(id, setDebtors);
  }, [debtorCrudConfig]);

  const fixedRouteCrudConfig = useMemo(() => ({
    tableName: 'fixed_routes' as const,
    user: currentUser,
    entityName: 'vaste route',
    mapToDb: mapFixedRouteToDb
  }), [currentUser]);

  const handleAddFixedRoute = useMemo(() => {
    const handler = createAddHandler<FixedRoute>(fixedRouteCrudConfig);
    return (newRoute: FixedRoute) => handler(newRoute, setFixedRoutes);
  }, [fixedRouteCrudConfig]);

  const handleUpdateFixedRoute = useMemo(() => {
    const handler = createUpdateHandler<FixedRoute>(fixedRouteCrudConfig);
    return (updatedRoute: FixedRoute) => handler(updatedRoute, setFixedRoutes);
  }, [fixedRouteCrudConfig]);

  const handleDeleteFixedRoute = useMemo(() => {
    const handler = createDeleteHandler<FixedRoute>(fixedRouteCrudConfig);
    return (id: string) => handler(id, setFixedRoutes);
  }, [fixedRouteCrudConfig]);

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
    <>
      <AppLayout
        currentUser={currentUser}
        currentView={currentView}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        setCurrentView={setCurrentView}
        setIsAboutOpen={setIsAboutOpen}
        setShowProfileModal={setShowProfileModal}
        onLogout={handleLogout}
        language={language}
        isLoadingData={isLoadingData}
      >
        <AppRouter
          currentView={currentView}
          language={language}
          vehicles={fleet}
          drivers={drivers}
          fixedRoutes={fixedRoutes}
          debtors={debtors}
          currentUser={currentUser}
          planningSessionDebtors={planningSessionDebtors}
          setPlanningSessionDebtors={setPlanningSessionDebtors}
          setCurrentView={setCurrentView}
          handleUpdateVehicle={handleUpdateVehicle}
          handleAddVehicle={handleAddVehicle}
          handleDeleteVehicle={handleDeleteVehicle}
          handleUpdateDriver={handleUpdateDriver}
          handleAddDriver={handleAddDriver}
          handleDeleteDriver={handleDeleteDriver}
          handleUpdateDebtor={handleUpdateDebtor}
          handleAddDebtor={handleAddDebtor}
          handleDeleteDebtor={handleDeleteDebtor}
          handleAddFixedRoute={handleAddFixedRoute}
          handleUpdateFixedRoute={handleUpdateFixedRoute}
          handleDeleteFixedRoute={handleDeleteFixedRoute}
          handleCopyToPlanning={handleCopyToPlanning}
          setDrivers={setDrivers}
          setFixedRoutes={setFixedRoutes}
        />
      </AppLayout>
      
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
    </>
  );
}

export default App;