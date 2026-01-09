
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import React from 'react';
import { Route } from '../types';

interface RouteMapProps {
  routes: Route[];
}

const ROUTE_COLORS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#06b6d4', // Cyan
];

const DEPOT_COORDS: [number, number] = [51.8157, 5.7663];

const MapAutoCenter: React.FC<{ routes: Route[] }> = ({ routes }) => {
    const map = useMap();
    React.useEffect(() => {
        // Verzamel alle coördinaten van delivery stops
        const allCoords = routes.flatMap(r => 
          r.stops
            .filter(s => s.type === 'DELIVERY' && s.lat != null && s.lng != null && s.lat !== 0 && s.lng !== 0)
            .map(s => [s.lat!, s.lng!] as [number, number])
        ).filter((c): c is [number, number] => c !== null);

        // Zorg dat depot altijd in de bounds zit
        if (allCoords.length > 0) {
            const bounds = L.latLngBounds([DEPOT_COORDS, ...allCoords]);
            map.fitBounds(bounds, { 
              padding: [50, 50],
              maxZoom: 12,
              animate: true 
            });
        } else {
            // Als er geen routes zijn, center op depot
            map.setView(DEPOT_COORDS, 12, { animate: true });
        }
    }, [routes, map]);
    return null;
};

const createMarkerIcon = (color: string, label: string, isDepot: boolean = false) => {
    const size = isDepot ? 32 : 28;
    return L.divIcon({
        className: 'custom-route-marker',
        html: `
            <div style="
                background-color: ${isDepot ? '#0f172a' : color};
                width: ${size}px;
                height: ${size}px;
                border-radius: ${isDepot ? '8px' : '50%'};
                border: 2.5px solid white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.25);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: ${isDepot ? '14px' : '11px'};
                font-weight: 900;
                transform: translate(-50%, -50%);
            ">
                ${label}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
};

const RouteMap: React.FC<RouteMapProps> = ({ routes }) => {
  // Zorg dat routes altijd een array is
  const safeRoutes = routes || [];
  
  // Debug: log route informatie
  React.useEffect(() => {
    console.log('RouteMap: routes received', safeRoutes.length);
    safeRoutes.forEach((route, idx) => {
      const deliveryStops = route.stops.filter(s => s.type === 'DELIVERY' && s.lat != null && s.lng != null && s.lat !== 0);
      console.log(`Route ${idx} (${route.vehicleId}): ${deliveryStops.length} delivery stops met coördinaten`);
    });
  }, [safeRoutes]);
  
  // Fix voor Leaflet default icon issue
  React.useEffect(() => {
    // Verwijder default icon path issues
    if (typeof window !== 'undefined' && L && L.Icon && L.Icon.Default) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    }
  }, []);
  
  return (
    <div className="h-[600px] w-full rounded-[2rem] overflow-hidden shadow-inner border border-slate-200 bg-slate-100 relative">
      <MapContainer 
        center={DEPOT_COORDS} 
        zoom={10} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
      >
        {/* Primaire OpenStreetMap tiles - betrouwbare bron met meerdere subdomains voor betere laadprestaties */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          maxNativeZoom={19}
          subdomains={['a', 'b', 'c']}
          tileSize={256}
          zoomOffset={0}
          updateWhenZooming={false}
          updateWhenIdle={true}
          keepBuffer={3}
          noWrap={false}
        />
        
        {/* Depot Marker - Altijd zichtbaar als vertreklocatie - HOGE PRIORITEIT */}
        <Marker 
            position={DEPOT_COORDS} 
            icon={createMarkerIcon('#1e293b', '🏠', true)}
            zIndexOffset={2000}
        >
            <Popup className="rounded-xl overflow-hidden">
                <div className="p-3">
                    <div className="font-black text-slate-900 text-sm mb-1 flex items-center gap-2">
                        <span className="text-lg">🏠</span>
                        <span>Vertreklocatie</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm">Holland Food Service</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Hoofdkantoor Wijchen</div>
                    <div className="text-[10px] text-slate-500 mt-1">Bijsterhuizen 2513, Wijchen</div>
                </div>
            </Popup>
        </Marker>

        {safeRoutes.length > 0 ? safeRoutes.map((route, rIdx) => {
          const color = ROUTE_COLORS[rIdx % ROUTE_COLORS.length];
          // Filter alleen DELIVERY stops met geldige coördinaten voor de route lijn
          // Dit zorgt ervoor dat de lijn alleen de daadwerkelijke route volgt
          const deliveryStops = route.stops
            .filter(s => s.type === 'DELIVERY' && s.lat != null && s.lng != null && s.lat !== 0 && s.lng !== 0);
          
          // Bouw de route lijn: depot -> delivery stops in volgorde -> depot
          const polylinePoints: [number, number][] = deliveryStops.length > 0 ? [
            DEPOT_COORDS,
            ...deliveryStops.map(s => [s.lat!, s.lng!] as [number, number]),
            DEPOT_COORDS
          ] : [];

          // Debug logging
          if (deliveryStops.length === 0) {
            console.warn(`Route ${rIdx} (${route.vehicleId}) heeft geen delivery stops met coördinaten. Totaal stops: ${route.stops.length}`);
            // Log alle stops om te zien wat er is
            console.log('Alle stops:', route.stops.map(s => ({ type: s.type, lat: s.lat, lng: s.lng })));
          } else {
            console.log(`Route ${rIdx} (${route.vehicleId}): ${deliveryStops.length} delivery stops, polyline punten: ${polylinePoints.length}`);
          }

          return (
            <React.Fragment key={`route-${rIdx}-${route.vehicleId || rIdx}`}>
              {polylinePoints.length >= 2 && (
                <>
                  {/* Outer Glow / Border for the line - maakt de route beter zichtbaar */}
                  <Polyline 
                    key={`route-border-${rIdx}`}
                    positions={polylinePoints} 
                    pathOptions={{ 
                      color: 'white', 
                      weight: 10, 
                      opacity: 0.6,
                      lineJoin: 'round',
                      lineCap: 'round',
                      interactive: false
                    }} 
                  />
                  {/* Main Route Line - elke route heeft zijn eigen kleur */}
                  <Polyline 
                    key={`route-line-${rIdx}`}
                    positions={polylinePoints} 
                    pathOptions={{ 
                      color, 
                      weight: 6, 
                      opacity: 1.0, 
                      lineJoin: 'round',
                      lineCap: 'round',
                      dashArray: rIdx % 2 === 0 ? undefined : '10, 5', // Alternerende stijl voor betere onderscheiding
                      interactive: true
                    }} 
                  />
                </>
              )}
              
              {/* Alleen DELIVERY stops als markers - BREAK en IDLE worden niet getoond voor overzichtelijke route lijn */}
              {route.stops
                .filter(stop => stop.type === 'DELIVERY' && stop.lat != null && stop.lng != null && stop.lat !== 0 && stop.lng !== 0)
                .map((stop, sIdx) => {
                  // Tel hoeveelste aflevering dit is in deze route
                  const deliveryIndex = route.stops
                    .slice(0, route.stops.indexOf(stop) + 1)
                    .filter(s => s.type === 'DELIVERY').length;
                  const label = deliveryIndex.toString();

                  return (
                    <Marker 
                      key={`${rIdx}-${stop.debtorId || sIdx}`} 
                      position={[stop.lat!, stop.lng!]} 
                      icon={createMarkerIcon(color, label)}
                    >
                      <Popup className="rounded-2xl">
                        <div className="min-w-[160px]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-slate-900 text-white text-[10px] font-black">
                                    {label}
                                </div>
                                <div className="font-black text-slate-900 text-sm truncate">{stop.name}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                    📍 {stop.address}, {stop.city}
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Aankomst</span>
                                        <span className="text-xs font-black text-slate-800">{stop.arrivalTime}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Voertuig</span>
                                        <span className="text-xs font-black text-emerald-600">{route.vehicleId}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </React.Fragment>
          );
        }) : (
          // Geen routes - toon alleen depot
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 z-10 pointer-events-none">
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-slate-200">
              <p className="text-sm font-bold text-slate-600">Geen routes beschikbaar</p>
            </div>
          </div>
        )}
        
        <MapAutoCenter routes={routes || []} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
