import { GoogleGenAI, Type } from "@google/genai";
import { Debtor, OptimizationResult, PlanningConfig, Vehicle, VehicleType, Route, Stop, PlanningStrategy, OptimizationAdvice } from '../types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const parts = time.split(':');
  if (parts.length < 2) return 0;
  const [h, m] = parts.map(Number);
  return (isNaN(h) || isNaN(m)) ? 0 : h * 60 + m;
};

const formatMinToTime = (min: number) => {
    const h = (Math.floor(min / 60) + 24) % 24;
    const m = Math.round(min % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const getPostcodePrefix = (pc: string): string => {
    // Haal de eerste 2 cijfers van de postcode (NL formaat '1234 AB')
    const match = pc.match(/^(\d{2})/);
    return match ? match[1] : '00';
};

const mergeOrders = (orders: Debtor[]): Debtor[] => {
  const merged: { [key: string]: Debtor } = {};
  orders.forEach(order => {
    const key = `${order.address.toLowerCase()}|${order.postcode.toLowerCase()}|${order.city.toLowerCase()}|${order.time_window_start}|${order.time_window_end}`;
    if (merged[key]) {
      merged[key].containers_chilled += order.containers_chilled;
      merged[key].containers_frozen += order.containers_frozen;
      merged[key].drop_time_minutes = Math.max(merged[key].drop_time_minutes, order.drop_time_minutes);
      merged[key].name = `${merged[key].name} + ${order.name}`;
    } else {
      merged[key] = { ...order };
    }
  });

  return Object.values(merged);
};

// NIEUWE LOGICA: Smart Batching
// In plaats van domweg de lijst af te lopen, zoeken we buren.
// Dit helpt de AI enorm door logische groepen aan te leveren.
const getSmartBatch = (orders: Debtor[], vehicle: Vehicle, strategy: PlanningStrategy): Debtor[] => {
    if (orders.length === 0) return [];

    const selected: Debtor[] = [];
    let currentChilled = 0;
    let currentFrozen = 0;
    
    // We maken een kopie om uit te kiezen
    let remainingPool = [...orders];

    // Stap 1: Kies het "zaadje" (de eerste order in de gesorteerde lijst)
    // De lijst is al gesorteerd op Tijd (JIT) of Regio (Density) in de hoofdfunctie
    const seed = remainingPool[0];
    selected.push(seed);
    remainingPool.shift(); // Verwijder seed uit pool
    
    currentChilled += seed.containers_chilled;
    currentFrozen += seed.containers_frozen;

    const seedRegion = getPostcodePrefix(seed.postcode);

    // Stap 2: Vul de rest van de wagen
    while (remainingPool.length > 0) {
        // We zoeken de beste match voor de huidige lading
        let bestCandidateIndex = -1;
        
        // Simpele heuristiek: Zoek eerst in dezelfde regio (eerste 2 cijfers postcode)
        // Als strategie JIT is, wegen we tijd zwaarder, anders regio.
        bestCandidateIndex = remainingPool.findIndex(candidate => {
            const fitsChilled = (currentChilled + candidate.containers_chilled) <= vehicle.capacity.chilled;
            const fitsFrozen = (currentFrozen + candidate.containers_frozen) <= vehicle.capacity.frozen;
            
            if (!fitsChilled || !fitsFrozen) return false;

            // Als we nog ruimte hebben, geef voorrang aan zelfde regio
            const candidateRegion = getPostcodePrefix(candidate.postcode);
            return candidateRegion === seedRegion; 
        });

        // Als geen regio-genoot gevonden, pak de volgende die past (fallback)
        if (bestCandidateIndex === -1) {
             bestCandidateIndex = remainingPool.findIndex(candidate => {
                const fitsChilled = (currentChilled + candidate.containers_chilled) <= vehicle.capacity.chilled;
                const fitsFrozen = (currentFrozen + candidate.containers_frozen) <= vehicle.capacity.frozen;
                return fitsChilled && fitsFrozen;
            });
        }

        // Als er echt niets meer past, stoppen we
        if (bestCandidateIndex === -1) break;

        // Voeg toe
        const candidate = remainingPool[bestCandidateIndex];
        selected.push(candidate);
        currentChilled += candidate.containers_chilled;
        currentFrozen += candidate.containers_frozen;
        
        // Verwijder uit pool
        remainingPool.splice(bestCandidateIndex, 1);

        // Check of wagen vol is
        if (currentChilled >= vehicle.capacity.chilled || currentFrozen >= vehicle.capacity.frozen) break;
    }

    return selected;
};

// Helper voor kostenberekening (clean code)
const calculateRouteCosts = (vehicle: Vehicle, durationHours: number, distanceKm: number) => {
    const personnel = durationHours * vehicle.hourly_rate;
    const fuel = (distanceKm / 100) * vehicle.consumption_per_100km * vehicle.fuel_price_per_unit;
    // Vaste kosten per rit (afhandeling, planning overhead)
    const fixed = vehicle.type === VehicleType.TRUCK ? 50 : 30; 
    const depreciation = (durationHours / 160) * (vehicle.monthly_fixed_cost || 0);
    
    return {
        total: personnel + fuel + fixed + depreciation,
        breakdown: {
            personnel,
            personnelDetail: `${durationHours.toFixed(2)}u x €${vehicle.hourly_rate}`,
            fuel,
            fuelDetail: `${distanceKm}km x €${vehicle.fuel_price_per_unit}`,
            fixed,
            depreciation,
            depreciationDetail: `Afschrijving: €${depreciation.toFixed(2)}`
        }
    };
};

const routeSchema = {
  type: Type.OBJECT,
  properties: {
    start_time: { 
      type: Type.STRING, 
      description: "De berekende vertrektijd uit Wijchen (HH:MM)." 
    },
    totaal_km: { type: Type.NUMBER, description: "Totaal KM inclusief de rit terug naar het depot" },
    stops: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Debiteur ID of 'DEPOT' voor retourrit" },
          arr: { type: Type.STRING, description: "Aankomsttijd (HH:MM)" },
          act: { type: Type.STRING, description: "D (Delivery), B (Break), I (Idle/Wait), R (Return to Depot)" },
          dur: { type: Type.INTEGER, description: "Duur in minuten" },
          km: { type: Type.NUMBER, description: "KM vanaf vorige stop" },
          lat: { type: Type.NUMBER, description: "Latitude coördinaat" },
          lng: { type: Type.NUMBER, description: "Longitude coördinaat" },
          msg: { type: Type.STRING }
        },
        required: ["act", "arr", "dur", "km", "lat", "lng"]
      }
    }
  },
  required: ["start_time", "stops", "totaal_km"]
};

