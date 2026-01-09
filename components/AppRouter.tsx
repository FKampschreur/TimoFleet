// REFACTORED: AppRouter component voor view routing

import React from 'react';
import Dashboard from './Dashboard';
import FleetManagement from './FleetManagement';
import DebtorManagement from './DebtorManagement';
import DriverPlanner from './DriverPlanner';
import FixedRoutePlanner from './FixedRoutePlanner';
import PerformanceModule from './PerformanceModule';
import Home from './Home';
import { Vehicle, Driver, FixedRoute, Debtor, User, Language } from '../types';

interface AppRouterProps {
  currentView: string;
  language: Language;
  vehicles: Vehicle[];
  drivers: Driver[];
  fixedRoutes: FixedRoute[];
  debtors: Debtor[];
  currentUser: User;
  planningSessionDebtors: Debtor[];
  setPlanningSessionDebtors: React.Dispatch<React.SetStateAction<Debtor[]>>;
  setCurrentView: (view: string) => void;
  // CRUD handlers
  handleUpdateVehicle: (vehicle: Vehicle) => Promise<void>;
  handleAddVehicle: (vehicle: Vehicle) => Promise<void>;
  handleDeleteVehicle: (id: string) => Promise<void>;
  handleUpdateDriver: (driver: Driver) => Promise<void>;
  handleAddDriver: (driver: Driver) => Promise<void>;
  handleDeleteDriver: (id: string) => Promise<void>;
  handleUpdateDebtor: (debtor: Debtor) => Promise<void>;
  handleAddDebtor: (debtor: Debtor) => Promise<void>;
  handleDeleteDebtor: (id: string) => Promise<void>;
  handleAddFixedRoute: (route: FixedRoute) => Promise<void>;
  handleUpdateFixedRoute: (route: FixedRoute) => Promise<void>;
  handleDeleteFixedRoute: (id: string) => Promise<void>;
  handleCopyToPlanning: (debtors: Debtor[]) => void;
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  setFixedRoutes: React.Dispatch<React.SetStateAction<FixedRoute[]>>;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentView,
  language,
  vehicles,
  drivers,
  fixedRoutes,
  debtors,
  currentUser,
  planningSessionDebtors,
  setPlanningSessionDebtors,
  setCurrentView,
  handleUpdateVehicle,
  handleAddVehicle,
  handleDeleteVehicle,
  handleUpdateDriver,
  handleAddDriver,
  handleDeleteDriver,
  handleUpdateDebtor,
  handleAddDebtor,
  handleDeleteDebtor,
  handleAddFixedRoute,
  handleUpdateFixedRoute,
  handleDeleteFixedRoute,
  handleCopyToPlanning,
  setDrivers,
  setFixedRoutes
}) => {
  switch (currentView) {
    case 'home':
      return <Home onNavigate={(v: any) => setCurrentView(v)} language={language} />;
    
    case 'dashboard':
      return (
        <Dashboard 
          vehicles={vehicles} 
          language={language} 
          initialDebtors={planningSessionDebtors} 
          setInitialDebtors={setPlanningSessionDebtors} 
          currentUserId={currentUser?.id} 
        />
      );
    
    case 'fleet':
      return (
        <FleetManagement 
          vehicles={vehicles} 
          drivers={drivers} 
          onUpdateVehicle={handleUpdateVehicle} 
          onAddVehicle={handleAddVehicle} 
          onDeleteVehicle={handleDeleteVehicle} 
          onToggleAvailability={() => {}} 
          language={language}
        />
      );
    
    case 'debtors':
      return (
        <DebtorManagement 
          language={language} 
          debtors={debtors} 
          fixedRoutes={fixedRoutes} 
          onAddDebtor={handleAddDebtor} 
          onUpdateDebtor={handleUpdateDebtor} 
          onDeleteDebtor={handleDeleteDebtor} 
          onCopyToPlanning={handleCopyToPlanning} 
        />
      );
    
    case 'drivers':
      return (
        <DriverPlanner 
          language={language} 
          drivers={drivers} 
          vehicles={vehicles} 
          setDrivers={setDrivers} 
          fixedRoutes={fixedRoutes} 
          setFixedRoutes={setFixedRoutes} 
          onUpdateDriver={handleUpdateDriver} 
          onAddDriver={handleAddDriver} 
          onDeleteDriver={handleDeleteDriver} 
        />
      );
    
    case 'fixedRoutes':
      return (
        <FixedRoutePlanner 
          language={language} 
          drivers={drivers} 
          fixedRoutes={fixedRoutes} 
          setFixedRoutes={setFixedRoutes} 
          vehicles={vehicles} 
          debtors={debtors} 
          onUpdateDebtor={handleUpdateDebtor} 
          onAddFixedRoute={handleAddFixedRoute} 
          onUpdateFixedRoute={handleUpdateFixedRoute} 
          onDeleteFixedRoute={handleDeleteFixedRoute} 
        />
      );
    
    case 'performance':
      return (
        <PerformanceModule 
          language={language} 
          drivers={drivers} 
          fixedRoutes={fixedRoutes} 
          currentUser={currentUser} 
        />
      );
    
    default:
      return <Home onNavigate={(v: any) => setCurrentView(v)} language={language} />;
  }
};
