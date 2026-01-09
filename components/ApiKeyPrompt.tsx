import React, { useState } from 'react';
import { Key, Info, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface ApiKeyPromptProps {
  setHasApiKey: (hasKey: boolean) => void;
  language: Language;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ setHasApiKey, language }) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error', text: string } | null>(null);
  const t = translations[language];

  const handleSelectApiKey = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      // @ts-ignore window.aistudio is injected by the environment
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // As per guidelines, assume success and proceed.
        setStatusMessage({ type: 'success', text: t.apiKeyPrompt.successMessage });
        setHasApiKey(true); 
      } else {
        setStatusMessage({ type: 'error', text: t.apiKeyPrompt.devModeWarning });
      }
    } catch (error) {
      console.error("Error opening API key selection:", error);
      setStatusMessage({ type: 'error', text: t.apiKeyPrompt.errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="bg-emerald-100 text-emerald-700 p-4 rounded-full inline-flex items-center justify-center mb-6">
          <Key size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">{t.apiKeyPrompt.title}</h2>
        <p className="text-slate-600 mb-6">{t.apiKeyPrompt.description}</p>
        
        <button
          onClick={handleSelectApiKey}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-white transition-all
            ${loading 
              ? 'bg-slate-300 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg'
            }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              {t.apiKeyPrompt.loading}
            </>
          ) : (
            <>
              <Key size={20} fill="currentColor" />
              {t.apiKeyPrompt.selectKeyButton}
            </>
          )}
        </button>

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
            statusMessage.type === 'error' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle size={16} />}
            {statusMessage.type === 'error' && <XCircle size={16} />}
            {statusMessage.type === 'info' && <Info size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <p className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-1">
          <Info size={14} />
          {t.apiKeyPrompt.billingInfo}{' '}
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-emerald-600 hover:underline"
          >
            {t.apiKeyPrompt.billingLinkText}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;