"use client";
import { useState, useEffect, useRef } from 'react';
import { Activity, Globe, ShieldAlert, Cpu, Terminal, Zap, Crosshair, Radar } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarGraph } from 'recharts';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function Dashboard() {
  const [btcHistory, setBtcHistory] = useState<any[]>([]);
  const [currentBtc, setCurrentBtc] = useState(0);
  const [quakes, setQuakes] = useState<any[]>([]);
  const [sysTime, setSysTime] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // Threat Matrix Data (Dynamic)
  const [threatMatrix, setThreatMatrix] = useState([
    { subject: 'DDoS', A: 120, fullMark: 150 },
    { subject: 'Malware', A: 98, fullMark: 150 },
    { subject: 'Phishing', A: 86, fullMark: 150 },
    { subject: 'Zero-Day', A: 99, fullMark: 150 },
    { subject: 'Intrusion', A: 85, fullMark: 150 },
    { subject: 'Exfil', A: 65, fullMark: 150 },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll terminal to bottom
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  useEffect(() => {
    const fetchHeavyTelemetry = async () => {
      try {
        // 1. FININT: High-Resolution BTC Chart Data (Last 20 minutes)
        const btcRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=20');
        const btcData = await btcRes.json();
        const formattedBtc = btcData.map((d: any) => ({
          time: new Date(d[0]).toLocaleTimeString([], { hour12: false, minute: '2-digit', second:'2-digit' }),
          price: parseFloat(d[4]) // Close price
        }));
        setBtcHistory(formattedBtc);
        setCurrentBtc(formattedBtc[formattedBtc.length - 1].price);

        // 2. GEOINT: Global Kinetic Nodes
        const quakeRes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        const quakeData = await quakeRes.json();
        setQuakes(quakeData.features.slice(0, 20));
      } catch (e) {
        console.error("Telemetry failure", e);
      }
    };

    fetchHeavyTelemetry();
    const macroInterval = setInterval(fetchHeavyTelemetry, 10000); // 10s refresh for heavy APIs

    // 3. SIGINT: High-Frequency Terminal Emulator & Radar Shifter
    const microInterval = setInterval(() => {
      setSysTime(new Date().toISOString());
      
      // Shift Threat Matrix slightly to simulate live analysis
      setThreatMatrix(prev => prev.map(t => ({
        ...t,
        A: Math.max(40, Math.min(140, t.A + (Math.random() * 10 - 5)))
      })));

      // Generate Raw Terminal Logs
      const ips = ["192.168.1.", "10.0.0.", "172.16.254.", "45.22.", "8.8.8."];
      const ports = ["443", "80", "22", "8080", "3389"];
      const actions = ["PACKET_INTERCEPT", "PORT_SCAN_DETECTED", "HANDSHAKE_FAIL", "AUTH_BYPASS_ATTEMPT"];
      const newLog = `[${new Date().toISOString().split('T')[1]}] ${actions[Math.floor(Math.random()*actions.length)]} -> ${ips[Math.floor(Math.random()*ips.length)]}${Math.floor(Math.random()*255)}:${ports[Math.floor(Math.random()*ports.length)]}`;
      
      setTerminalLogs(prev => [...prev.slice(-40), newLog]); // Keep last 40 lines
    }, 800);

    return () => {
      clearInterval(macroInterval);
      clearInterval(microInterval);
    };
  }, []);

  return (
    <div className="min-h-screen p-2 md:p-4 flex flex-col gap-4 bg-[#020202] text-[#e5e5e5] font-mono overflow-hidden">
      
      {/* COMMAND HEADER */}
      <header className="flex justify-between items-end border-b border-[#333] pb-2">
        <div className="flex items-center gap-3">
          <Globe className="text-[#00ffcc] animate-spin-slow" size={24} />
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-widest text-white uppercase text-shadow-glow">
              OASIS // OMNI-NODE
            </h1>
            <div className="text-[9px] md:text-xs text-gray-500 tracking-[0.4em] uppercase">Distributed Intelligence Fusion Matrix</div>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-[10px] tracking-widest text-[#00ffcc]">SYS_CLOCK: {sysTime}</div>
          <div className="text-[9px] text-gray-500 tracking-widest">SAT_UPLINK: ACTIVE | ENCRYPTION: AES-256</div>
        </div>
      </header>

      {/* TACTICAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow max-h-[calc(100vh-80px)]">
        
        {/* LEFT FLANK: SIGINT & Threat Vectors */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
          {/* Threat Radar */}
          <div className="border border-[#222] bg-[#050505] p-3 relative h-1/3 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ff3366]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
              <Radar size={12} className="text-[#ff3366]" /> Global Threat Matrix
            </h2>
            <div className="flex-grow w-full h-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={threatMatrix}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 9 }} />
                  <Radar name="Threat Level" dataKey="A" stroke="#ff3366" fill="#ff3366" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Raw Terminal Stream */}
          <div className="border border-[#222] bg-[#050505] p-3 relative h-2/3 flex flex-col overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ffcc]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
              <Terminal size={12} className="text-[#00ffcc]" /> RAW_OSINT_STREAM
            </h2>
            <div className="flex-grow overflow-y-auto text-[9px] text-[#00ffcc] opacity-80 leading-relaxed pr-2 custom-scrollbar font-mono tracking-tight">
              {terminalLogs.map((log, i) => (
                <div key={i} className={log.includes('FAIL') || log.includes('DETECTED') ? 'text-[#ff3366]' : ''}>
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: GEOINT Map */}
        <div className="lg:col-span-6 border border-[#222] bg-[#030303] relative flex flex-col h-full min-h-[400px]">
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
            <Crosshair size={14} className="text-[#555]" />
            <span className="text-[10px] text-[#555] uppercase tracking-widest shadow-black drop-shadow-md">Kinetic Topography</span>
          </div>
          <div className="absolute top-3 right-3 z-10 text-[9px] text-gray-600 text-right">
            <div>ACTIVE NODES: {quakes.length}</div>
            <div className="text-[#ff3366]">CRITICAL: {quakes.filter(q => q.properties.mag > 4.5).length}</div>
          </div>
          
          <div className="flex-grow flex items-center justify-center w-full h-full overflow-hidden">
            <ComposableMap projectionConfig={{ scale: 160 }} className="w-full h-[120%] opacity-90">
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
              {quakes.map((q, i) => (
                <Marker key={i} coordinates={[q.geometry.coordinates[0], q.geometry.coordinates[1]]}>
                  <circle r={q.properties.mag > 4.5 ? 3 : 1.5} fill={q.properties.mag > 4.5 ? "#ff3366" : "#00ffcc"} />
                  {q.properties.mag > 4.5 && <circle r={8} fill="none" stroke="#ff3366" strokeWidth="0.5" className="animate-ping opacity-60" />}
                </Marker>
              ))}
            </ComposableMap>
          </div>
          {/* Aesthetic Scanner Line */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,255,204,0.05)] to-transparent h-4 w-full animate-[scan_4s_linear_infinite] pointer-events-none border-b border-[#00ffcc]/20"></div>
        </div>

        {/* RIGHT FLANK: FININT & Asset Telemetry */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full">
          
          {/* Financial Chart Engine */}
          <div className="border border-[#222] bg-[#050505] p-3 relative h-1/2 flex flex-col">
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
                      <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px', color: '#fff' }}
                    itemStyle={{ color: '#00ffcc' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#00ffcc" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Node Status / Diagnostics */}
          <div className="border border-[#222] bg-[#050505] p-3 relative h-1/2 flex flex-col">
             <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-600"></div>
             <h2 className="text-[#555] text-[10px] font-bold uppercase mb-4 flex items-center gap-2">
              <Cpu size={12} className="text-gray-500" /> System Diagnostics
            </h2>
            <div className="space-y-4 flex-grow flex flex-col justify-center">
              <div>
                <div className="flex justify-between text-[9px] text-gray-500 mb-1"><span>MEMORY_HEAP</span><span>84%</span></div>
                <div className="w-full bg-[#111] h-1 rounded-none"><div className="bg-[#ffaa00] h-full w-[84%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-gray-500 mb-1"><span>NETWORK_IO</span><span>SECURE</span></div>
                <div className="w-full bg-[#111] h-1 rounded-none"><div className="bg-[#00ffcc] h-full w-[100%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-gray-500 mb-1"><span>ENCRYPTION_KEY_ROTATION</span><span>PENDING</span></div>
                <div className="w-full bg-[#111] h-1 rounded-none"><div className="bg-gray-500 h-full w-[45%]"></div></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tailwind Custom Animation Injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(800px); }
        }
        .text-shadow-glow { text-shadow: 0 0 10px rgba(0, 255, 204, 0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; }
      `}} />
    </div>
  );
}
