import { createClient } from '@supabase/supabase-js';

// Gebruik optionele omgevingsvariabelen voor stille fallback
// In Vite gebruik je import.meta.env voor client-side environment variables
// Werkt met zowel VITE_* als VITE_PUBLIC_* prefix
let supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Normaliseer de URL (verwijder trailing slash indien aanwezig)
if (supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co') {
  supabaseUrl = supabaseUrl.replace(/\/$/, '');
}

// Site URL voor redirects (gebruikt voor password reset links)
const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SITE_URL || window.location.origin;

// Debug logging (altijd actief voor troubleshooting)
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

console.log('🔧 Supabase Config Check:', {
  environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
  url: supabaseUrl?.substring(0, 40) + (supabaseUrl?.length > 40 ? '...' : ''),
  urlLength: supabaseUrl?.length || 0,
  hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'placeholder',
  keyLength: supabaseAnonKey?.length || 0,
  keyPrefix: supabaseAnonKey?.substring(0, 10) + '...' || 'none',
  siteUrl: siteUrl,
  envVars: {
    VITE_PUBLIC_SUPABASE_URL: !!import.meta.env.VITE_PUBLIC_SUPABASE_URL,
    VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_PUBLIC_SUPABASE_ANON_KEY: !!import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  }
});

// Waarschuwing als configuratie niet correct is
const configValid = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && 
                    supabaseAnonKey && supabaseAnonKey !== 'placeholder';

if (!configValid) {
  const env = isProduction ? 'PRODUCTION (Vercel)' : 'DEVELOPMENT (lokaal)';
  console.error(`❌ Supabase configuratie ontbreekt in ${env}!`);
  console.error('   Controleer de volgende environment variables:');
  console.error('   - VITE_PUBLIC_SUPABASE_URL');
  console.error('   - VITE_PUBLIC_SUPABASE_ANON_KEY');
  
  if (isProduction) {
    console.error('');
    console.error('📋 Instructies voor Vercel:');
    console.error('   1. Ga naar Vercel Dashboard → je project → Settings → Environment Variables');
    console.error('   2. Voeg toe: VITE_PUBLIC_SUPABASE_URL = https://[jouw-project].supabase.co');
    console.error('   3. Voeg toe: VITE_PUBLIC_SUPABASE_ANON_KEY = [jouw-anon-key]');
    console.error('   4. Zorg dat ze beschikbaar zijn voor "Production" environment');
    console.error('   5. Ga naar Deployments → klik op "..." → "Redeploy"');
  }
}

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('❌ Supabase URL niet gevonden! Controleer VITE_PUBLIC_SUPABASE_URL');
} else {
  // Valideer URL formaat
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Supabase URL heeft ongeldig formaat! Moet beginnen met https:// en eindigen op .supabase.co');
    console.error('   Gevonden URL:', supabaseUrl);
  }
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder') {
  console.error('❌ Supabase Anon Key niet gevonden! Controleer VITE_PUBLIC_SUPABASE_ANON_KEY');
} else {
  // Valideer key formaat (Supabase anon keys beginnen meestal met 'eyJ')
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.warn('⚠️ Supabase Anon Key heeft mogelijk ongeldig formaat (moet beginnen met eyJ)');
  }
}

// We maken de client stil aan om foutmeldingen in de console te voorkomen 
// als de keys niet aanwezig zijn, aangezien de app nu op mock-data draait.
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Automatisch hash parameters verwerken (voor password reset links)
      detectSessionInUrl: true,
      // Redirect URL voor password reset emails
      redirectTo: siteUrl,
      autoRefreshToken: true,
      persistSession: true,
      // Extra debug opties
      debug: import.meta.env.DEV
    }
  }
);

// Test functie om te controleren of Supabase bereikbaar is
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(0);
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { success: false, error };
    }
    console.log('✅ Supabase connection test successful');
    return { success: true };
  } catch (err: any) {
    console.error('❌ Supabase connection test error:', err);
    return { success: false, error: err };
  }
};