export const getBrainInstruction = (strategy: PlanningStrategy, toleranceMinutes: number, maxDuration: number, customInstruction?: string): string => {
    
    // If user provided a custom instruction, use it.
    if (customInstruction && customInstruction.trim().length > 0) {
        return customInstruction;
    }

    if (strategy === 'JIT') {
        return `
HARDE EISEN (CRUCIAAL):
1. MAXIMALE RITDUUR PER RIT: Elke INDIVIDUELE rit (van start tot terugkomst depot) mag NOOIT langer duren dan ${maxDuration} uur. Dit geldt voor ELKE rit afzonderlijk, niet voor het totaal van alle ritten. Als een rit de ${maxDuration}u dreigt te overschrijden, gebruik dan een extra voertuig voor de overige stops.
2. RUSTTIJDEN - FLEXIBELE VERDELING: Plan verplicht 45 minuten pauze (act: 'B') in na elke 4,5 uur rijtijd/werktijd. BELANGRIJK: Deze 45 minuten pauze mag VERDEELD worden in minimaal 15 minuten stukken. Dit is handig als je te vroeg bij een adres aankomt - gebruik dan 15 minuten pauze om de tijd te vullen tot de bloktijd begint. Bijvoorbeeld: 15 min + 15 min + 15 min = 45 min totaal, of 30 min + 15 min = 45 min.
3. EXTRA VOERTUIGEN: Als orders de maximale ritduur van ${maxDuration}u per rit overschrijden of buiten de bloktijden vallen, worden automatisch extra voertuigen ingezet om deze orders alsnog in te plannen. Elke rit moet binnen ${maxDuration}u blijven - gebruik extra voertuigen indien nodig.

!!! LEIDEND PRINCIPE & HOOGSTE PRIORITEIT !!!
"Ik heb meerdere debiteuren met afleveringsadressen. Elke debiteur heeft bloktijden, bijvoorbeeld tussen 09:00 en 12:00."

DIT IS DE BASIS VAN DE ANALYSE:
1. De BLOKTIJDEN (parameter 'w') zijn heilig en leidend.
2. Een levering MOET vallen binnen het opgegeven blok.
3. Optimaliseer de route zodat aankomsttijden binnen deze blokken vallen.
4. Als een aankomsttijd buiten het blok dreigt te vallen, moet de planning worden aangepast (eerder vertrekken of volgorde wijzigen).
5. Als orders niet binnen de maximale ritduur (${maxDuration}u PER RIT) of bloktijden passen, worden extra voertuigen automatisch ingezet om alle orders uiteindelijk in te plannen.

ROL & DOEL:
Jij bent 's werelds beste logistieke planner. Je voert bovenstaand leidend principe uit middels "Backwards Scheduling".

ALGORITME VOOR SMART JIT (VOLG EXACT):

STAP 1: BENUT DE TOLERANTIE (Ondergeschikt aan bloktijd)
- Tolerantie aanhouden: maximaal ${toleranceMinutes} minuten.
- Gebruik dit als buffer, maar het doel blijft het kern-bloktijdvenster.

STAP 2: VERKEER
- Vrachtwagensnelheid: 70 km/u snelweg, 35 km/u stad.
- Spits: +20% reistijd tussen 07:00-09:00.

STAP 3: SERVICETIJD
- Gebruik EXACT de meegeleverde parameter 'd' als duur.

STAP 4: RUSTTIJDEN - INTELLIGENTE VERDELING
- Na elke 4,5 uur rijtijd/werktijd moet er 45 minuten pauze zijn.
- Deze 45 minuten mag VERDEELD worden in minimaal 15 minuten stukken.
- STRATEGIE: Als je te vroeg bij een adres aankomt (voor de bloktijd begint), gebruik dan 15 minuten pauze om de tijd te vullen.
- Voorbeeld: Als je om 08:45 aankomt en de bloktijd begint om 09:00, plan dan 15 minuten pauze (act: 'B', dur: 15) in plaats van te wachten (act: 'I').
- Dit helpt om de totale ritduur binnen ${maxDuration}u te houden en efficiënt gebruik te maken van de tijd.

STAP 5: VERTREKTIJD BEPALEN (BACKWARDS SCHEDULING)
- Bepaal de Eerste Stop (Stop 1).
- ANKERPUNT: Mik op aankomst bij Stop 1 aan het BEGIN van zijn bloktijd (minus eventuele tolerantie).
- Dit garandeert dat we de bloktijden respecteren.

STAP 6: ROUTE OPBOUW
1. Start op berekende 'start_time' in Wijchen.
2. Rij naar stops.
3. Indien wettelijk nodig: Verdeel 45 min pauze in minimaal 15 minuten stukken na 4,5 uur.
4. Gebruik 15 minuten pauze als je te vroeg bij een adres aankomt (in plaats van wachten).
5. Eindig met 'R' (Retour Wijchen).
6. CONTROLEER: De totale ritduur (van start tot terugkomst) mag MAXIMAAL ${maxDuration} uur zijn. Als dit overschreden wordt, gebruik dan een extra voertuig voor de overige stops.

STAP 7: VOERTUIG HIERARCHIE (Vrachtwagen vs Bestelbus)
- Principe: De Vrachtwagen is LEIDEND (standaard keuze voor capaciteit).
- Echter: Analyseer of de rit (qua volume & tijd) klein genoeg blijft.
- Als de rit "bijna gereed" is of compact, controleer of een Bestelbus mogelijk is (goedkoper).
- Plan dus zo efficiënt mogelijk: als de route in een bus past, heeft dat financieel de voorkeur.
    `;
    } else {
        return `
    HARDE EISEN (CRUCIAAL):
    1. MAXIMALE RITDUUR: De totale rit (start depot tot terugkomst depot) mag NOOIT langer duren dan ${maxDuration} uur.
    2. RUSTTIJDEN: Plan verplicht 45 min pauze (act: 'B') in na elke 4,5 uur rijtijd/werktijd.
    3. SERVICE TIJD: Elke stop heeft een duur 'd'. Dit is de lostijd ter plaatse.

    STRATEGIE: HIGH DENSITY CLUSTERING
    
    DOEL: Minimaliseer kilometers door geografische clustering.
    - Venstertijden zijn belangrijk, maar geografische logica is leidend.
    - Maximale afwijking venster: ${toleranceMinutes} minuten.
    - Probeer ritten zo compact mogelijk te houden.
    `;
    }
};

