import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Route, Vehicle, VehicleType, FuelType } from '../types';
import { Truck, Car, Zap, Fuel, Sun, Snowflake } from 'lucide-react';

interface RouteStatsProps {
  routes: Route[];
  vehicles: Vehicle[];
}

// Custom Axis Tick to show Icon + ID in Fleet Management style
const CustomYAxisTick = ({ x, y, payload, vehicles }: any) => {
  const vehicle = vehicles.find((v: Vehicle) => v.id === payload.value);
  
  const isTruck = vehicle ? vehicle.type === VehicleType.TRUCK : true;
  // Fix: use snake_case property
  const isElectric = vehicle ? vehicle.fuel_type === FuelType.ELECTRIC : false;

  return (
    <foreignObject x={x - 110} y={y - 14} width={105} height={28}>
      <div className="flex items-center justify-end gap-2 h-full w-full pr-2">
         {/* Icon container matching Fleet Management style (scaled down) */}
         <div className={`relative shrink-0 flex items-center justify-center w-7 h-7 rounded-lg shadow-sm border ${
             isElectric 
               ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
               : 'bg-slate-100 text-slate-700 border-slate-200'
         }`}>
            {isTruck ? <Truck size={14} strokeWidth={1.5} /> : <Car size={14} strokeWidth={1.5} />}
            
            {/* Tiny badge for fuel type */}
             <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white flex items-center justify-center ${
                isElectric ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
            }`}>
                {isElectric ? <Zap size={6} fill="currentColor" /> : <Fuel size={6} />}
            </div>
         </div>
         
         <span className="text-xs font-medium text-slate-600 truncate leading-none">
            {payload.value}
         </span>
      </div>
    </foreignObject>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg text-xs">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        
        {/* Chilled Stats */}
        <div className="flex items-center gap-2 mb-1">
            <Sun size={12} className="text-orange-500" />
            <span className="text-slate-600">Koel:</span>
            <span className="font-semibold text-orange-600">
                {data.chilledUsed} / {data.chilledCap} ({data.chilledPct}%)
            </span>
        </div>

        {/* Frozen Stats */}
        <div className="flex items-center gap-2">
            <Snowflake size={12} className="text-blue-500" />
            <span className="text-slate-600">Vries:</span>
            <span className="font-semibold text-blue-600">
                {data.frozenUsed} / {data.frozenCap} ({data.frozenPct}%)
            </span>
        </div>
      </div>
    );
  }
  return null;
};

export const CapacityChart: React.FC<RouteStatsProps> = ({ routes, vehicles }) => {
  const data = routes.map(r => {
    const vehicle = vehicles.find(v => v.id === r.vehicleId);
    
    // Determine capacity
    const chilledCap = vehicle?.capacity.chilled || 1;
    const frozenCap = vehicle?.capacity.frozen || 1;

    // Determine usage
    // Note: The AI returns totalContainersChilled/Frozen. 
    // If not present in old mocks, fall back to simple estimation or 0
    const chilledUsed = r.totalContainersChilled || 0;
    const frozenUsed = r.totalContainersFrozen || 0;
    
    return {
        name: r.vehicleId, 
        
        // Percentages for the bars
        chilledPct: Math.min(100, Math.round((chilledUsed / chilledCap) * 100)),
        frozenPct: Math.min(100, Math.round((frozenUsed / frozenCap) * 100)),

        // Absolute values for tooltip
        chilledUsed,
        frozenUsed,
        chilledCap,
        frozenCap
    };
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            barGap={4} // Gap between the two bars of the same vehicle
            barCategoryGap={16} // Gap between different vehicles
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={110} 
            tick={<CustomYAxisTick vehicles={vehicles} />} 
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          
          <Bar dataKey="chilledPct" name="Koelcapaciteit (%)" fill="#fb923c" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="frozenPct" name="Vriescapaciteit (%)" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};