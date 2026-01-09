// Gedeelde error handling utilities

export const handleSupabaseError = (error: any, context: string): void => {
  console.error(`Error ${context} in Supabase:`, error);
  alert(`Fout bij ${context}: ${error.message || 'Onbekende fout'}`);
};

export const handleGenericError = (error: any, context: string): void => {
  console.error(`Error ${context}:`, error);
  alert(`Fout bij ${context}`);
};
