import { createClient } from '@supabase/supabase-js';

// Gebruik optionele omgevingsvariabelen voor stille fallback
// In Vite gebruik je import.meta.env voor client-side environment variables
// Werkt met zowel VITE_* als VITE_PUBLIC_* prefix
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Site URL voor redirects (gebruikt voor password reset links)
const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SITE_URL || window.location.origin;

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
      persistSession: true
    }
  }
);