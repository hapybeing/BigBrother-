"use client";
import { useState, useEffect } from 'react';
import { Activity, Globe, ShieldAlert, Cpu, Crosshair, Terminal, Zap } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// TopoJSON for the global map
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function Dashboard() {
  const [btcPrice, setBtcPrice] = useState('SYNCING...');
  const [mempool, setMempool] = useState({ fastestFee: 0, halfHourFee: 0 });
  const [quakes, setQuakes] = useState<any[]>([]);
  const [time, setTime] = useState('');

  // The Intelligence Engine: Polling live public data feeds
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        // Feed 1: Financial Telemetry (Binance)
        const btcRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        const btcData = await btcRes.json();
        setBtcPrice(parseFloat(btcData.price).toFixed(2));

        // Feed 2: Blockchain Network Congestion (Mempool.space)
        const mempoolRes = await fetch('https://mempool.space/api/v1/fees/recommended');
        const mempoolData = await mempoolRes.json();
        setMempool(mempoolData);

        // Feed 3: Global Kinetic Events (USGS - mapped to nodes)
        const quakeRes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        const quakeData = await quakeRes.json();
        setQuakes(quakeData.features.slice(0, 15)); // Top 15 recent global events
      } catch (e) {
        console.error("Telemetry failure", e);
      }
    };

    fetchTelemetry();
    const dataInterval = setInterval(fetchTelemetry, 8000); // High-frequency polling
    
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
    <div className="min-h-screen p-4 md:p-6 flex flex-col gap-6 bg-[#050505] text-[#e5e5e5] font-mono overflow-hidden">
      
      {/* Top Navigation / Command Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#333] pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Globe className="text-[#00ffcc] animate-pulse" size={32} />
          <div>
            <h1 className="text-2xl font-bold tracking-widest text-white uppercase shadow-[#00ffcc] drop-shadow-md">
              BigBrother // Node_Alpha
            </h1>
            <div className="text-[10px] text-gray-500 tracking-[0.3em] uppercase">Global Intelligence Subsystem</div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs tracking-widest text-[#00ffcc]">
            SYS_TIME: {time || 'AWAITING UPLINK...'}
          </div>
          <div className="text-[10px] text-gray-500 tracking-widest flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> UPLINK SECURE
          </div>
        </div>
      </header>

      {/* Main Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        
        {/* Left Column: Active Global Alerts */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="border border-[#333] bg-[#0a0a0a] p-4 rounded-sm relative h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#ff3366] opacity-50"></div>
            <h2 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <ShieldAlert size={14} className="text-[#ff3366]" /> Kinetic Threat Vectors
            </h2>
            <div className="overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              <ul className="space-y-3">
                {quakes.length > 0 ? quakes.map((q, i) => (
                  <li key={i} className="flex flex-col text-sm border-b border-[#222] pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-gray-300 font-bold truncate pr-2 text-xs">{q.properties.place.toUpperCase()}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#111] ${q.properties.mag > 4.5 ? 'text-[#ff3366] border border-[#ff3366]' : 'text-[#00ffcc] border border-[#00ffcc]/30'}`}>
                        M{q.properties.mag.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-600 flex justify-between">
                      <span>LAT: {q.geometry.coordinates[1].toFixed(2)}</span>
                      <span>LON: {q.geometry.coordinates[0].toFixed(2)}</span>
                    </div>
                  </li>
                )) : <li className="text-gray-600 text-xs animate-pulse">Scanning global networks...</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Center Column: The Palantir Map */}
        <div className="lg:col-span-6 border border-[#333] bg-[#080808] relative rounded-sm flex items-center justify-center overflow-hidden min-h-[400px]">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <Crosshair size={16} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-widest">Global Node Topology</span>
          </div>
          
          <ComposableMap 
            projectionConfig={{ scale: 140 }} 
            className="w-full h-full opacity-80"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#111111"
                    stroke="#333333"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "#1a1a1a", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            {/* Map the kinetic events as glowing nodes */}
            {quakes.map((q, i) => (
              <Marker key={i} coordinates={[q.geometry.coordinates[0], q.geometry.coordinates[1]]}>
                <circle r={q.properties.mag > 4.5 ? 4 : 2} fill={q.properties.mag > 4.5 ? "#ff3366" : "#00ffcc"} className="animate-pulse" />
                {q.properties.mag > 4.5 && (
                  <circle r={8} fill="none" stroke="#ff3366" strokeWidth="0.5" className="animate-ping opacity-75" />
                )}
              </Marker>
            ))}
          </ComposableMap>
          
          {/* Overlay Grid lines for aesthetic */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
        </div>

        {/* Right Column: Macro Telemetry */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Market Node */}
          <div className="border border-[#333] bg-[#0a0a0a] p-4 rounded-sm relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#00ffcc] opacity-50"></div>
            <h2 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <Activity size={14} className="text-[#00ffcc]" /> Apex Asset Tracker
            </h2>
            <div className="text-4xl font-light text-white mb-1 tracking-wider">
              ${btcPrice}
            </div>
            <div className="text-[10px] text-gray-600 uppercase flex items-center justify-between">
              <span>BTC/USDT LIVE PAIR</span>
              <span className="text-[#00ffcc] flex items-center gap-1"><Zap size={10} /> LIVE</span>
            </div>
          </div>

          {/* Network Node */}
          <div className="border border-[#333] bg-[#0a0a0a] p-4 rounded-sm relative flex-grow">
             <div className="absolute top-0 left-0 w-full h-1 bg-gray-500 opacity-50"></div>
             <h2 className="text-gray-500 text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <Cpu size={14} className="text-gray-400" /> Blockchain Mempool
            </h2>
            <div className="space-y-4 text-xs tracking-wider">
              <div className="flex flex-col border-b border-[#222] pb-2">
                <span className="text-gray-600 text-[10px]">HIGH PRIORITY TX FEE</span>
                <span className="text-white text-lg">{mempool.fastestFee || '--'} <span className="text-[10px] text-gray-500">sat/vB</span></span>
              </div>
              <div className="flex flex-col border-b border-[#222] pb-2">
                <span className="text-gray-600 text-[10px]">STANDARD TX FEE</span>
                <span className="text-white text-lg">{mempool.halfHourFee || '--'} <span className="text-[10px] text-gray-500">sat/vB</span></span>
              </div>
              <div className="pt-2">
                <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-2"><Terminal size={10} /> SYS_STATUS</div>
                <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
                   <div className="bg-[#00ffcc] h-full w-[85%]"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
