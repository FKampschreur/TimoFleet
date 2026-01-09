
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
        if (!routes || routes.length === 0) return;
        
        const allCoords = routes.flatMap(r => 
          r.stops
            .filter(s => s.lat != null && s.lng != null && s.lat !== 0)
            .map(s => [s.lat!, s.lng!] as [number, number])
        ).filter((c): c is [number, number] => c !== null);

        if (allCoords.length > 0) {
            const bounds = L.latLngBounds([DEPOT_COORDS, ...allCoords]);
            map.fitBounds(bounds, { 
              padding: [50, 50],
              maxZoom: 12,
              animate: true 
            });
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
  return (
    <div className="h-[600px] w-full rounded-[2rem] overflow-hidden shadow-inner border border-slate-200 bg-slate-100">
      <MapContainer center={DEPOT_COORDS} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />
        
        {/* Depot Marker */}
        <Marker 
            position={DEPOT_COORDS} 
            icon={createMarkerIcon('#1e293b', '🏠', true)}
        >
            <Popup className="rounded-xl overflow-hidden">
                <div className="p-1">
                    <div className="font-black text-slate-900 text-sm">Holland Food Service</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Hoofdkantoor Wijchen</div>
                </div>
            </Popup>
        </Marker>

        {routes.map((route, rIdx) => {
          const color = ROUTE_COLORS[rIdx % ROUTE_COLORS.length];
          // Filter stops met geldige coördinaten
          const validStops = route.stops.filter(s => s.lat != null && s.lng != null && s.lat !== 0);
          
          const polylinePoints: [number, number][] = [
            DEPOT_COORDS,
            ...validStops.map(s => [s.lat!, s.lng!] as [number, number]),
            DEPOT_COORDS
          ];

          return (
            <React.Fragment key={rIdx}>
              {polylinePoints.length > 2 && (
                <>
                  {/* Outer Glow / Border for the line */}
                  <Polyline 
                    positions={polylinePoints} 
                    pathOptions={{ color: 'white', weight: 8, opacity: 0.4 }} 
                  />
                  {/* Main Route Line */}
                  <Polyline 
                    positions={polylinePoints} 
                    pathOptions={{ color, weight: 5, opacity: 0.9, lineJoin: 'round' }} 
                  />
                </>
              )}
              
              {route.stops.map((stop, sIdx) => {
                if (stop.lat == null || stop.lng == null || stop.lat === 0) return null;
                
                let label = '';
                if (stop.type === 'DELIVERY') {
                  // Tel hoeveelste aflevering dit is in deze route
                  label = (route.stops.slice(0, sIdx + 1).filter(s => s.type === 'DELIVERY').length).toString();
                } else if (stop.type === 'BREAK') {
                    label = '☕';
                } else if (stop.type === 'IDLE') {
                    label = '⏳';
                } else {
                    label = '•';
                }

                return (
                    <Marker 
                      key={`${rIdx}-${sIdx}`} 
                      position={[stop.lat, stop.lng]} 
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
        })}
        
        <MapAutoCenter routes={routes} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
