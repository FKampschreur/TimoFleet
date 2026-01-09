import React, { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, AlertTriangle, CheckCircle, ArrowRight, Truck } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { supabase } from '../services/supabaseClient';

interface PasswordResetProps {
  onResetSuccess: () => void;
  language: Language;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onResetSuccess, language }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const t = translations[language];

  useEffect(() => {
    // Check if there's a recovery token in the URL hash
    const checkRecoveryToken = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');

      if (type === 'recovery' && accessToken) {
        // Supabase automatically handles the session when the hash is present
        // We need to wait for Supabase to process the session
        try {
          // Get the current session - Supabase should have processed the hash
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new Error('Kon sessie niet verifiëren. De link is mogelijk verlopen.');
          }

          // Token is valid and session is established
          setIsCheckingToken(false);
          // Clear the hash from URL for security (but keep it until password is reset)
        } catch (err: any) {
          setError(err.message || 'Ongeldige of verlopen wachtwoord reset link. Vraag een nieuwe aan.');
          setIsCheckingToken(false);
        }
      } else {
        // No valid token, show error
        setError('Ongeldige of verlopen wachtwoord reset link. Vraag een nieuwe aan.');
        setIsCheckingToken(false);
      }
    };

    checkRecoveryToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    setIsLoading(true);

    try {
      // Verify we have a session (should be set from the recovery token)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Geen geldige sessie gevonden. De reset link is mogelijk verlopen.');
      }

      // Update password using Supabase (user is already authenticated via recovery session)
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      // Clear the hash from URL now that password is reset
      window.history.replaceState(null, '', window.location.pathname);

      // Sign out the recovery session
      await supabase.auth.signOut();

      // Success!
      setIsSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        onResetSuccess();
      }, 2000);

    } catch (err: any) {
      console.error("Password Reset Error:", err);
      setError(err.message || 'Er is een fout opgetreden bij het resetten van het wachtwoord.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden p-4 md:p-8 font-sans">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-10 text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-emerald-600" size={32} />
          <p className="text-slate-600 font-medium">Controleren van reset link...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden p-4 md:p-8 font-sans">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-10 text-center">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Wachtwoord gewijzigd!</h2>
          <p className="text-slate-600 font-medium mb-6">Je wordt doorgestuurd naar het inlogscherm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden p-4 md:p-8 font-sans">
      {/* Abstract Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Central Card */}
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden relative z-10 border border-white">
        {/* Header */}
        <div className="bg-slate-900 p-10 text-white text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <Truck size={28} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">Timo<span className="text-emerald-500">Fleet</span></span>
          </div>
          <h2 className="text-2xl font-black mb-2">Nieuw wachtwoord instellen</h2>
          <p className="text-slate-400 text-sm">Voer je nieuwe wachtwoord in</p>
        </div>

        {/* Form */}
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nieuw wachtwoord</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  placeholder="Minimaal 6 tekens"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bevestig wachtwoord</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                  placeholder="Herhaal wachtwoord"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full py-5 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm shadow-xl shadow-slate-900/20 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:bg-slate-400 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Wachtwoord instellen
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
