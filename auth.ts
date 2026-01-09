import { User, UserRole } from './types';
import { supabase } from './services/supabaseClient';

const SESSION_KEY = 'timo_fleet_session_v1';

export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Check of Supabase correct is geconfigureerd
    const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔐 Login attempt:', {
      email: email.trim().toLowerCase(),
      hasUrl: !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co',
      hasKey: !!supabaseKey && supabaseKey !== 'placeholder',
      urlPreview: supabaseUrl?.substring(0, 30) + '...' || 'none'
    });
    
    if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co' || 
        !supabaseKey || supabaseKey === 'placeholder') {
      console.error('❌ Supabase configuratie fout:', {
        url: supabaseUrl,
        key: supabaseKey ? 'present' : 'missing',
        envVars: {
          VITE_PUBLIC_SUPABASE_URL: import.meta.env.VITE_PUBLIC_SUPABASE_URL,
          VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
          VITE_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
          VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
        }
      });
      throw new Error('Supabase is niet correct geconfigureerd. Controleer de environment variables in Vercel.');
    }

    // 1. Authenticeer met Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    });

    if (authError) {
      console.error('❌ Supabase auth error:', authError);
      console.error('   Error details:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      
      // Geef specifieke foutmeldingen
      if (authError.status === 404 || authError.message.includes('404')) {
        throw new Error('Supabase endpoint niet gevonden (404). Controleer of VITE_PUBLIC_SUPABASE_URL correct is ingesteld.');
      } else if (authError.message.includes('Invalid login credentials') || authError.message.includes('Invalid credentials')) {
        throw new Error('Onjuiste e-mail of wachtwoord.');
      } else if (authError.message.includes('Email not confirmed')) {
        throw new Error('E-mailadres is nog niet bevestigd. Controleer je inbox.');
      } else if (authError.message.includes('fetch')) {
        throw new Error('Kan geen verbinding maken met Supabase. Controleer je internetverbinding en Supabase URL.');
      } else {
        throw new Error(authError.message || 'Onjuiste e-mail of wachtwoord.');
      }
    }

    if (!authData.user) {
      throw new Error('Geen gebruiker gevonden na authenticatie.');
    }

    // 2. Haal het profiel op uit de profiles tabel
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      console.error('   Error details:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint
      });
      
      // Als er geen profiel is, log de gebruiker uit en geef een duidelijke foutmelding
      await supabase.auth.signOut();
      
      if (profileError.code === 'PGRST116' || profileError.message.includes('No rows')) {
        throw new Error('Gebruikersprofiel niet gevonden in database. Zorg dat er een profiel bestaat in de profiles tabel voor deze gebruiker.');
      } else if (profileError.code === '42P01' || profileError.message.includes('does not exist')) {
        throw new Error('De profiles tabel bestaat niet. Controleer of het database schema correct is geïnstalleerd.');
      } else {
        throw new Error(`Database fout: ${profileError.message || 'Gebruikersprofiel niet gevonden.'}`);
      }
    }

    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('Gebruikersprofiel niet gevonden. Neem contact op met de beheerder.');
    }

    // 3. Construeer User object
    const user: User = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role === 'Beheerder' ? UserRole.ADMIN : UserRole.USER,
      organization_id: profile.organization_id,
      photo_url: profile.photo_url || undefined
    };

    // 4. Sla user op in localStorage voor fallback (optioneel)
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  
    return user;
  } catch (error: any) {
    // Als het al een Error object is met een message, gooi die door
    if (error instanceof Error) {
      throw error;
    }
    // Anders maak een nieuwe error
    throw new Error(error?.message || 'Er is een fout opgetreden bij het inloggen.');
  }
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
    try {
        // Converteer UserRole enum naar database string
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.role !== undefined) {
            dbUpdates.role = updates.role === UserRole.ADMIN ? 'Beheerder' : 'Gebruiker';
        }
        if (updates.organization_id !== undefined) dbUpdates.organization_id = updates.organization_id;
        if (updates.photo_url !== undefined) dbUpdates.photo_url = updates.photo_url;
        
        dbUpdates.updated_at = new Date().toISOString();

        // Update in Supabase
        const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            throw error;
        }

        // Update localStorage als fallback
        const current = await getCurrentUser();
        if (current && current.id === id) {
            const updated = { ...current, ...updates };
            localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        // 1. Check Supabase sessie
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
            // Geen actieve sessie, verwijder localStorage fallback
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        // 2. Haal profiel op uit database
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        // 3. Construeer User object
        const user: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role === 'Beheerder' ? UserRole.ADMIN : UserRole.USER,
            organization_id: profile.organization_id,
            photo_url: profile.photo_url || undefined
        };

        // Update localStorage als fallback
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export const logout = async () => {
    try {
        // Log uit bij Supabase
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        // Verwijder altijd localStorage
        localStorage.removeItem(SESSION_KEY);
    }
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