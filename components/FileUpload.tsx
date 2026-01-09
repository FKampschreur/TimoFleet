

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

      // Fix: Conform to Debtor type with snake_case and organization_id
      return {
        id: getVal('id') || `CSV-${index}`,
        organization_id: 'temp-org-id', // Placeholder, should be from user context
        name: getVal('naam') || getVal('name') || 'Onbekende Klant',
        address: getVal('adres') || getVal('address') || '',
        postcode: getVal('postcode') || getVal('zip') || getVal('pc') || '',
        city: getVal('plaats') || getVal('city') || getVal('woonplaats') || '',
        time_window_start: getVal('start') || '08:00',
        time_window_end: getVal('eind') || getVal('end') || '17:00',
        drop_time_minutes: Number(getVal('laden')) || Number(getVal('drop')) || 15,
        containers_chilled: Number(getVal('koel')) || Number(getVal('chilled')) || 0,
        containers_frozen: Number(getVal('vries')) || Number(getVal('frozen')) || 0,
      };
    });
  };

  const parseJSON = (text: string): Debtor[] => {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("JSON moet een array zijn.");
      // Fix: Conform to Debtor type with snake_case and organization_id
      return data.map((item: any, index: number) => ({
        id: item.id || `JSON-${index}`,
        organization_id: 'temp-org-id', // Placeholder, should be from user context
        name: item.name || item.naam,
        address: item.address || item.adres,
        postcode: item.postcode || item.zipCode || item.pc || '',
        city: item.city || item.plaats,
        time_window_start: item.timeWindowStart || "08:00",
        time_window_end: item.timeWindowEnd || "17:00",
        drop_time_minutes: Number(item.dropTimeMinutes) || 15,
        containers_chilled: Number(item.containersChilled) || 0,
        containers_frozen: Number(item.containersFrozen) || 0
      }));
    } catch (err: any) {
      throw new Error(`Ongeldige JSON: ${err.message}`);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = isCsv ? parseCSV(text) : parseJSON(text);
        
        if (data.length === 0) throw new Error("Geen geldige data gevonden.");
        
        onDataLoaded(data);
        setStatus('success');
        setMessage(`${isCsv ? 'CSV' : 'JSON'} succesvol omgezet naar database formaat (${data.length} records).`);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || "Fout bij verwerken bestand.");
      }
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
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          accept=".json,.csv"
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