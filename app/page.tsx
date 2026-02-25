"use client";
import { useState, useEffect, useRef } from 'react';
import { Activity, Globe, ShieldAlert, Cpu, Terminal, Zap, Crosshair, Radar as RadarIcon, Target } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { ResponsiveContainer, AreaChart, Area, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, YAxis } from 'recharts';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function Dashboard() {
  const [btcHistory, setBtcHistory] = useState<any[]>([]);
  const [currentBtc, setCurrentBtc] = useState(0);
  const [quakes, setQuakes] = useState<any[]>([]);
  const [cveLogs, setCveLogs] = useState<any[]>([]);
  const [sysTime, setSysTime] = useState('');
  const [activeTarget, setActiveTarget] = useState<any>(null); // New Data Fusion State
  
  const [threatMatrix, setThreatMatrix] = useState([
    { subject: 'DDoS', A: 120, fullMark: 150 },
    { subject: 'Malware', A: 98, fullMark: 150 },
    { subject: 'Phishing', A: 86, fullMark: 150 },
    { subject: 'Zero-Day', A: 99, fullMark: 150 },
    { subject: 'Intrusion', A: 85, fullMark: 150 },
    { subject: 'Exfil', A: 65, fullMark: 150 },
  ]);

  useEffect(() => {
    const fetchHeavyTelemetry = async () => {
      try {
        // 1. FININT: BTC Chart Data
        const btcRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=25');
        const btcData = await btcRes.json();
        const formattedBtc = btcData.map((d: any) => ({
          time: new Date(d[0]).toLocaleTimeString([], { hour12: false, minute: '2-digit', second:'2-digit' }),
          price: parseFloat(d[4])
        }));
        setBtcHistory(formattedBtc);
        setCurrentBtc(formattedBtc[formattedBtc.length - 1].price);

        // 2. GEOINT: Global Kinetic Nodes
        const quakeRes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        const quakeData = await quakeRes.json();
        setQuakes(quakeData.features.slice(0, 20));

        // 3. SIGINT: Real-time CVE / Bug Bounty OSINT Feed
        // Pulling the latest published vulnerability repositories
        const cveRes = await fetch('https://api.github.com/search/repositories?q=CVE-2025+OR+CVE-2026&sort=updated&order=desc&per_page=15');
        const cveData = await cveRes.json();
        if (cveData.items) {
          setCveLogs(cveData.items);
        }

      } catch (e) {
        console.error("Telemetry failure", e);
      }
    };

    fetchHeavyTelemetry();
    // 15-second refresh to respect GitHub public API rate limits
    const macroInterval = setInterval(fetchHeavyTelemetry, 15000); 

    const microInterval = setInterval(() => {
      setSysTime(new Date().toISOString());
      
      setThreatMatrix(prev => prev.map(t => ({
        ...t,
        A: Math.max(40, Math.min(140, t.A + (Math.random() * 10 - 5)))
      })));
    }, 1000);

    return () => {
      clearInterval(macroInterval);
      clearInterval(microInterval);
    };
  }, []);

  return (
    <div className="h-screen w-screen p-2 md:p-4 flex flex-col gap-3 bg-[#020202] text-[#e5e5e5] font-mono overflow-hidden box-border select-none">
      
      {/* COMMAND HEADER */}
      <header className="flex-none flex justify-between items-end border-b border-[#333] pb-2">
        <div className="flex items-center gap-3">
          <Globe className="text-[#00ffcc] animate-pulse" size={24} />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white uppercase text-shadow-glow">
              OASIS // OMNI-NODE
            </h1>
            <div className="text-[9px] text-gray-500 tracking-[0.4em] uppercase">Distributed Intelligence Fusion Matrix</div>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-[10px] tracking-widest text-[#00ffcc]">SYS_CLOCK: {sysTime}</div>
          <div className="text-[9px] text-gray-500 tracking-widest">SAT_UPLINK: ACTIVE | ENCRYPTION: AES-256</div>
        </div>
      </header>

      {/* TACTICAL GRID */}
      <div className="grid grid-cols-12 gap-3 flex-grow min-h-0">
        
        {/* LEFT FLANK: Threat Vectors & OSINT */}
        <div className="col-span-4 lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
          
          <div className="border border-[#222] bg-[#050505] p-2 relative flex-none h-[40%] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ff3366]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-1 flex items-center gap-2">
              <RadarIcon size={12} className="text-[#ff3366]" /> Global Threat Matrix
            </h2>
            <div className="flex-grow w-full h-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={threatMatrix}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 8 }} />
                  <Radar name="Threat Level" dataKey="A" stroke="#ff3366" fill="#ff3366" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* REAL ZERO-DAY OSINT FEED */}
          <div className="border border-[#222] bg-[#050505] p-2 relative flex-grow flex flex-col min-h-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ffaa00]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-2 flex items-center gap-2 flex-none">
              <Terminal size={12} className="text-[#ffaa00]" /> LIVE_CVE_INTERCEPT
            </h2>
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {cveLogs.length > 0 ? cveLogs.map((repo, i) => (
                <div key={i} className="mb-3 border-b border-[#111] pb-2 last:border-0">
                  <div className="text-[#ffaa00] text-[10px] font-bold break-all">[{repo.name.toUpperCase()}]</div>
                  <div className="text-gray-400 text-[8px] mt-1 leading-tight tracking-tight">
                    {repo.description ? repo.description.substring(0, 80) + '...' : 'NO_PAYLOAD_DESCRIPTION_PROVIDED'}
                  </div>
                  <div className="text-[#333] text-[8px] mt-1 flex justify-between">
                    <span>OWNER: {repo.owner.login}</span>
                    <span>{new Date(repo.updated_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              )) : <div className="text-[#ffaa00] text-[9px] animate-pulse">AWAITING CVE PAYLOADS...</div>}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Interactive GEOINT Map */}
        <div className="col-span-4 lg:col-span-6 border border-[#222] bg-[#030303] relative flex flex-col h-full min-h-0 overflow-hidden">
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
            <Crosshair size={14} className="text-[#555]" />
            <span className="text-[10px] text-[#555] uppercase tracking-widest shadow-black drop-shadow-md">Kinetic Topography (INTERACTIVE)</span>
          </div>
          
          <div className="flex-grow flex items-center justify-center w-full h-full relative mt-4">
            <ComposableMap projectionConfig={{ scale: 140 }} className="w-full h-full opacity-90 absolute inset-0 m-auto cursor-crosshair">
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#0a0a0a"
                      stroke="#222"
                      strokeWidth={0.5}
                      style={{ default: { outline: "none" }, hover: { fill: "#111", outline: "none" }, pressed: { outline: "none" } }}
                    />
                  ))
                }
              </Geographies>
              {quakes.map((q, i) => {
                const isSelected = activeTarget && activeTarget.id === q.id;
                return (
                  <Marker 
                    key={i} 
                    coordinates={[q.geometry.coordinates[0], q.geometry.coordinates[1]]}
                    onClick={() => setActiveTarget(q)}
                  >
                    <circle r={q.properties.mag > 4.5 ? 4 : 2} fill={q.properties.mag > 4.5 ? "#ff3366" : "#00ffcc"} className="cursor-pointer transition-all hover:r-6" />
                    {isSelected && (
                      <g className="animate-spin-slow">
                        <circle r={12} fill="none" stroke="#fff" strokeWidth="0.5" strokeDasharray="2 2" />
                        <line x1="-15" y1="0" x2="-8" y2="0" stroke="#fff" strokeWidth="1" />
                        <line x1="8" y1="0" x2="15" y2="0" stroke="#fff" strokeWidth="1" />
                        <line x1="0" y1="-15" x2="0" y2="-8" stroke="#fff" strokeWidth="1" />
                        <line x1="0" y1="8" x2="0" y2="15" stroke="#fff" strokeWidth="1" />
                      </g>
                    )}
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,255,204,0.05)] to-transparent h-4 w-full animate-[scan_4s_linear_infinite] pointer-events-none border-b border-[#00ffcc]/20"></div>
        </div>

        {/* RIGHT FLANK: FININT & Target Telemetry */}
        <div className="col-span-4 lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
          
          {/* Volatile Financial Chart Engine */}
          <div className="border border-[#222] bg-[#050505] p-2 relative flex-none h-[50%] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ffcc]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-2 flex justify-between items-center">
              <span className="flex items-center gap-2"><Activity size={12} className="text-[#00ffcc]" /> FININT: BTC/USDT</span>
              <span className="text-white text-sm tracking-wider font-light">${currentBtc.toFixed(2)}</span>
            </h2>
            <div className="flex-grow w-full h-full -ml-4">
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={btcHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px', color: '#fff' }} />
                  {/* Dynamic Y-Axis Scaling for High Volatility */}
                  <YAxis type="number" domain={['dataMin', 'dataMax']} hide />
                  <Area type="monotone" dataKey="price" stroke="#00ffcc" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DYNAMIC TARGET LOCK PANEL */}
          <div className="border border-[#222] bg-[#050505] p-3 relative flex-grow flex flex-col min-h-0 transition-all duration-300">
             <div className={`absolute top-0 left-0 w-full h-0.5 ${activeTarget ? 'bg-[#ff3366]' : 'bg-gray-600'}`}></div>
             <h2 className={`text-[10px] font-bold uppercase mb-4 flex items-center gap-2 ${activeTarget ? 'text-[#ff3366]' : 'text-[#555]'}`}>
              {activeTarget ? <Target size={12} className="animate-pulse" /> : <Cpu size={12} />} 
              {activeTarget ? 'TARGET_LOCK_ACQUIRED' : 'SYSTEM_DIAGNOSTICS'}
            </h2>
            
            {activeTarget ? (
              <div className="space-y-3 flex-grow flex flex-col">
                <div className="text-white text-xs font-bold border-b border-[#222] pb-2 leading-tight">
                  {activeTarget.properties.place.toUpperCase()}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px] tracking-wider text-gray-400 mt-2">
                  <div className="flex flex-col"><span className="text-[#555]">MAGNITUDE</span><span className={`text-lg font-bold ${activeTarget.properties.mag > 4.5 ? 'text-[#ff3366]' : 'text-[#00ffcc]'}`}>{activeTarget.properties.mag.toFixed(1)}</span></div>
                  <div className="flex flex-col"><span className="text-[#555]">DEPTH</span><span className="text-white text-lg">{activeTarget.geometry.coordinates[2].toFixed(1)} <span className="text-[8px]">KM</span></span></div>
                </div>
                <div className="mt-auto space-y-1">
                  <div className="flex justify-between text-[8px] border-b border-[#111] pb-1"><span className="text-[#555]">LAT:</span><span className="text-white">{activeTarget.geometry.coordinates[1].toFixed(4)}</span></div>
                  <div className="flex justify-between text-[8px] border-b border-[#111] pb-1"><span className="text-[#555]">LON:</span><span className="text-white">{activeTarget.geometry.coordinates[0].toFixed(4)}</span></div>
                  <div className="flex justify-between text-[8px]"><span className="text-[#555]">STATUS:</span><span className="text-[#ff3366] animate-pulse">MONITORING</span></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-grow flex flex-col justify-center">
                <div>
                  <div className="flex justify-between text-[9px] text-gray-500 mb-1"><span>MEMORY_HEAP</span><span>84%</span></div>
                  <div className="w-full bg-[#111] h-1 rounded-none"><div className="bg-[#ffaa00] h-full w-[84%]"></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-[9px] text-gray-500 mb-1"><span>SENSOR_ARRAY</span><span>AWAITING INPUT</span></div>
                  <div className="w-full bg-[#111] h-1 rounded-none"><div className="bg-gray-700 h-full w-[100%]"></div></div>
                </div>
                <div className="text-[8px] text-center text-gray-600 mt-4 animate-pulse">TAP A MAP NODE TO INITIATE TARGET LOCK</div>
              </div>
            )}
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(800px); }
        }
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          transform-origin: center;
          animation: spin-slow 8s linear infinite;
        }
        .text-shadow-glow { text-shadow: 0 0 10px rgba(0, 255, 204, 0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
      `}} />
    </div>
  );
}
