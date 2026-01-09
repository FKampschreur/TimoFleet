
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Bot } from 'lucide-react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Language } from '../types';
import { translations } from '../translations';

interface ChatbotProps {
  language: Language;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Initialize chat session
  useEffect(() => {
    if (!chatSessionRef.current) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // Fix: use ai.chats.create instead of deprecated ai.startChat
            chatSessionRef.current = ai.chats.create({
                model: 'gemini-3-flash-preview',
                // Fix: `generationConfig` is now `config` and `system_instruction` is `systemInstruction`
                config: {
                    systemInstruction: `Je bent de behulpzame AI-assistent van de 'Timo Fleet' applicatie, onderdeel van Timo Intelligence.
                    
                    Jouw doel is gebruikers te helpen met vragen over de applicatie.
                    
                    BELANGRIJKE APP FEATURES OM TE WETEN:
                    1. Route Planning (Dashboard): Hier uploadt de gebruiker orders (CSV/JSON). De AI berekent optimale ritten op basis van 'Smart JIT' (focus op tijdvensters) of 'Hoge Dichtheid' (focus op min. KM).
                    2. Vloot Beheer: Beheer van voertuigen. We ondersteunen Vrachtwagens (C) en Bestelbussen (B/BE), Diesel en Elektrisch.
                    3. Rooster (Chauffeurs): Planning van chauffeursdiensten, ziekte en verlof. AI kan hier automatisch een rooster genereren.
                    4. Vaste Ritten: Beheer van terugkerende vaste routes die aan vaste chauffeurs gekoppeld kunnen worden.
                    
                    KERNWAARDEN (TIMO): Technology, Intelligence, Mastering, Optimization.
                    
                    Antwoord kort, bondig en professioneel in het ${language === 'nl' ? 'Nederlands' : 'Engels'}.
                    Als je het antwoord niet weet, zeg dan dat ze contact moeten opnemen met support.`
                }
            });
        } catch (e) {
            console.error("Chat init failed", e);
        }
    }
  }, [language]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
        // Fix: Use chat.sendMessage with a message property
        const response = await chatSessionRef.current.sendMessage({ message: userMsg });
        setMessages(prev => [...prev, { role: 'model', text: response.text || "Sorry, ik begreep dat niet." }]);
    } catch (error) {
        console.error("Chat error:", error);
        setMessages(prev => [...prev, { role: 'model', text: "Er is een fout opgetreden bij het verbinden met de AI." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 ${isOpen ? 'bg-slate-200 text-slate-600' : 'bg-slate-900 text-white'}`}
        title={t.chatbot.title}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                    <Bot size={20} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-sm">{t.chatbot.title}</h3>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">{t.chatbot.online}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                     <div className="text-center mt-10 px-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-4 text-emerald-500">
                            <Sparkles size={32} />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">
                            {t.chatbot.welcome}
                        </p>
                     </div>
                )}
                
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-slate-900 text-white rounded-tr-none' 
                            : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin text-emerald-500" />
                            <span className="text-xs text-slate-400 font-medium">{t.chatbot.thinking}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex items-center">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={t.chatbot.placeholder}
                        disabled={isLoading}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-slate-900 text-white disabled:bg-slate-300 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
