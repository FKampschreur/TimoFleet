import { User, UserRole } from './types';
import { MOCK_USERS } from './constants';

const SESSION_KEY = 'timo_fleet_session_v1';

export const login = async (email: string, password_plaintext: string): Promise<User> => {
  // Simuleer netwerk vertraging
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Zoek gebruiker in mock data
  const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  // In een echte app check je hier het wachtwoord hash
  // Voor demo accepteren we elk wachtwoord langer dan 3 tekens als de user bestaat
  if (!user || password_plaintext.length < 3) {
    throw new Error('Onjuiste e-mail of wachtwoord.');
  }
  
  // Sla sessie op
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  
  return user;
};

export const register = async (email: string, password: string, name: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const newUser: User = {
    id: `mock-user-${Date.now()}`,
    name,
    email,
    role: UserRole.USER,
    organization_id: 'local-org'
  };
  
  // In demo slaan we de nieuwe user ook op in sessie (auto-login na registratie)
  localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  
  return newUser;
};

export const updateProfile = async (id: string, updates: Partial<User>): Promise<void> => {
    // Update de sessie data indien nodig
    const current = await getCurrentUser();
    if (current && current.id === id) {
        const updated = { ...current, ...updates };
        localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    // Haal user uit local storage
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    
    try {
        return JSON.parse(stored);
    } catch (e) {
        return null;
    }
}

export const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
};

export const getUsers = async (): Promise<User[]> => {
    return MOCK_USERS;
};

export const addUser = async (newUser: User): Promise<void> => {
    console.log("Mock add user:", newUser);
};

export const updateUser = async (updatedUser: User): Promise<void> => {
    console.log("Mock update user:", updatedUser);
};

export const deleteUser = async (userId: string): Promise<void> => {
    console.log("Mock delete user:", userId);
};