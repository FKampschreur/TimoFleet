

import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Download, FileJson, FileText, Code } from 'lucide-react';
import { Debtor } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: Debtor[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseCSV = (text: string): Debtor[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("CSV bestand is leeg of mist headers.");

    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());

    return lines.slice(1).map((line, index) => {
      const values = line.split(delimiter).map(v => v.trim());
      const getVal = (search: string) => {
        const idx = headers.findIndex(h => h.includes(search));
        return idx !== -1 ? values[idx] : undefined;
      };

      // SECURITY: Sanitize en valideer input data
      const sanitizeString = (val: string | undefined, maxLength: number = 500): string => {
        if (!val) return '';
        // Verwijder gevaarlijke karakters en limiteer lengte
        return val.replace(/[<>\"']/g, '').substring(0, maxLength).trim();
      };
      
      const sanitizeNumber = (val: string | undefined, defaultValue: number = 0, min: number = 0, max: number = 10000): number => {
        const num = Number(val);
        if (isNaN(num)) return defaultValue;
        return Math.max(min, Math.min(max, num));
      };
      
      const sanitizeTime = (val: string | undefined, defaultValue: string = '08:00'): string => {
        if (!val) return defaultValue;
        // Valideer tijdformaat HH:MM
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(val) ? val : defaultValue;
      };

      return {
        id: sanitizeString(getVal('id')) || `CSV-${index}`,
        organization_id: 'temp-org-id', // Placeholder, should be from user context
        name: sanitizeString(getVal('naam') || getVal('name')) || 'Onbekende Klant',
        address: sanitizeString(getVal('adres') || getVal('address'), 200),
        postcode: sanitizeString(getVal('postcode') || getVal('zip') || getVal('pc'), 10),
        city: sanitizeString(getVal('plaats') || getVal('city') || getVal('woonplaats'), 100),
        time_window_start: sanitizeTime(getVal('start'), '08:00'),
        time_window_end: sanitizeTime(getVal('eind') || getVal('end'), '17:00'),
        drop_time_minutes: sanitizeNumber(getVal('laden') || getVal('drop'), 15, 0, 480),
        containers_chilled: sanitizeNumber(getVal('koel') || getVal('chilled'), 0, 0, 1000),
        containers_frozen: sanitizeNumber(getVal('vries') || getVal('frozen'), 0, 0, 1000),
      };
    });
  };

  const parseJSON = (text: string): Debtor[] => {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("JSON moet een array zijn.");
      
      // SECURITY: Helper functies voor sanitization (hergebruik van CSV)
      const sanitizeString = (val: any, maxLength: number = 500): string => {
        if (!val || typeof val !== 'string') return '';
        return val.replace(/[<>\"']/g, '').substring(0, maxLength).trim();
      };
      
      const sanitizeNumber = (val: any, defaultValue: number = 0, min: number = 0, max: number = 10000): number => {
        const num = Number(val);
        if (isNaN(num)) return defaultValue;
        return Math.max(min, Math.min(max, num));
      };
      
      const sanitizeTime = (val: any, defaultValue: string = '08:00'): string => {
        if (!val || typeof val !== 'string') return defaultValue;
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(val) ? val : defaultValue;
      };
      
      return data.map((item: any, index: number) => ({
        id: sanitizeString(item.id) || `JSON-${index}`,
        organization_id: 'temp-org-id', // Placeholder, should be from user context
        name: sanitizeString(item.name || item.naam) || 'Onbekende Klant',
        address: sanitizeString(item.address || item.adres, 200),
        postcode: sanitizeString(item.postcode || item.zipCode || item.pc, 10),
        city: sanitizeString(item.city || item.plaats, 100),
        time_window_start: sanitizeTime(item.timeWindowStart, "08:00"),
        time_window_end: sanitizeTime(item.timeWindowEnd, "17:00"),
        drop_time_minutes: sanitizeNumber(item.dropTimeMinutes, 15, 0, 480),
        containers_chilled: sanitizeNumber(item.containersChilled, 0, 0, 1000),
        containers_frozen: sanitizeNumber(item.containersFrozen, 0, 0, 1000)
      }));
    } catch (err: any) {
      throw new Error(`Ongeldige JSON: ${err.message}`);
    }
  };

  const processFile = (file: File) => {
    // SECURITY: Valideer bestandsgrootte (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      setStatus('error');
      setMessage(`Bestand is te groot (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum grootte is 5MB.`);
      return;
    }
    
    // SECURITY: Valideer bestandstype
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const isJson = file.name.toLowerCase().endsWith('.json');
    if (!isCsv && !isJson) {
      setStatus('error');
      setMessage('Alleen CSV en JSON bestanden zijn toegestaan.');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        
        // SECURITY: Valideer dat bestand niet leeg is
        if (!text || text.trim().length === 0) {
          throw new Error("Bestand is leeg.");
        }
        
        // SECURITY: Limiteer tekst lengte om memory exhaustion te voorkomen
        const MAX_TEXT_LENGTH = 10 * 1024 * 1024; // 10MB tekst
        if (text.length > MAX_TEXT_LENGTH) {
          throw new Error(`Bestand bevat te veel tekst (${(text.length / 1024 / 1024).toFixed(2)}MB). Maximum is 10MB.`);
        }
        
        const data = isCsv ? parseCSV(text) : parseJSON(text);
        
        if (data.length === 0) throw new Error("Geen geldige data gevonden.");
        
        // SECURITY: Limiteer aantal records om DoS te voorkomen
        const MAX_RECORDS = 10000;
        if (data.length > MAX_RECORDS) {
          throw new Error(`Te veel records (${data.length}). Maximum is ${MAX_RECORDS} records per bestand.`);
        }
        
        onDataLoaded(data);
        setStatus('success');
        setMessage(`${isCsv ? 'CSV' : 'JSON'} succesvol omgezet naar database formaat (${data.length} records).`);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || "Fout bij verwerken bestand.");
      }
    };
    
    reader.onerror = () => {
      setStatus('error');
      setMessage('Fout bij lezen van bestand.');
    };
    
    reader.readAsText(file);
  };

  const downloadTemplate = (type: 'csv' | 'json') => {
    const data = [
      {
        id: "DEB101",
        naam: "Bakkerij Jansen",
        adres: "Dorpsstraat 12",
        postcode: "6602 AB",
        plaats: "Wijchen",
        start: "08:00",
        eind: "11:00",
        laden: 20,
        koel: 5,
        vries: 2
      }
    ];

    let content: string;
    let fileName: string;
    let mimeType: string;

    if (type === 'csv') {
      const headers = "id;naam;adres;postcode;plaats;start;eind;laden;koel;vries";
      const row = `${data[0].id};${data[0].naam};${data[0].adres};${data[0].postcode};${data[0].plaats};${data[0].start};${data[0].eind};${data[0].laden};${data[0].koel};${data[0].vries}`;
      content = headers + "\n" + row;
      fileName = "planning_template.csv";
      mimeType = "text/csv";
    } else {
      content = JSON.stringify(data, null, 2);
      fileName = "planning_template.json";
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Upload size={20} className="text-emerald-600" />
            Data Import
        </h2>
        <div className="flex gap-2">
            <button onClick={() => downloadTemplate('csv')} className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1">
                <Download size={12} /> CSV Template
            </button>
            <button onClick={() => downloadTemplate('json')} className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1">
                <Download size={12} /> JSON Template
            </button>
        </div>
      </div>
      
      <div 
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all duration-200 ${
          dragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // SECURITY: Valideer bestandstype opnieuw in browser
              const validTypes = ['text/csv', 'application/json', 'text/plain'];
              const validExtensions = ['.csv', '.json'];
              const isValidType = validTypes.includes(file.type) || 
                                 validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
              
              if (!isValidType) {
                setStatus('error');
                setMessage('Alleen CSV en JSON bestanden zijn toegestaan.');
                return;
              }
              
              processFile(file);
            }
          }}
          accept=".json,.csv,text/csv,application/json"
        />
        
        <div className="flex gap-4 mb-3">
            <FileText size={32} className="text-blue-400" />
            <div className="w-px h-8 bg-slate-200 self-center" />
            <FileJson size={32} className="text-amber-400" />
        </div>
        <p className="text-sm text-slate-600 font-medium mb-1 text-center">Sleep CSV of JSON hierheen</p>
        <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">App converteert CSV automatisch naar JSON</p>
      </div>

      {status !== 'idle' && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
            status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}>
            {status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {message}
          </div>
      )}
    </div>
  );
};

export default FileUpload;