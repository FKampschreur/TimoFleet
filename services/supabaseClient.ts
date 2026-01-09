import { createClient } from '@supabase/supabase-js';

// Gebruik optionele omgevingsvariabelen voor stille fallback
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// We maken de client stil aan om foutmeldingen in de console te voorkomen 
// als de keys niet aanwezig zijn, aangezien de app nu op mock-data draait.
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);