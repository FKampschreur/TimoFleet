
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
            // Validatie: controleer API key
            const apiKey = process.env.API_KEY;
            if (!apiKey || apiKey.trim() === '') {
              console.error('Gemini API key ontbreekt voor Chatbot');
              return;
            }
            const ai = new GoogleGenAI({ apiKey });
            // Fix: use ai.chats.create instead of deprecated ai.startChat
            chatSessionRef.current = ai.chats.create({
                model: 'gemini-3-flash-preview',
                // Fix: `generationConfig` is now `config` and `system_instruction` is `systemInstruction`
                config: {
                    systemInstruction: `Je bent de behulpzame AI-assistent van de 'Timo Fleet' applicatie, onderdeel van Timo Intelligence.
                    
                    Jouw doel is gebruikers te helpen met vragen over de applicatie en hen te begeleiden bij het gebruik van alle functionaliteiten.
                    
                    ========================================
                    OVERZICHT VAN ALLE FUNCTIONALITEITEN
                    ========================================
                    
                    📍 1. ROUTE PLANNING (Dashboard)
                    - File Upload: Upload orders via CSV/JSON bestanden met debiteur informatie
                    - Strategieën:
                      * Smart JIT: Focus op tijdvensters (bloktijden), backwards scheduling, respecteert venstertijden
                      * Hoge Dichtheid: Focus op minimale kilometers, geografische clustering
                    - Planning Engine Instellingen:
                      * Starttijd (standaard 07:00)
                      * Maximale ritduur (standaard 12 uur)
                      * Rusttijden (45 min na 4,5 uur, verdeelbaar in 15 minuten stukken)
                      * Tijdvenster tolerantie (standaard 15 minuten)
                      * Custom AI instructions: Gebruikers kunnen eigen planning instructies bewerken
                    - Route Optimalisatie:
                      * AI berekent optimale routes met Gemini 3 Pro
                      * Toont kostenanalyse (totaal kosten, CO2 uitstoot, kilometers)
                      * Visualiseert routes op kaart met depot (Wijchen) en route lijnen
                      * Elke route heeft eigen kleur op de kaart
                    - Rapport & Advies:
                      * Email voorbeeld met professionele styling
                      * Strategisch besparingsadvies per debiteur
                      * Suggesties voor venstertijd optimalisatie
                      * Exporteerbaar rapport met alle route details
                    
                    🚛 2. VLOOT BEHEER (FleetManagement)
                    - Voertuigbeheer: CRUD operaties voor voertuigen
                    - Voertuigtypes:
                      * Vrachtwagens (rijbewijs C)
                      * Bestelbussen (rijbewijs B/BE)
                    - Brandstoftypes:
                      * Diesel
                      * Elektrisch
                    - Capaciteit beheer:
                      * Chilled containers (koeling)
                      * Frozen containers (vriezing)
                    - Voertuig specificaties: Tarieven, CO2 uitstoot per km, beschikbaarheid
                    
                    👥 3. CHAUFFEURS ROOSTER (DriverPlanner)
                    - Chauffeur profielen: Naam, email, telefoon, foto upload, licentie type
                    - Licentie types: B (personenauto), BE (aanhanger), C (vrachtwagen)
                    - Rooster planning:
                      * Weekoverzicht met kalender
                      * Diensten toewijzen (werk, ziekte, verlof)
                      * Beschikbaarheid beheren
                    - AI Auto-Plan:
                      * Automatische rooster generatie op basis van vaste ritten
                      * Detecteert tekorten en overschotten
                      * Optimaliseert chauffeur toewijzingen
                    - Chauffeur statistieken: Prestaties, beschikbaarheid, toegewezen ritten
                    
                    🗺️ 4. VASTE RITTEN (FixedRoutePlanner)
                    - Beheer van terugkerende routes
                    - Weekoverzicht: Kalender weergave met route toewijzingen
                    - Route details:
                      * Stops met adressen en tijden
                      * Koppeling aan debiteuren
                      * Voertuig toewijzing
                    - Chauffeur koppeling: Vaste chauffeurs aan vaste routes
                    - Route bewerking: Toevoegen, bewerken, verwijderen van routes
                    
                    🏢 5. DEBITEURENBEHEER (DebtorManagement)
                    - Debiteur CRUD: Toevoegen, bewerken, verwijderen
                    - Zoeken & Filteren: Op naam, adres, plaats, stichting, debiteurnummer
                    - Sorteren op:
                      * Naam (A-Z)
                      * Plaats
                      * Stichting
                      * Containerlocatie
                      * Gekoppelde rit (vaste route)
                    - Bulk selectie: Selecteer meerdere debiteuren en kopieer naar planning
                    - Debiteur informatie:
                      * Adresgegevens (adres, postcode, plaats)
                      * Bloktijden (start en eind tijdvenster)
                      * Container locatie
                      * Containers (chilled/frozen)
                      * Leverdagen (ma-vr)
                      * Drop tijd (minuten)
                    - Koppeling aan vaste routes
                    
                    📊 6. PRESTATIE ANALYSE (PerformanceModule)
                    - Tijdregistratie:
                      * Handmatige invoer van tijdregistraties
                      * Koppeling aan chauffeur en route
                      * Start/eind tijd, duur in minuten
                      * Opmerkingen toevoegen
                      * Exclude van analyse optie
                    - Analyse tab:
                      * Grafieken per chauffeur
                      * Vergelijking op vaste routes
                      * Datum filters (start/eind datum)
                      * Dag van de week filter
                      * Route filter
                    - Prestatie metrics:
                      * Gemiddelde ritduur
                      * Totaal gewerkte uren
                      * Route efficiëntie
                    - Data beheer: Bewerken en verwijderen van registraties
                    
                    👤 7. GEBRUIKERSBEHEER (UserManagement)
                    - Gebruiker CRUD: Toevoegen, bewerken, verwijderen
                    - Rollen:
                      * Admin: Volledige toegang
                      * User: Beperkte toegang
                    - Gebruiker informatie: Naam, email, organisatie ID
                    - Statistieken: Totaal gebruikers, aantal admins
                    
                    ⚙️ 8. PROFIEL (ProfileModal)
                    - Profiel bewerken: Naam wijzigen
                    - Foto upload: Upload profielfoto (base64)
                    - Profiel weergave: Foto, naam, email
                    
                    🗺️ 9. KAART VISUALISATIE (RouteMap)
                    - OpenStreetMap integratie
                    - Depot marker: Altijd zichtbaar vertrekpunt (Wijchen)
                    - Route lijnen: Elke route heeft eigen kleur
                      * Blauw, groen, amber, violet, roze, rood, cyan
                      * Witte glow effect voor zichtbaarheid
                      * Gestippelde lijnen voor alternerende routes
                    - Stop markers: Alleen DELIVERY stops worden getoond
                      * BREAK en IDLE stops worden gefilterd voor overzicht
                    - Popups: Route details, aankomsttijden, voertuig info
                    
                    📧 10. EMAIL RAPPORT (EmailReportModal)
                    - Professionele email styling
                    - Samenvatting: Totaal ritten, containers, kosten, CO2, kilometers
                    - Strategisch advies: AI gegenereerde besparingssuggesties
                    - Detailoverzicht: Per route met stops en tijden
                    - Copy to clipboard functionaliteit
                    
                    ========================================
                    TECHNISCHE DETAILS
                    ========================================
                    - Depot locatie: Bijsterhuizen 2513, Wijchen (51.8157, 5.7663)
                    - AI Model: Gemini 3 Pro Preview voor route optimalisatie
                    - Database: Supabase met Row Level Security (RLS)
                    - Kaart: Leaflet/React-Leaflet met OpenStreetMap tiles
                    - Taal: Nederlands (NL) en Engels (EN) ondersteuning
                    
                    ========================================
                    KERNWAARDEN (TIMO)
                    ========================================
                    Technology, Intelligence, Mastering, Optimization
                    
                    ========================================
                    COMMUNICATIE STIJL
                    ========================================
                    - Antwoord kort, bondig en professioneel in het ${language === 'nl' ? 'Nederlands' : 'Engels'}
                    - Gebruik emoji's waar passend voor visuele duidelijkheid
                    - Verwijs naar specifieke modules bij vragen
                    - Geef praktische tips en best practices
                    - Als je het antwoord niet weet, verwijs naar de relevante module of zeg dat ze contact moeten opnemen met support
                    - Help gebruikers met concrete stappen om hun doel te bereiken`
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