export const generateOptimalRoutes = async (
  debtors: Debtor[],
  vehicles: Vehicle[],
  config: PlanningConfig
): Promise<OptimizationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Samenvoegen van orders op zelfde adres/tijd
  let consolidatedOrders = mergeOrders(debtors.filter(d => (d.containers_chilled + d.containers_frozen) > 0));

  // 2. Primaire sortering (Tijd of Regio)
  if (config.selectedStrategy === 'JIT') {
    consolidatedOrders.sort((a, b) => {
        // Eerst op tijdvenster start
        const startA = timeToMinutes(a.time_window_start);
        const startB = timeToMinutes(b.time_window_start);
        if (startA !== startB) return startA - startB;
        // Daarna op regio (postcode)
        return a.postcode.localeCompare(b.postcode);
    });
  } else {
    // Density strategy: puur op postcode sorteren
    consolidatedOrders.sort((a, b) => a.postcode.localeCompare(b.postcode));
  }

  let availableFleet = vehicles.filter(v => v.is_available);
  const calculatedRoutes: Route[] = [];
  let totalCost = 0;
  let totalDistance = 0;
  let totalEmission = 0;

  // 3. Greedy Vehicle Allocation Loop
  while (consolidatedOrders.length > 0 && availableFleet.length > 0) {
    await sleep(600); // Rate limit protectie

    const totalRemainingChilled = consolidatedOrders.reduce((sum, o) => sum + o.containers_chilled, 0);
    const totalRemainingFrozen = consolidatedOrders.reduce((sum, o) => sum + o.containers_frozen, 0);

    // Kies voertuig: We proberen de kleinste te vinden die alles kan meenemen, 
    // OF als dat niet past, de grootste beschikbare om zoveel mogelijk weg te werken.
    const sortedFleet = [...availableFleet].sort((a, b) => 
        (a.capacity.chilled + a.capacity.frozen) - (b.capacity.chilled + b.capacity.frozen)
    );

    let vehicleIndex = sortedFleet.findIndex(v => 
        v.capacity.chilled >= totalRemainingChilled && 
        v.capacity.frozen >= totalRemainingFrozen
    );

    // Als niets in 1x past, pak de grootste
    if (vehicleIndex === -1) vehicleIndex = sortedFleet.length - 1;
    
    const vehicle = sortedFleet[vehicleIndex];
    availableFleet = availableFleet.filter(v => v.id !== vehicle.id);

    // 4. SMART BATCHING: Haal een logische groep orders op die in dit voertuig past
    const fittingBatch = getSmartBatch(consolidatedOrders, vehicle, config.selectedStrategy);
    
    if (fittingBatch.length === 0) continue;

    const pool = fittingBatch.map(d => ({
      id: d.id, n: d.name, a: d.address, c: d.city, pc: d.postcode, w: `${d.time_window_start}-${d.time_window_end}`, d: d.drop_time_minutes, cc: d.containers_chilled, cf: d.containers_frozen
    }));

    const strategyInstruction = getBrainInstruction(
        config.selectedStrategy, 
        config.timeWindowToleranceMinutes, 
        config.maxRouteDurationHours,
        config.customInstruction
    );

    const prompt = `Plan route voor ${vehicle.id} (${vehicle.type}).
    DEPOT: Wijchen.
    BATCH: ${JSON.stringify(pool)}.
    
    ${strategyInstruction}
    
    Lever JSON op volgens schema.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { 
          temperature: 0.1, 
          responseMimeType: "application/json", 
          responseSchema: routeSchema 
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result && result.stops) {
        let hydratedRoute = hydrateRoute(result, vehicle, consolidatedOrders, config);
        
        // Validatie: Filter stops die écht niet passen binnen tolerantie (als failsafe)
        const validStops = hydratedRoute.stops.filter(s => {
            if (s.type !== 'DELIVERY') return true;
            return (s.lateMinutes || 0) <= config.timeWindowToleranceMinutes;
        });

        if (validStops.some(s => s.type === 'DELIVERY')) {
            hydratedRoute.stops = validStops;
            calculatedRoutes.push(hydratedRoute);
            totalCost += hydratedRoute.totalCost;
            totalDistance += hydratedRoute.totalDistanceKm;
            totalEmission += hydratedRoute.totalCo2Emission;

            // Verwijder geplande orders uit de master lijst
            const plannedIds = new Set(validStops.map(s => s.debtorId).filter(id => !!id));
            consolidatedOrders = consolidatedOrders.filter(d => !plannedIds.has(d.id));
        }
      }
    } catch (e) {
      console.error(`Route error:`, e);
    }
  }

  return {
    routes: calculatedRoutes,
    totalUnassigned: consolidatedOrders.length,
    summary: {
      totalRoutes: calculatedRoutes.length,
      totalContainersMoved: calculatedRoutes.reduce((acc, r) => acc + r.totalContainers, 0),
      totalCo2Saved: 0,
      totalCost,
      totalDistance: Math.round(totalDistance),
      totalEmission
    }
  };
};

export const recalculateRouteWithOrder = async (
  vehicle: Vehicle,
  stops: Stop[],
  config: PlanningConfig,
  allDebtors: Debtor[]
): Promise<Route> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sequence = stops
    .filter(s => s.type === 'DELIVERY')
    .map(s => {
      const d = allDebtors.find(debtor => debtor.id === s.debtorId);
      return { id: s.debtorId, name: d?.name, addr: d?.address, win: `${d?.time_window_start}-${d?.time_window_end}`, drop: d?.drop_time_minutes };
    });

  const prompt = `Herbereken tijden voor voertuig ${vehicle.id} in deze VOLGORDE: ${JSON.stringify(sequence)}. 
  DEPOT: Wijchen. 
  ${getBrainInstruction(config.selectedStrategy, config.timeWindowToleranceMinutes, config.maxRouteDurationHours, config.customInstruction)}`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { temperature: 0.1, responseMimeType: "application/json", responseSchema: routeSchema }
    });
    const result = JSON.parse(response.text || '{}');
    return hydrateRoute(result, vehicle, allDebtors, config);
  } catch (err) {
    console.error("Recalculate error:", err);
    throw err;
  }
};

export const generateSavingsAdvice = async (
    routes: Route[],
    allDebtors: Debtor[]
): Promise<OptimizationAdvice[]> => {
    if (routes.length === 0) return [];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const routesSummary = routes.map(r => ({
        id: r.vehicleId,
        cost: r.totalCost,
        stops: r.stops.filter(s => s.type === 'DELIVERY').map(s => ({ name: s.name, city: s.city, window: s.timeWindow }))
    }));

    const prompt = `Analyseer deze routes en zoek naar kostenbesparingen door venstertijden te verruimen. GEPLANDE RITTEN: ${JSON.stringify(routesSummary)}`;
    const adviceSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                debtorName: { type: Type.STRING },
                currentWindow: { type: Type.STRING },
                suggestedWindow: { type: Type.STRING },
                reason: { type: Type.STRING },
                potentialSavingEur: { type: Type.NUMBER },
                impactDescription: { type: Type.STRING }
            },
            required: ["debtorName", "currentWindow", "suggestedWindow", "reason", "potentialSavingEur", "impactDescription"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { temperature: 0.2, responseMimeType: "application/json", responseSchema: adviceSchema }
        });
        return JSON.parse(response.text || '[]');
    } catch (e) {
        return [];
    }
};

function hydrateRoute(aiResult: any, vehicle: Vehicle, allDebtors: Debtor[], config: PlanningConfig): Route {
  const rawStops: Stop[] = [];
  let currentLat = 51.8157;
  let currentLng = 5.7663;
  
  if (aiResult && aiResult.stops) {
    aiResult.stops.forEach((s: any) => {
        const action = (s.act || 'D').toUpperCase();
        if (action === 'D' && s.id && s.id !== 'DEPOT') {
          const debtor = allDebtors.find(d => d.id === s.id);
          if (debtor) {
            const arrMin = timeToMinutes(s.arr);
            const startMin = timeToMinutes(debtor.time_window_start);
            const endMin = timeToMinutes(debtor.time_window_end);
            
            const earlyMinutes = Math.max(0, startMin - arrMin);
            const lateMinutes = Math.max(0, (arrMin + (s.dur || 15)) - endMin);

            if (s.lat && s.lng) {
                currentLat = s.lat;
                currentLng = s.lng;
            }

            rawStops.push({
              type: 'DELIVERY',
              debtorId: debtor.id,
              name: debtor.name,
              address: debtor.address,
              city: debtor.city,
              arrivalTime: s.arr || "00:00",
              timeWindow: `${debtor.time_window_start} - ${debtor.time_window_end}`,
              durationMinutes: s.dur || 15,
              earlyMinutes,
              lateMinutes,
              containers: debtor.containers_chilled + debtor.containers_frozen,
              containersChilled: debtor.containers_chilled,
              containersFrozen: debtor.containers_frozen,
              lat: s.lat || 0,
              lng: s.lng || 0,
              distanceFromPreviousStop: s.km || 0
            });
          }
        } else if (action === 'R') {
            rawStops.push({
                type: 'IDLE',
                name: "Rit terug naar Depot Wijchen",
                arrivalTime: s.arr || "00:00",
                durationMinutes: s.dur || 0,
                lat: 51.8157, 
                lng: 5.7663,
                distanceFromPreviousStop: s.km || 0
            });
        } else {
          rawStops.push({
            type: action === 'I' ? 'IDLE' : 'BREAK',
            name: s.msg || (action === 'I' ? "Wachten op venster" : "Rustpauze"),
            arrivalTime: s.arr || "00:00",
            durationMinutes: s.dur || 15,
            lat: currentLat,
            lng: currentLng,
            distanceFromPreviousStop: s.km || 0
          });
        }
    });
  }

  const startTime = aiResult.start_time || "07:00";
  const startMin = timeToMinutes(startTime);
  const stops = rawStops;
  const lastStop = stops[stops.length - 1];
  const endTimeMin = lastStop ? timeToMinutes(lastStop.arrivalTime) + (lastStop.durationMinutes || 0) : startMin;
  
  const estimatedDurationHours = (endTimeMin - startMin) / 60;
  const finalDistance = aiResult.totaal_km || 0;

  // Gebruik de nieuwe centrale kosten calculator
  const costs = calculateRouteCosts(vehicle, estimatedDurationHours, finalDistance);

  return {
    vehicleId: vehicle.id,
    vehicleType: vehicle.type,
    stops,
    totalContainers: stops.reduce((acc, s) => acc + (s.containers || 0), 0),
    totalContainersChilled: stops.reduce((acc, s) => acc + (s.containersChilled || 0), 0),
    totalContainersFrozen: stops.reduce((acc, s) => acc + (s.containersFrozen || 0), 0),
    startTime,
    endTime: formatMinToTime(endTimeMin),
    estimatedDurationHours,
    totalDurationMinutes: endTimeMin - startMin,
    totalDistanceKm: Number(finalDistance.toFixed(1)),
    totalCost: costs.total,
    costBreakdown: costs.breakdown,
    totalCo2Emission: Math.round(finalDistance * vehicle.co2_emission_per_km),
    totalPauseMinutes: stops.filter(s => s.type === 'BREAK').reduce((acc, s) => acc + (s.durationMinutes || 0), 0)
  };
}
