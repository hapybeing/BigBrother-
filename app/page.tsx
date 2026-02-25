"use client";
import { useState, useEffect } from 'react';
import { Activity, Globe, ShieldAlert, Cpu } from 'lucide-react';

export default function Dashboard() {
  const [btcPrice, setBtcPrice] = useState('SYNCING...');
  const [quakes, setQuakes] = useState<any[]>([]);
  const [time, setTime] = useState('');

  // The Intelligence Engine: Polling live data
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        // Stream 1: Financial Data
        const btcRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const btcData = await btcRes.json();
        setBtcPrice(parseFloat(btcData.price).toFixed(2));

        // Stream 2: Global Seismic Events
        const quakeRes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
        const quakeData = await quakeRes.json();
        setQuakes(quakeData.features.slice(0, 5)); // Grab the 5 most recent events
      } catch (e) {
        console.error("Telemetry failure", e);
      }
    };

    // Initial fetch and set interval for live updates
    fetchTelemetry();
    const dataInterval = setInterval(fetchTelemetry, 5000); // Poll every 5 seconds
    
    // Live System Clock
    const clockInterval = setInterval(() => {
      setTime(new Date().toISOString());
    }, 1000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(clockInterval);
    };
  }, []);

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6">
      {/* Header Bar */}
      <header className="flex justify-between items-center border-b border-[#333] pb-4">
        <div className="flex items-center gap-3">
          <Globe className="text-[#00ffcc]" size={28} />
          <h1 className="text-2xl font-bold tracking-widest text-white uppercase">BigBrother // Global Node</h1>
        </div>
        <div className="text-xs tracking-widest text-[#00ffcc] animate-pulse">
          SYS_TIME: {time || 'AWAITING UPLINK...'}
        </div>
      </header>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
        
        {/* Module 1: Market Intelligence */}
        <div className="border border-[#333] bg-[#0a0a0a] p-5 rounded-sm relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffcc] opacity-50"></div>
          <h2 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
            <Activity size={14} className="text-[#00ffcc]" /> Financial Subsystem
          </h2>
          <div className="text-4xl font-light text-white mb-1 tracking-wider">
            ${btcPrice}
          </div>
          <div className="text-xs text-gray-600 uppercase">BTC/USDT Real-Time Feed</div>
        </div>

        {/* Module 2: Global Threat/Event Tracker */}
        <div className="border border-[#333] bg-[#0a0a0a] p-5 rounded-sm relative overflow-hidden md:col-span-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#ff3366] opacity-50"></div>
          <h2 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
            <ShieldAlert size={14} className="text-[#ff3366]" /> Global Seismic Alerts (Past 1H)
          </h2>
          <ul className="space-y-3">
            {quakes.length > 0 ? quakes.map((q, i) => (
              <li key={i} className="flex justify-between items-center text-sm border-b border-[#222] pb-2">
                <span className="text-gray-300 truncate pr-4">{q.properties.place}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded bg-[#111] ${q.properties.mag > 2.5 ? 'text-[#ff3366] border border-[#ff3366]/30' : 'text-gray-400 border border-gray-700'}`}>
                  MAG: {q.properties.mag.toFixed(1)}
                </span>
              </li>
            )) : <li className="text-gray-600 text-xs animate-pulse">Awaiting global telemetry...</li>}
          </ul>
        </div>

        {/* Module 3: System Status */}
        <div className="border border-[#333] bg-[#0a0a0a] p-5 rounded-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gray-500 opacity-50"></div>
           <h2 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
            <Cpu size={14} className="text-gray-400" /> Core Diagnostics
          </h2>
          <div className="space-y-3 text-xs tracking-wider">
            <div className="flex justify-between border-b border-[#222] pb-1"><span className="text-gray-600">NETWORK:</span><span className="text-[#00ffcc]">SECURE</span></div>
            <div className="flex justify-between border-b border-[#222] pb-1"><span className="text-gray-600">LATENCY:</span><span className="text-white">OPTIMAL</span></div>
            <div className="flex justify-between"><span className="text-gray-600">PROTOCOLS:</span><span className="text-white">ACTIVE</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
